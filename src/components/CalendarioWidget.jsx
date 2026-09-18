import React, { useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import styles from './CalendarioWidget.module.css';
import CalendarioModal from './CalendarioModal';
import { useAuth } from '../context/AuthContext';

// Autora: Camamore

const CALENDAR_ID =
  'b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410@group.calendar.google.com';
const CAL_ID_ENC = encodeURIComponent(CALENDAR_ID);
const CALENDAR_BASE = `https://www.googleapis.com/calendar/v3/calendars/${CAL_ID_ENC}`;

const CALENDAR_HTML =
  'https://calendar.google.com/calendar/r?cid=b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410%40group.calendar.google.com';

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

function getEventDay(event) {
  const dateStr = event.start?.date || event.start?.dateTime?.slice(0, 10);
  if (!dateStr) return null;
  return parseInt(dateStr.split('-')[2], 10);
}

// Wrapper reutilizable que usa <dialog> nativo con showModal()
function DialogModal({ titleId, onClose, className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog ref={ref} className={className} aria-labelledby={titleId}>
      {children}
    </dialog>
  );
}

function calReducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_EVENTS':
      return { ...state, loading: false, events: action.events };
    case 'ERROR':
      return { ...state, loading: false, error: action.message };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: null };
    case 'DELETING':
      return { ...state, deletingId: action.id };
    case 'DELETE_DONE':
      return { ...state, deletingId: null };
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
  const { accessToken } = useAuth();

  const [state, dispatch] = useReducer(calReducer, {
    loading: false,
    events: [],
    error: null,
    modal: null,
    deletingId: null,
  });
  const { loading, events, error, modal, deletingId } = state;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;
    dispatch({ type: 'LOADING' });

    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    try {
      const res = await fetch(`${CALENDAR_BASE}/events?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        dispatch({
          type: 'ERROR',
          message:
            res.status === 401
              ? 'Sesión de calendario expirada — vuelve a iniciar sesión.'
              : `Error ${res.status} al cargar eventos.`,
        });
        return;
      }
      const json = await res.json();
      dispatch({ type: 'SET_EVENTS', events: json.items || [] });
    } catch {
      dispatch({ type: 'ERROR', message: 'No se pudo cargar el calendario.' });
    }
  }, [accessToken, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = useCallback(
    async (evento) => {
      if (!accessToken) return;
      dispatch({ type: 'DELETING', id: evento.id });
      try {
        const res = await fetch(`${CALENDAR_BASE}/events/${evento.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok || res.status === 204) {
          dispatch({ type: 'DELETE_DONE' });
          dispatch({ type: 'CLOSE_MODAL' });
          await fetchEvents();
        } else {
          dispatch({ type: 'DELETE_DONE' });
        }
      } catch {
        dispatch({ type: 'DELETE_DONE' });
      }
    },
    [accessToken, fetchEvents]
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Memoizado para no recrear el objeto en cada render
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      const d = getEventDay(event);
      if (d === null) return;
      if (!map[d]) map[d] = [];
      map[d].push(event);
    });
    return map;
  }, [events]);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleDayClick = useCallback(
    (day) => {
      if (!accessToken) return;
      const date = new Date(year, month, day);
      // Se calcula dentro del callback para no depender de eventsByDay (derivado)
      const dayEvents = events.filter((e) => getEventDay(e) === day);
      if (dayEvents.length > 0) {
        dispatch({ type: 'OPEN_MODAL', modal: { mode: 'view', date, day, eventos: dayEvents } });
      } else {
        dispatch({ type: 'OPEN_MODAL', modal: { mode: 'create', date } });
      }
    },
    [accessToken, year, month, events]
  );

  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🗓️ Nuestras Fechas</h3>

      <div className={styles.calGrid}>
        <div className={styles.calHeader}>
          {MESES[month]} {year}
        </div>

        {DIAS.map((d) => (
          <div key={d} className={styles.calDayLabel}>
            {d}
          </div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className={styles.calCell} />;
          const isToday = day === today.getDate();
          const hasEvent = !!eventsByDay[day];
          const eventTitles = eventsByDay[day]?.map((e) => e.summary).join(', ') || '';
          return (
            <button
              key={day}
              className={`${styles.calCell} ${styles.calCellBtn} ${isToday ? styles.calToday : ''} ${hasEvent ? styles.calEvent : ''}`}
              title={eventTitles || (accessToken ? 'Crear evento' : undefined)}
              onClick={() => handleDayClick(day)}
              disabled={!accessToken}
              aria-label={`${day} de ${MESES[month]}${eventTitles ? ` — ${eventTitles}` : ''}`}
            >
              {day}
              {hasEvent && <span className={styles.calDot} />}
            </button>
          );
        })}
      </div>

      {loading && <p className={styles.calStatus}>Cargando eventos...</p>}
      {error && <p className={styles.calStatus}>{error}</p>}
      {!accessToken && <p className={styles.calStatus}>Inicia sesión para gestionar eventos.</p>}

      {!loading && !error && Object.keys(eventsByDay).length > 0 && (
        <ul className={styles.eventList}>
          {Object.entries(eventsByDay)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([day, evts]) =>
              evts.map((ev, i) => (
                <li key={`${day}-${i}`} className={styles.eventItem}>
                  <span className={styles.eventDay}>{day}</span>
                  <span className={styles.eventTitle}>{ev.summary}</span>
                </li>
              ))
            )}
        </ul>
      )}

      <div className={styles.btnGroup}>
        <a
          href={CALENDAR_HTML}
          className={styles.btnSecondary}
          target="_blank"
          rel="noreferrer"
          aria-label="Ver en Google Calendar"
        >
          <CalendarIcon />
          Ver en Google
        </a>
      </div>

      {/* Modal: ver eventos del día */}
      {modal?.mode === 'view' && (
        <DialogModal titleId="view-modal-title" onClose={closeModal} className={styles.viewDialog}>
          <h4 className={styles.viewTitle} id="view-modal-title">
            {modal.day} de {MESES[month]}
          </h4>
          <ul className={styles.viewList}>
            {modal.eventos.map((ev) => (
              <li key={ev.id} className={styles.viewItem}>
                <span className={styles.viewItemTitle}>{ev.summary}</span>
                <div className={styles.viewItemActions}>
                  <button
                    className={styles.iconBtn}
                    aria-label={`Editar ${ev.summary}`}
                    onClick={() =>
                      dispatch({ type: 'OPEN_MODAL', modal: { mode: 'edit', evento: ev } })
                    }
                  >
                    ✏️
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                    aria-label={`Eliminar ${ev.summary}`}
                    disabled={deletingId === ev.id}
                    onClick={() => handleDelete(ev)}
                  >
                    {deletingId === ev.id ? '…' : '🗑️'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.viewFooter}>
            <button
              className={styles.btnAddEvent}
              onClick={() =>
                dispatch({ type: 'OPEN_MODAL', modal: { mode: 'create', date: modal.date } })
              }
            >
              + Agregar evento
            </button>
            <button className={styles.btnClose} onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </DialogModal>
      )}

      {/* Modal: crear / editar */}
      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <CalendarioModal
          mode={modal.mode}
          date={modal.date}
          evento={modal.evento}
          accessToken={accessToken}
          onClose={closeModal}
          onSuccess={fetchEvents}
        />
      )}
    </div>
  );
}
