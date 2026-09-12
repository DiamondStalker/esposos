import React, { useEffect, useReducer, useCallback } from 'react';
import styles from './SushiGoWidget.module.css';

const DIVOON_URL = process.env.REACT_APP_DIVOON_URL;

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_CURRENT':
      return { ...state, loading: false, current: action.data, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.message };
    default:
      return state;
  }
}

const initialState = {
  loading: true,
  current: null,
  error: null,
};

export default function SushiGoWidget() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading, current, error } = state;

  const fetchCurrent = useCallback(async () => {
    if (!DIVOON_URL) return;
    dispatch({ type: 'LOADING' });
    try {
      const res = await fetch(`${DIVOON_URL}/games/sushigo/current`);
      const json = await res.json();
      if (json.success) {
        dispatch({ type: 'SET_CURRENT', data: json.data });
      } else {
        dispatch({ type: 'ERROR', message: 'No se pudo obtener el estado.' });
      }
    } catch {
      dispatch({ type: 'ERROR', message: 'Error conectando con Divoon.' });
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  if (!DIVOON_URL) return null;

  const getLeadingLabel = (leading) => {
    if (leading === 'gato') return '🐱 Gato va ganando';
    if (leading === 'pingu') return '🐧 Pingu va ganando';
    if (leading === 'empate') return '🤝 ¡Empate!';
    return '🎮 Sin partidas aún';
  };

  const getLeadingClass = (leading) => {
    if (leading === 'gato') return styles.leadingGato;
    if (leading === 'pingu') return styles.leadingPingu;
    if (leading === 'empate') return styles.leadingEmpate;
    return styles.leadingNone;
  };

  return (
    <div className={styles.widget}>
      <h3 className={styles.title}>
        <span className={styles.deco}>✦</span>
        Partidas del mes
        <span className={styles.deco}>✦</span>
      </h3>

      {loading && <p className={styles.hint}>Cargando...</p>}

      {error && <p className={styles.hint}>{error}</p>}

      {!loading && !error && current && (
        <>
          <p className={styles.period}>{current.label}</p>

          <div className={styles.scoreboard}>
            <div
              className={`${styles.player} ${current.leading === 'gato' ? styles.playerLeading : ''}`}
            >
              <span className={styles.playerEmoji}>🐱</span>
              <span className={styles.playerName}>Gato</span>
              <span className={styles.playerScore}>{current.gato.wins}</span>
            </div>

            <span className={styles.vs}>VS</span>

            <div
              className={`${styles.player} ${current.leading === 'pingu' ? styles.playerLeading : ''}`}
            >
              <span className={styles.playerEmoji}>🐧</span>
              <span className={styles.playerName}>Pingu</span>
              <span className={styles.playerScore}>{current.pingu.wins}</span>
            </div>
          </div>

          <p className={`${styles.leadingLabel} ${getLeadingClass(current.leading)}`}>
            {getLeadingLabel(current.leading)}
          </p>

          <p className={styles.total}>{current.totalGames} partidas jugadas</p>

          <button className={styles.refreshBtn} onClick={fetchCurrent} aria-label="Actualizar">
            ↻ Actualizar
          </button>
        </>
      )}
    </div>
  );
}
