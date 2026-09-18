import React from 'react';
import styles from '../App.module.css';

export default function BienvenidaPopup({
  monthsTogether,
  daysUntilNext,
  esDia26,
  fraseDelDia,
  onAccept,
}) {
  return (
    <>
      <div className="heart" />
      <div className={styles.overlay} />
      <div className={styles.popup}>
        <h2>¡Bienvenido!</h2>
        <p>
          Estás celebrando <strong>{monthsTogether} meses</strong> juntos.
        </p>
        {esDia26 ? (
          <p className={styles.popupCountdown}>🎉 {fraseDelDia}</p>
        ) : (
          <p className={styles.popupCountdown}>
            Faltan <strong>{daysUntilNext} días</strong> para el próximo mes ❤️
          </p>
        )}
        <button onClick={onAccept}>Aceptar</button>
      </div>
    </>
  );
}
