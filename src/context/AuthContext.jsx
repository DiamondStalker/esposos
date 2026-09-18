import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

const DIVOON_URL   = process.env.REACT_APP_DIVOON_URL;
const CLIENT_ID    = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
  `${window.location.origin}/oauth-callback.html`;

// ── localStorage para el access token de Calendar ───────────────────────────
// Dura ~1 h en Google, pero Divoon renueva automáticamente con el refresh token
// cuando Calendar devuelve 401. El usuario nunca necesita re-autenticarse.
const STORAGE_KEY = 'cal_token';

function readToken()      { try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; } }
function saveToken(token) { try { token ? localStorage.setItem(STORAGE_KEY, token) : localStorage.removeItem(STORAGE_KEY); } catch {} }

// ── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':         return { ...state, user: action.user, loading: false, accessDenied: false };
    case 'SET_TOKEN':        return { ...state, accessToken: action.accessToken, calendarChecked: true };
    case 'CLEAR_TOKEN':      return { ...state, accessToken: null };
    case 'CALENDAR_CHECKED': return { ...state, calendarChecked: true };
    case 'ACCESS_DENIED':    return { ...state, user: null, loading: false, accessDenied: true };
    case 'SIGNED_OUT':       return { ...state, user: null, loading: false, accessToken: null, calendarChecked: false };
    default:                 return state;
  }
}

// ── Whitelist ─────────────────────────────────────────────────────────────────
async function checkWhitelist(currentUser) {
  const snap = await getDoc(doc(db, 'config', 'whitelist'));
  const emails = snap.exists() ? snap.data().emails || [] : [];
  return emails.includes(currentUser.email);
}

