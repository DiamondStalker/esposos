import React, { useEffect, useRef } from 'react';
import styles from './Celebracion.module.css';
import data from '../data/mesesaurios.json';

const { emojis, colores, cantidadGlobos, cantidadConfetti } = data.celebracion;

function crearConfetti(container, stylesRef) {
  for (let i = 0; i < cantidadConfetti; i++) {
    const confetti = document.createElement('div');
    confetti.className = stylesRef.confettiPiece;
    const size = `${6 + Math.random() * 8}px`;
    const borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    // batch de todos los estilos en un solo cssText para evitar layout thrashing
    confetti.style.cssText = `
      left: ${Math.random() * 100}vw;
      background-color: ${colores[Math.floor(Math.random() * colores.length)]};
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${2.5 + Math.random() * 2}s;
      width: ${size};
      height: ${size};
      border-radius: ${borderRadius};
    `;
    container.appendChild(confetti);
  }
}

function crearGlobos(container, stylesRef) {
  for (let i = 0; i < cantidadGlobos; i++) {
    const globo = document.createElement('div');
    globo.className = stylesRef.globo;
    globo.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    // batch de todos los estilos en un solo cssText
    globo.style.cssText = `
      left: ${5 + Math.random() * 90}vw;
      animation-delay: ${Math.random() * 3}s;
      animation-duration: ${4 + Math.random() * 3}s;
      font-size: ${2 + Math.random() * 2}rem;
    `;
    container.appendChild(globo);
  }
}

export default function Celebracion({ activa }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!activa) return;
    const container = containerRef.current;
    if (!container) return;

    crearConfetti(container, styles);
    crearGlobos(container, styles);

    const timeout = setTimeout(() => {
      if (container) container.innerHTML = '';
    }, 7000);

    return () => clearTimeout(timeout);
  }, [activa]);

  if (!activa) return null;

  return <div className={styles.celebracionContainer} ref={containerRef} />;
}
