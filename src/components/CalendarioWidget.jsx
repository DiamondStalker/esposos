import React, { useEffect, useReducer } from 'react';
import styles from './CalendarioWidget.module.css';

const CALENDAR_ICS =
  'https://calendar.google.com/calendar/ical/b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410%40group.calendar.google.com/public/full.ics';

const CALENDAR_HTML =
  'https://calendar.google.com/calendar/r?cid=b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410%40group.calendar.google.com';

const PROXY = 'https://api.allorigins.win/raw?url=';

const DIAS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// ── Parser ICS mínimo ──
function parseICS(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : '';
    };
    const summary = get('SUMMARY');
    const dtstart = get('DTSTART');
    if (!dtstart) continue;

    // Soporta formato fecha completa (20250126T000000Z) y solo fecha (20250126)
    const dateStr = dtstart.replace(/T.*/, '');
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day = parseInt(dateStr.slice(6, 8), 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

    events.push({ summary, date: new Date(year, month, day) });
  }
  return events;
}

function calReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_EVENTS':
      return { ...state, loading: false, events: action.events };
    case 'ERROR':
      return { ...state, loading: false, error: action.message };
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(calReducer, {
    loading: true,
    events: [],
    error: null,
  });
  const { loading, events, error } = state;

  useEffect(() => {
    dispatch({ type: 'LOADING' });
    fetch(`${PROXY}${encodeURIComponent(CALENDAR_ICS)}`)
      .then((r) => r.text())
      .then((text) => {
        const parsed = parseICS(text);
        dispatch({ type: 'SET_EVENTS', events: parsed });
      })
      .catch(() => dispatch({ type: 'ERROR', message: 'No se pudo cargar el calendario.' }));
  }, []);

  // ── Construir cuadrícula del mes actual ──
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom

  // Eventos del mes actual, indexados por día
  const eventsByDay = {};
  events.forEach(({ summary, date }) => {
    if (date.getFullYear() === year && date.getMonth() === month) {
      const d = date.getDate();
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(summary);
    }
  });

  // Celdas: espacios vacíos iniciales + días
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🗓️ Nuestras Fechas</h3>

      {/* ── Mini calendario ── */}
      <div className={styles.calGrid}>
        {/* Cabecera mes */}
        <div className={styles.calHeader}>
          {MESES[month]} {year}
        </div>

        {/* Días de la semana */}
        {DIAS.map((d) => (
          <div key={d} className={styles.calDayLabel}>
            {d}
          </div>
        ))}

        {/* Celdas */}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className={styles.calCell} />;
          const isToday = day === today.getDate();
          const hasEvent = !!eventsByDay[day];
          const eventTitles = eventsByDay[day] ? eventsByDay[day].join(', ') : '';
          return (
            <div
              key={day}
              className={`${styles.calCell} ${isToday ? styles.calToday : ''} ${hasEvent ? styles.calEvent : ''}`}
              title={eventTitles || undefined}
            >
              {day}
              {hasEvent && <span className={styles.calDot} />}
            </div>
          );
        })}
      </div>

      {loading && <p className={styles.calStatus}>Cargando eventos...</p>}
      {error && <p className={styles.calStatus}>{error}</p>}

      {/* Eventos del mes */}
      {!loading && !error && Object.keys(eventsByDay).length > 0 && (
        <ul className={styles.eventList}>
          {Object.entries(eventsByDay)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([day, titles]) =>
              titles.map((title, i) => (
                <li key={`${day}-${i}`} className={styles.eventItem}>
                  <span className={styles.eventDay}>{day}</span>
                  <span className={styles.eventTitle}>{title}</span>
                </li>
              ))
            )}
        </ul>
      )}

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
