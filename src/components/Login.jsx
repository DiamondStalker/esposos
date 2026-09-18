import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

// Detecta webviews donde Firebase OAuth falla (WhatsApp, Instagram, Facebook, etc.)
function detectWebView() {
  const ua = navigator.userAgent || '';
  return (
    /WhatsApp/i.test(ua) ||
    /FBAN|FBAV/i.test(ua) || // Facebook
    /Instagram/i.test(ua) ||
    /\bwv\b/.test(ua) || // Android WebView genérico
    (/(iPhone|iPod|iPad)/i.test(ua) && !/Safari/i.test(ua)) // iOS WebView sin Safari
  );
}

const IS_WEBVIEW = detectWebView();

export default function Login() {
  const { loginWithGoogle, accessDenied } = useAuth();

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>🦕 Mesesaurios</h1>
        <p className={styles.loginSubtitle}>Un espacio solo para nosotros</p>

        {accessDenied && <p className={styles.loginError}>❌ No tienes acceso a esta página.</p>}

        {IS_WEBVIEW ? (
          <div className={styles.webviewWarning}>
            <p className={styles.webviewText}>
              ⚠️ Estás abriendo esto desde WhatsApp u otra app. El inicio de sesión con Google no
              funciona aquí.
            </p>
            <p className={styles.webviewText}>
              Abre el enlace en <strong>Chrome</strong> o <strong>Safari</strong> para poder entrar.
            </p>
            <p className={styles.webviewHint}>
              (En iPhone: toca los tres puntos → "Abrir en Safari")
            </p>
          </div>
        ) : (
          <button className={styles.loginButton} onClick={loginWithGoogle}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className={styles.loginGoogleIcon}
            />
            Continuar con Google
          </button>
        )}
      </div>
    </div>
  );
}
