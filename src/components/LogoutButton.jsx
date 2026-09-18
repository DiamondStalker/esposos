import React from 'react';
import styles from '../App.module.css';

export default function LogoutButton({ user, onLogout }) {
  return (
    <div className={styles.logoutWrapper}>
      <button className={styles.logoutBtn} onClick={onLogout}>
        <span className={styles.logoutFull}>👤 {user?.displayName} · Cerrar sesión</span>
        <span className={styles.logoutShort}>
          👤{' '}
          {user?.displayName
            ?.split(' ')
            .map((n) => n[0])
            .join('')}
        </span>
      </button>
    </div>
  );
}