// ── Popup de Google Calendar OAuth ───────────────────────────────────────────
// Abre una ventana emergente, el usuario autoriza Calendar una sola vez,
// la ventana manda el código via postMessage y se cierra sola.
function openCalendarOAuthPopup() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('REACT_APP_GOOGLE_CLIENT_ID no configurado'));
      return;
    }

    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         'https://www.googleapis.com/auth/calendar',
      access_type:   'offline',
      prompt:        'consent', // fuerza que Google emita refresh_token
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'calendar_oauth',
      'width=500,height=620,left=400,top=100',
    );

    if (!popup) {
      reject(new Error('El navegador bloqueó el popup'));
      return;
    }

    const onMessage = (evt) => {
      if (evt.origin !== window.location.origin) return;
      if (evt.data?.type !== 'CALENDAR_OAUTH') return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      evt.data.error ? reject(new Error(evt.data.error)) : resolve(evt.data.code);
    };

    window.addEventListener('message', onMessage);

    // Timeout de 2 minutos por si el usuario cierra el popup sin autorizar
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('Tiempo de espera agotado'));
    }, 120_000);
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user:            null,
    loading:         true,
    accessDenied:    false,
    accessToken:     readToken(),   // recupera token guardado al abrir la app
    calendarChecked: !!readToken(), // si ya hay token guardado, no hace falta chequear Divoon
  });

  // Ref para acceder al usuario actual desde callbacks estables
  const userRef = useRef(state.user);
  useEffect(() => { userRef.current = state.user; }, [state.user]);

  // Ref para initCalendarAuth — permite llamarlo desde efectos sin deps circulares
  const initCalendarAuthRef = useRef(null);

  // ── Firebase Auth listener ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const allowed = await checkWhitelist(currentUser);
          if (allowed) {
            dispatch({ type: 'SET_USER', user: currentUser });
          } else {
            await signOut(auth);
            saveToken(null);
            dispatch({ type: 'ACCESS_DENIED' });
          }
        } catch {
          await signOut(auth);
          saveToken(null);
          dispatch({ type: 'ACCESS_DENIED' });
        }
      } else {
        saveToken(null);
        dispatch({ type: 'SIGNED_OUT' });
      }
    });
    return () => unsub();
  }, []);

  // ── initCalendarAuth ──────────────────────────────────────────────────────
  // Abre el popup de Google Calendar, recibe el código y lo intercambia en
  // Divoon por un access token (Divoon guarda el refresh token de forma segura).
  const initCalendarAuth = useCallback(async (user) => {
    console.log('[Calendar] initCalendarAuth llamado, DIVOON_URL:', DIVOON_URL, '| CLIENT_ID:', CLIENT_ID?.slice(0,20));
    if (!DIVOON_URL || !CLIENT_ID) {
      console.error('[Calendar] FALTAN ENV VARS — DIVOON_URL o CLIENT_ID no definidos');
      return null;
    }
    try {
      const code    = await openCalendarOAuthPopup();
      const idToken = await user.getIdToken();

      const res = await fetch(`${DIVOON_URL}/auth/calendar/exchange`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken, code, redirectUri: REDIRECT_URI }),
      });

      if (!res.ok) throw new Error(`Divoon exchange: ${res.status}`);

      const { accessToken } = await res.json();
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch (err) {
      console.error('[Calendar] Error en initCalendarAuth:', err.message);
      return null;
    }
  }, []);

  // ── refreshCalendarToken ──────────────────────────────────────────────────
  // Llamado por CalendarioWidget cuando Google devuelve 401 (token expirado).
  // Divoon usa el refresh token guardado para obtener uno nuevo sin popup.
  const refreshCalendarToken = useCallback(async () => {
    const user = userRef.current;
    if (!DIVOON_URL || !user) return null;
    try {
      const idToken = await user.getIdToken();
      const res     = await fetch(`${DIVOON_URL}/auth/calendar/refresh`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) return null;

      const { accessToken } = await res.json();
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch (err) {
      console.error('[Calendar] Error en refreshCalendarToken:', err.message);
      return null;
    }
  }, []); // userRef es un ref, no entra en deps

  // Mantiene el ref actualizado
  initCalendarAuthRef.current = initCalendarAuth;

  // ── Silent calendar auth ───────────────────────────────────────────
  // Cuando hay usuario pero sin cal_token, intenta obtener uno desde Divoon
  // usando el refresh token ya almacenado — sin popup ni interacción.
  // Si Divoon responde 404 (primera vez), marca calendarChecked=true
  // para que needsCalendarAuth sea true y aparezca el overlay.
  useEffect(() => {
    if (!state.user || state.accessToken || state.calendarChecked) return;
    if (!DIVOON_URL) { dispatch({ type: 'CALENDAR_CHECKED' }); return; }

    (async () => {
      try {
        const idToken = await state.user.getIdToken();
        const res     = await fetch(`${DIVOON_URL}/auth/calendar/token`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const { accessToken } = await res.json();
          saveToken(accessToken);
          dispatch({ type: 'SET_TOKEN', accessToken });
        } else {
          dispatch({ type: 'CALENDAR_CHECKED' }); // 404 o error → mostrar overlay
        }
      } catch {
        dispatch({ type: 'CALENDAR_CHECKED' });
      }
    })();
  }, [state.user, state.accessToken, state.calendarChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  // needsCalendarAuth: overlay solo visible cuando ya chequeamos y no hay token
  const needsCalendarAuth = !!state.user && !state.accessToken && state.calendarChecked;

  const clearCalendarToken = useCallback(() => {
    saveToken(null);
    dispatch({ type: 'CLEAR_TOKEN' });
  }, []);

  // ── loginWithGoogle ───────────────────────────────────────────────────────
  // 1. Login con Firebase (popup Google)
  // 2. Si aún no hay token de Calendar → abre popup de autorización Calendar
  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Auth] loginWithGoogle OK, user:', result.user.email);
      console.log('[Auth] DIVOON_URL:', DIVOON_URL, '| CLIENT_ID:', CLIENT_ID?.slice(0,20));
      console.log('[Auth] readToken():', readToken());
      if (!readToken()) {
        console.log('[Auth] Sin cal_token → llamando initCalendarAuth...');
        await initCalendarAuth(result.user);
      } else {
        console.log('[Auth] cal_token ya existe, no se llama initCalendarAuth');
      }
      return true;
    } catch (err) {
      console.error('[Auth] Error en loginWithGoogle:', err);
      return false;
    }
  }, [initCalendarAuth]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      saveToken(null);
      dispatch({ type: 'SIGNED_OUT' });
    } catch (err) {
      console.error('[Auth] Error en logout:', err);
    }
  }, []);

  // ── connectCalendar: llamado desde el overlay (tiene user gesture) ────────
  const connectCalendar = useCallback(async () => {
    const user = userRef.current;
    if (!user) return;
    await initCalendarAuthRef.current(user);
  }, []);

  const value = useMemo(() => ({
    user:                 state.user,
    loading:              state.loading,
    accessDenied:         state.accessDenied,
    accessToken:          state.accessToken,
    loginWithGoogle,
    initCalendarAuth,
    refreshCalendarToken,
    clearCalendarToken,
    connectCalendar,
    needsCalendarAuth,
    logout,
  }), [
    state.user, state.loading, state.accessDenied, state.accessToken,
    loginWithGoogle, initCalendarAuth, refreshCalendarToken, clearCalendarToken, connectCalendar, needsCalendarAuth, logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
