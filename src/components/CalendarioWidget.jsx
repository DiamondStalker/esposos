import React from 'react';
import styles from './CalendarioWidget.module.css';

const CALENDAR_ICS =
  'https://calendar.google.com/calendar/ical/b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410%40group.calendar.google.com/public/full.ics';

const CALENDAR_HTML =
  'https://calendar.google.com/calendar/r?cid=b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410%40group.calendar.google.com';

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default function CalendarioWidget() {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🗓️ Nuestras Fechas</h3>
      <p className={styles.desc}>
        Suscríbete para recibir nuestras fechas especiales en tu calendario.
      </p>
      <div className={styles.btnGroup}>
        <a
          href={CALENDAR_ICS}
          className={styles.btnPrimary}
          target="_blank"
          rel="noreferrer"
          aria-label="Suscribirse al calendario"
        >
          <CalendarIcon />
          Suscribirse
        </a>
        <a
          href={CALENDAR_HTML}
          className={styles.btnSecondary}
          target="_blank"
          rel="noreferrer"
          aria-label="Ver en Google Calendar"
        >
          Ver en Google
        </a>
      </div>
    </div>
  );
}
