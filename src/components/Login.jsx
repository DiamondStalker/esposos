import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { loginWithGoogle, accessDenied } = useAuth();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>🦕 Mesesaurios</h1>
        <p className={styles.loginSubtitle}>Un espacio solo para nosotros</p>

        {accessDenied && (
          <p className={styles.loginError}>
            ❌ No tienes acceso a esta página.
          </p>
        )}

        <button className={styles.loginButton} onClick={loginWithGoogle}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className={styles.loginGoogleIcon}
          />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
