import React, { useEffect, useReducer, useCallback } from 'react';
import styles from './SushiGoCierreModal.module.css';

const DIVOON_URL = process.env.REACT_APP_DIVOON_URL;

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_RECORD':
      return { ...state, loading: false, record: action.record };
    case 'ERROR':
      return { ...state, loading: false, error: action.message };
    default:
      return state;
  }
}

export default function SushiGoCierreModal({ onClose }) {
  const [state, dispatch] = useReducer(reducer, {
    loading: true,
    record: null,
    error: null,
  });
  const { loading, record, error } = state;
  const didRun = React.useRef(false);

  const ejecutarCierre = useCallback(async () => {
    if (!DIVOON_URL) return;
    // Evitar doble ejecución (React StrictMode monta 2 veces en dev)
    if (didRun.current) return;
    didRun.current = true;

    dispatch({ type: 'LOADING' });
    try {
      // 1. Intentar cerrar el periodo
      const closeRes = await fetch(`${DIVOON_URL}/games/sushigo/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (closeRes.ok) {
        // Cierre exitoso — 201
        const closeData = await closeRes.json();
        if (closeData.success) {
          dispatch({ type: 'SET_RECORD', record: closeData.data.record });
          return;
        }
      }

      // 409 u otro error — obtener estado actual como fallback
      const currentRes = await fetch(`${DIVOON_URL}/games/sushigo/current`);
      const current = await currentRes.json();
      if (current.success) {
        dispatch({ type: 'SET_RECORD', record: current.data });
      } else {
        dispatch({ type: 'ERROR', message: 'No se pudo obtener el resultado.' });
      }
    } catch {
      dispatch({ type: 'ERROR', message: 'No se pudo conectar con Divoon.' });
    }
  }, []);

  useEffect(() => {
    ejecutarCierre();
  }, [ejecutarCierre]);

  const getWinnerInfo = (record) => {
    if (!record) return null;
    const { leading, winner } = record;
    const resultado = winner || leading;
    if (resultado === 'gato') return { emoji: '🐱', nombre: 'Gato', clase: styles.winnerGato };
    if (resultado === 'pingu') return { emoji: '🐧', nombre: 'Pingu', clase: styles.winnerPingu };
    return { emoji: '🤝', nombre: '¡Empate!', clase: styles.winnerEmpate };
  };

  const winnerInfo = record ? getWinnerInfo(record) : null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        {loading && (
          <div className={styles.loadingState}>
            <p className={styles.loadingText}>Calculando el ganador del mes... 🍣</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.btnClose} onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}

        {!loading && !error && record && winnerInfo && (
          <>
            <h2 className={styles.titulo}>¡Cierre del mes! 🎉</h2>
            <p className={styles.periodo}>{record.label}</p>

            {/* Marcador final */}
            <div className={styles.scoreboard}>
              <div
                className={`${styles.player} ${record.leading === 'gato' || record.winner === 'gato' ? styles.playerWinner : ''}`}
              >
                <span className={styles.playerEmoji}>🐱</span>
                <span className={styles.playerName}>Gato</span>
                <span className={styles.playerScore}>{record.gato.wins}</span>
              </div>
              <span className={styles.vs}>VS</span>
              <div
                className={`${styles.player} ${record.leading === 'pingu' || record.winner === 'pingu' ? styles.playerWinner : ''}`}
              >
                <span className={styles.playerEmoji}>🐧</span>
                <span className={styles.playerName}>Pingu</span>
                <span className={styles.playerScore}>{record.pingu.wins}</span>
              </div>
            </div>

            {/* Ganador */}
            <div className={`${styles.winnerBanner} ${winnerInfo.clase}`}>
              <span className={styles.winnerEmoji}>{winnerInfo.emoji}</span>
              <span className={styles.winnerTexto}>
                {winnerInfo.nombre === '¡Empate!'
                  ? '¡Empate este mes!'
                  : `¡${winnerInfo.nombre} ganó el mes!`}
              </span>
            </div>

            <p className={styles.totalText}>{record.totalGames} partidas jugadas este mes</p>

            <button className={styles.btnClose} onClick={onClose}>
              ¡A seguir jugando! 🎮
            </button>
          </>
        )}
      </div>
    </>
  );
}
