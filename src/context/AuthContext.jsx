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

// ── localStorage para el access token de Calendar ───────────────────────────
const STORAGE_KEY = 'cal_token';

function readToken() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}
function saveToken(token) {
  try {
    token ? localStorage.setItem(STORAGE_KEY, token) : localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false, accessDenied: false };
    case 'SET_TOKEN':
      return { ...state, accessToken: action.accessToken, calendarChecked: true };
    case 'CLEAR_TOKEN':
      return { ...state, accessToken: null };
    case 'CALENDAR_CHECKED':
      return { ...state, calendarChecked: true };
    case 'ACCESS_DENIED':
      return { ...state, user: null, loading: false, accessDenied: true };
    case 'SIGNED_OUT':
      return { ...state, user: null, loading: false, accessToken: null, calendarChecked: false };
    default:
      return state;
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

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    accessDenied: false,
    accessToken: readToken(),
    calendarChecked: !!readToken(),
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

      const { accessToken } = await res.json();
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch {
      return null;
    }
  }, []);

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

      const { accessToken } = await res.json();
      saveToken(accessToken);
      dispatch({ type: 'SET_TOKEN', accessToken });
      return accessToken;
    } catch {
      return null;
    }
  }, []);

  initCalendarAuthRef.current = initCalendarAuth;

  // ── Silent calendar auth ──────────────────────────────────────────────────
  // Si hay usuario pero no cal_token, intenta obtener uno desde Divoon
  // usando el refresh token almacenado — sin popup ni interacción.
  // Si Divoon responde 404 (primera vez), muestra el overlay.
  useEffect(() => {
    if (!state.user || state.accessToken || state.calendarChecked) return;
    if (!DIVOON_URL) {
      dispatch({ type: 'CALENDAR_CHECKED' });
      return;
    }

    (async () => {
      try {
        const idToken = await state.user.getIdToken();
        const res = await fetch(`${DIVOON_URL}/auth/calendar/token`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const { accessToken } = await res.json();
          saveToken(accessToken);
          dispatch({ type: 'SET_TOKEN', accessToken });
        } else {
          dispatch({ type: 'CALENDAR_CHECKED' });
        }
      } catch {
        dispatch({ type: 'CALENDAR_CHECKED' });
      }
    })();
  }, [state.user, state.accessToken, state.calendarChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsCalendarAuth = !!state.user && !state.accessToken && state.calendarChecked;

  const clearCalendarToken = useCallback(() => {
    saveToken(null);
    dispatch({ type: 'CLEAR_TOKEN' });
  }, []);

  // ── loginWithGoogle ───────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!readToken()) {
        await initCalendarAuth(result.user);
      }
      return true;
    } catch {
      return false;
    }
  }, [initCalendarAuth]);

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
    await initCalendarAuthRef.current(user);
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
      logout,
    }),
    [
      state.user,
      state.loading,
      state.accessDenied,
      state.accessToken,
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
