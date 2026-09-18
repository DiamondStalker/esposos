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

const DIVOON_URL = process.env.REACT_APP_DIVOON_URL;
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const REDIRECT_URI =
  process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth-callback.html`;

// ── Token en memoria de módulo ────────────────────────────────────────────────
// El access token de Calendar (~1h) vive en memoria de módulo, no en Web
// Storage. Al recargar la página, el flujo de silent auth lo recupera de
// Divoon sin necesidad de persistencia local.
let _memToken = null;

function isValidToken(value) {
  return typeof value === 'string' && value.length > 0;
}

function readToken() {
  return _memToken;
}

function saveToken(token) {
  if (token === null || token === undefined) {
    _memToken = null;
  } else if (isValidToken(token)) {
    _memToken = token;
  }
}

// ── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false, accessDenied: false };
    case 'SET_TOKEN':
      return {
        ...state,
        accessToken: action.accessToken,
        calendarChecked: true,
        calendarAuthError: null,
      };
    case 'CLEAR_TOKEN':
      return { ...state, accessToken: null };
    case 'CALENDAR_CHECKED':
      return { ...state, calendarChecked: true };
    case 'CALENDAR_AUTH_ERROR':
      return { ...state, calendarAuthError: action.message };
    case 'ACCESS_DENIED':
      return { ...state, user: null, loading: false, accessDenied: true };
    case 'SIGNED_OUT':
      return {
        ...state,
        user: null,
        loading: false,
        accessToken: null,
        calendarChecked: false,
        calendarAuthError: null,
      };
    default:
      return state;
  }
}

// ── Mensajes de error legibles para el overlay de conexión ────────────────────
function calendarAuthErrorMessage(err) {
  if (err?.message === 'El navegador bloqueó el popup') {
    return 'El navegador bloqueó la ventana de Google. Habilitá los popups para este sitio e intentá de nuevo.';
  }
  if (err?.message === 'Tiempo de espera agotado') {
    return 'Se agotó el tiempo de espera antes de completar la conexión. Intentá de nuevo.';
  }
  return 'No se pudo conectar el calendario. Intentá de nuevo.';
}

// ── Whitelist ─────────────────────────────────────────────────────────────────
async function checkWhitelist(currentUser) {
  const snap = await getDoc(doc(db, 'config', 'whitelist'));
  const emails = snap.exists() ? snap.data().emails || [] : [];
  return emails.includes(currentUser.email);
}

// ── Popup de Google Calendar OAuth ───────────────────────────────────────────
function openCalendarOAuthPopup() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('REACT_APP_GOOGLE_CLIENT_ID no configurado'));
      return;
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
    });

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'calendar_oauth',
      'width=500,height=620,left=400,top=100'
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

    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('Tiempo de espera agotado'));
    }, 120_000);
  });
}

// ── Fetch de token silencioso (fuera del efecto, con AbortSignal) ─────────────
async function fetchSilentCalendarToken(user, signal) {
  const idToken = await user.getIdToken();
  const res = await fetch(`${DIVOON_URL}/auth/calendar/token`, {
    headers: { Authorization: `Bearer ${idToken}` },
    signal,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return isValidToken(data.accessToken) ? data.accessToken : null;
}

// ── Custom hook: silent calendar auth ─────────────────────────────────────────
function useSilentCalendarAuth({ user, accessToken, calendarChecked, dispatch }) {
  useEffect(() => {
    if (!user || accessToken || calendarChecked) return;
    if (!DIVOON_URL) {
      dispatch({ type: 'CALENDAR_CHECKED' });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const token = await fetchSilentCalendarToken(user, controller.signal);
        if (token) {
          saveToken(token);
          dispatch({ type: 'SET_TOKEN', accessToken: token });
        } else {
          dispatch({ type: 'CALENDAR_CHECKED' });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'CALENDAR_CHECKED' });
        }
      }
    })();

    return () => controller.abort();
  }, [user, accessToken, calendarChecked, dispatch]);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    accessDenied: false,
    accessToken: readToken(),
    calendarChecked: false,
    calendarAuthError: null,
  });

  const userRef = useRef(state.user);
  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

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
  const initCalendarAuth = useCallback(async (user) => {
    if (!DIVOON_URL || !CLIENT_ID) return null;
    try {
      const code = await openCalendarOAuthPopup();
      const idToken = await user.getIdToken();

      const res = await fetch(`${DIVOON_URL}/auth/calendar/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, code, redirectUri: REDIRECT_URI }),
      });

      if (!res.ok) throw new Error(`Divoon exchange: ${res.status}`);

      const data = await res.json();
      const accessToken = isValidToken(data.accessToken) ? data.accessToken : null;
      if (!accessToken) throw new Error('Token inválido recibido de Divoon');
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch (err) {
      dispatch({ type: 'CALENDAR_AUTH_ERROR', message: calendarAuthErrorMessage(err) });
      return null;
    }
  }, []);

  // ── Mantiene el ref actualizado dentro de un effect (no durante render) ───
  useEffect(() => {
    initCalendarAuthRef.current = initCalendarAuth;
  }, [initCalendarAuth]);

  // ── refreshCalendarToken ──────────────────────────────────────────────────
  const refreshCalendarToken = useCallback(async () => {
    const user = userRef.current;
    if (!DIVOON_URL || !user) return null;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${DIVOON_URL}/auth/calendar/refresh`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) return null;

      const data = await res.json();
      const accessToken = isValidToken(data.accessToken) ? data.accessToken : null;
      if (!accessToken) return null;
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch {
      return null;
    }
  }, []);

  // ── Silent calendar auth ──────────────────────────────────────────────────
  useSilentCalendarAuth({
    user: state.user,
    accessToken: state.accessToken,
    calendarChecked: state.calendarChecked,
    dispatch,
  });

  const needsCalendarAuth = !!state.user && !state.accessToken && state.calendarChecked;

  const clearCalendarToken = useCallback(() => {
    saveToken(null);
    dispatch({ type: 'CLEAR_TOKEN' });
  }, []);

  // ── loginWithGoogle ───────────────────────────────────────────────────────
  // No dispara initCalendarAuth acá: para cuando signInWithPopup resuelve, el
  // gesto de click original ya expiró (el round-trip de Google tarda más de lo
  // que el navegador permite), así que el popup de Calendar siempre sería
  // bloqueado. La conexión de Calendar se pide después, con un click real,
  // desde el overlay (ver connectCalendar).
  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      saveToken(null);
      dispatch({ type: 'SIGNED_OUT' });
    } catch {
      // logout silencioso
    }
  }, []);

  // ── connectCalendar: llamado desde el overlay (tiene user gesture) ────────
  const connectCalendar = useCallback(async () => {
    const user = userRef.current;
    if (!user) return;
    dispatch({ type: 'CALENDAR_AUTH_ERROR', message: null });
    await initCalendarAuthRef.current?.(user);
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      accessDenied: state.accessDenied,
      accessToken: state.accessToken,
      loginWithGoogle,
      initCalendarAuth,
      refreshCalendarToken,
      clearCalendarToken,
      connectCalendar,
      needsCalendarAuth,
      calendarAuthError: state.calendarAuthError,
      logout,
    }),
    [
      state.user,
      state.loading,
      state.accessDenied,
      state.accessToken,
      state.calendarAuthError,
      loginWithGoogle,
      initCalendarAuth,
      refreshCalendarToken,
      clearCalendarToken,
      connectCalendar,
      needsCalendarAuth,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
