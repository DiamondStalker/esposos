import React, { useReducer, useCallback, useRef, useEffect } from 'react';
import styles from './CalendarioModal.module.css';

// Autora: Camamore

const CALENDAR_ID =
  'b3527b5a7d30d4a656e35cb147902c18a7dec24ca279edf3360446a137a32410@group.calendar.google.com';
const CAL_ID_ENC = encodeURIComponent(CALENDAR_ID);
const CALENDAR_BASE = `https://www.googleapis.com/calendar/v3/calendars/${CAL_ID_ENC}`;
const TZ = 'America/Bogota';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_ALL_DAY':
      return { ...state, allDay: !state.allDay };
    case 'SUBMITTING':
      return { ...state, submitting: true, error: null };
    case 'ERROR':
      return { ...state, submitting: false, error: action.message };
    case 'DONE':
      return { ...state, submitting: false };
    default:
      return state;
  }
}

export default function CalendarioModal({ mode, date, evento, accessToken, onClose, onSuccess }) {
  const isCreate = mode === 'create';
  const dialogRef = useRef(null);

  // Abrir como modal nativo al montar; cerrar con Escape llama a onClose
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.showModal();
    const handleClose = () => onClose();
    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [onClose]);

  const eventoIsAllDay = evento ? !!evento.start?.date : true;
  const eventoStartTime = evento?.start?.dateTime?.slice(11, 16) ?? '08:00';
  const eventoEndTime = evento?.end?.dateTime?.slice(11, 16) ?? '09:00';

  const initialDate = evento
    ? evento.start?.date || evento.start?.dateTime?.slice(0, 10) || ''
    : date
      ? formatDate(date)
      : '';

  const [form, dispatch] = useReducer(formReducer, {
    title: evento?.summary || '',
    description: evento?.description || '',
    date: initialDate,
    allDay: eventoIsAllDay,
    startTime: eventoStartTime,
    endTime: eventoEndTime,
    submitting: false,
    error: null,
  });

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.title.trim()) {
        dispatch({ type: 'ERROR', message: 'El título es requerido.' });
        return;
      }
      if (!form.allDay && form.startTime >= form.endTime) {
        dispatch({ type: 'ERROR', message: 'La hora de fin debe ser mayor a la de inicio.' });
        return;
      }
      dispatch({ type: 'SUBMITTING' });

      const timing = form.allDay
        ? { start: { date: form.date }, end: { date: form.date } }
        : {
            start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone: TZ },
            end: { dateTime: `${form.date}T${form.endTime}:00`, timeZone: TZ },
          };

      const body = {
        summary: form.title.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        colorId: '4',
        visibility: 'public',
        ...timing,
      };

      try {
        const url = isCreate ? `${CALENDAR_BASE}/events` : `${CALENDAR_BASE}/events/${evento.id}`;
        const method = isCreate ? 'POST' : 'PATCH';

        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          dispatch({
            type: 'ERROR',
            message: errJson?.error?.message || `Error ${res.status}`,
          });
          return;
        }

        dispatch({ type: 'DONE' });
        await onSuccess();
        onClose();
      } catch {
        dispatch({ type: 'ERROR', message: 'Error de red. Intenta de nuevo.' });
      }
    },
    [isCreate, form, accessToken, evento, onSuccess, onClose]
  );

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="cal-modal-title">
      <h3 className={styles.modalTitle} id="cal-modal-title">
        {isCreate ? '🗓️ Nuevo evento' : '✏️ Editar evento'}
      </h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Título */}
        <label className={styles.label} htmlFor="ev-title">
          Título
        </label>
        <input
          id="ev-title"
          className={styles.input}
          type="text"
          value={form.title}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
          placeholder="Ej: Aniversario mes 27"
          required
          autoFocus
        />

        {/* Fecha */}
        <label className={styles.label} htmlFor="ev-date">
          Fecha
        </label>
        <input
          id="ev-date"
          className={styles.input}
          type="date"
          value={form.date}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
          required
        />

        {/* Toggle todo el día */}
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={form.allDay}
            onChange={() => dispatch({ type: 'TOGGLE_ALL_DAY' })}
          />
          <span>Todo el día</span>
        </label>

        {/* Horas */}
        {!form.allDay && (
          <div className={styles.timeRow}>
            <div className={styles.timeField}>
              <label className={styles.label} htmlFor="ev-start">
                Inicio
              </label>
              <input
                id="ev-start"
                className={styles.input}
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  dispatch({ type: 'SET_FIELD', field: 'startTime', value: e.target.value })
                }
                required
              />
            </div>
            <div className={styles.timeField}>
              <label className={styles.label} htmlFor="ev-end">
                Fin
              </label>
              <input
                id="ev-end"
                className={styles.input}
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  dispatch({ type: 'SET_FIELD', field: 'endTime', value: e.target.value })
                }
                required
              />
            </div>
          </div>
        )}

        {/* Descripción */}
        <label className={styles.label} htmlFor="ev-desc">
          Descripción <span className={styles.optional}>(opcional)</span>
        </label>
        <textarea
          id="ev-desc"
          className={`${styles.input} ${styles.textarea}`}
          value={form.description}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })
          }
          placeholder="Detalles del evento..."
          rows={3}
        />

        {form.error && <p className={styles.errorMsg}>{form.error}</p>}

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={form.submitting}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={form.submitting}>
            {form.submitting ? '...' : isCreate ? 'Crear evento' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
