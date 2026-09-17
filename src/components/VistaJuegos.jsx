import React, { useEffect, useReducer, useCallback } from 'react';
import styles from './VistaJuegos.module.css';

// Autora: Camamore

const DIVOON_URL = process.env.REACT_APP_DIVOON_URL;

const initialState = {
  loading: true,
  current: null,
  error: null,
  posting: null, // 'gato' | 'pingu' | null — quién está siendo registrado
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_CURRENT':
      return { ...state, loading: false, current: action.data, posting: null, error: null };
    case 'POSTING':
      return { ...state, posting: action.winner };
    case 'ERROR':
      return { ...state, loading: false, posting: null, error: action.message };
    default:
      return state;
  }
}

export default function VistaJuegos() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading, current, error, posting } = state;

  const fetchCurrent = useCallback(async () => {
    if (!DIVOON_URL) return;
    dispatch({ type: 'LOADING' });
    try {
      const res = await fetch(`${DIVOON_URL}/games/sushigo/current`);
      if (!res.ok) {
        dispatch({ type: 'ERROR', message: `Error ${res.status} al obtener el marcador.` });
        return;
      }
      const json = await res.json();
      if (json.success) {
        dispatch({ type: 'SET_CURRENT', data: json.data });
      } else {
        dispatch({ type: 'ERROR', message: 'No se pudo obtener el marcador.' });
      }
    } catch {
      dispatch({ type: 'ERROR', message: 'Error conectando con Divoon.' });
    }
  }, []);

  const registrarVictoria = useCallback(
    async (winner) => {
      if (!DIVOON_URL || posting) return;
      dispatch({ type: 'POSTING', winner });
      try {
        const res = await fetch(`${DIVOON_URL}/games/sushigo/win`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winner }),
        });
        if (res.ok) {
          await fetchCurrent();
        } else {
          dispatch({ type: 'ERROR', message: 'No se pudo registrar la victoria.' });
        }
      } catch {
        dispatch({ type: 'ERROR', message: 'Error conectando con Divoon.' });
      }
    },
    [posting, fetchCurrent]
  );

  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  if (!DIVOON_URL) {
    return (
      <div className={styles.container}>
        <p className={styles.hint}>Divoon no está configurado.</p>
      </div>
    );
  }

  const getLeadingLabel = (leading) => {
    if (leading === 'gato') return '🐱 Gato va ganando';
    if (leading === 'pingu') return '🐧 Pingu va ganando';
    if (leading === 'empate') return '🤝 ¡Empate!';
    return '🎮 Sin partidas aún';
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🎮 Partidas</h2>

      {loading && <p className={styles.hint}>Cargando marcador...</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && current && (
        <div className={styles.card}>
          <p className={styles.period}>{current.label}</p>

          <div className={styles.scoreboard}>
            {/* ── Gato ── */}
            <div
              className={`${styles.player} ${current.leading === 'gato' ? styles.playerLeading : ''}`}
            >
              <span className={styles.playerEmoji}>🐱</span>
              <span className={styles.playerName}>Gato</span>
              <span className={styles.playerScore}>{current.gato.wins}</span>
              <button
                className={styles.addBtn}
                onClick={() => registrarVictoria('gato')}
                disabled={!!posting}
                aria-label="Registrar victoria de Gato"
              >
                {posting === 'gato' ? '…' : '+'}
              </button>
            </div>

            <div className={styles.vsCol}>
              <span className={styles.vs}>VS</span>
            </div>

            {/* ── Pingu ── */}
            <div
              className={`${styles.player} ${current.leading === 'pingu' ? styles.playerLeading : ''}`}
            >
              <span className={styles.playerEmoji}>🐧</span>
              <span className={styles.playerName}>Pingu</span>
              <span className={styles.playerScore}>{current.pingu.wins}</span>
              <button
                className={styles.addBtn}
                onClick={() => registrarVictoria('pingu')}
                disabled={!!posting}
                aria-label="Registrar victoria de Pingu"
              >
                {posting === 'pingu' ? '…' : '+'}
              </button>
            </div>
          </div>

          <p className={styles.leadingLabel}>{getLeadingLabel(current.leading)}</p>
          <p className={styles.total}>{current.totalGames} partidas jugadas</p>

          <button
            className={styles.refreshBtn}
            onClick={fetchCurrent}
            disabled={loading || !!posting}
            aria-label="Actualizar marcador"
          >
            ↻ Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
