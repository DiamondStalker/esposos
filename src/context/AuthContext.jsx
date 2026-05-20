import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false, accessDenied: false };
    case 'ACCESS_DENIED':
      return { ...state, user: null, loading: false, accessDenied: true };
    case 'SIGNED_OUT':
      return { ...state, user: null, loading: false };
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
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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
