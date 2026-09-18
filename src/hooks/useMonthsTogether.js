import { useEffect, useReducer, useRef, useState } from 'react';
import data from '../data/mesesaurios.json';

const START_DATE = new Date(2024, 5, 26);
// Comprobamos cada pocos minutos si cambió el día; solo recalculamos
// (y elegimos una nueva frase aleatoria) cuando eso realmente ocurre.
const DAY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function computeState() {
  const now = new Date();
  const yearDiff = now.getFullYear() - START_DATE.getFullYear();
  const monthDiff = now.getMonth() - START_DATE.getMonth();
  const dayDiff = now.getDate() >= START_DATE.getDate() ? 0 : -1;
  const monthsTogether = yearDiff * 12 + monthDiff + dayDiff;

  let nextAnniversary = new Date(now.getFullYear(), now.getMonth(), 26);
  if (now.getDate() >= 26) {
    nextAnniversary = new Date(now.getFullYear(), now.getMonth() + 1, 26);
  }
  const diffTime = nextAnniversary - now;
  const daysUntilNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const esDia26 = now.getDate() === 26;
  const fraseDelDia = esDia26
    ? data.frases26[Math.floor(Math.random() * data.frases26.length)]
    : '';

  return { monthsTogether, daysUntilNext, esDia26, fraseDelDia };
}

function reducer(state, action) {
  if (action.type === 'REFRESH') return computeState();
  return state;
}

export default function useMonthsTogether() {
  const [state, dispatch] = useReducer(reducer, undefined, computeState);
  const [initialDay] = useState(() => new Date().getDate());
  const lastDayRef = useRef(initialDay);

  useEffect(() => {
    const checkDayChange = () => {
      const currentDay = new Date().getDate();
      if (currentDay !== lastDayRef.current) {
        lastDayRef.current = currentDay;
        dispatch({ type: 'REFRESH' });
      }
    };
    const intervalId = setInterval(checkDayChange, DAY_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return state;
}
