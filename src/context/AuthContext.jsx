import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false, accessDenied: false };
    case 'SET_TOKEN':
      return { ...state, accessToken: action.accessToken };
    case 'ACCESS_DENIED':
      return { ...state, user: null, loading: false, accessDenied: true };
    case 'SIGNED_OUT':
      return { ...state, user: null, loading: false, accessToken: null };
    default:
      return state;
  }
}

async function checkWhitelist(currentUser) {
  const whitelistDoc = await getDoc(doc(db, 'config', 'whitelist'));
  const allowedEmails = whitelistDoc.exists() ? whitelistDoc.data().emails || [] : [];
  return allowedEmails.includes(currentUser.email);
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    accessDenied: false,
    // Recuperar el token guardado en sesión (sobrevive refresh de página)
    accessToken: sessionStorage.getItem('gcal_token') || null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const allowed = await checkWhitelist(currentUser);
          if (allowed) {
            dispatch({ type: 'SET_USER', user: currentUser });
          } else {
            await signOut(auth);
            dispatch({ type: 'ACCESS_DENIED' });
          }
        } catch {
          await signOut(auth);
          dispatch({ type: 'ACCESS_DENIED' });
        }
      } else {
        dispatch({ type: 'SIGNED_OUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Capturar el access token de Google para poder llamar Calendar API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        sessionStorage.setItem('gcal_token', accessToken);
        dispatch({ type: 'SET_TOKEN', accessToken });
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('gcal_token');
      dispatch({ type: 'SIGNED_OUT' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        accessDenied: state.accessDenied,
        accessToken: state.accessToken,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
