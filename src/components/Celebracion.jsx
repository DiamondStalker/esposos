import React, { useEffect, useRef } from 'react';
import './Celebracion.css';
import data from '../data/mesesaurios.json';

const { emojis, colores, cantidadGlobos, cantidadConfetti } = data.celebracion;

function crearConfetti(container) {
  for (let i = 0; i < cantidadConfetti; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
    confetti.style.animationDelay = `${Math.random() * 3}s`;
    confetti.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    confetti.style.width = `${6 + Math.random() * 8}px`;
    confetti.style.height = `${6 + Math.random() * 8}px`;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(confetti);
  }
}

function crearGlobos(container) {
  for (let i = 0; i < cantidadGlobos; i++) {
    const globo = document.createElement('div');
    globo.className = 'globo';
    globo.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    globo.style.left = `${5 + Math.random() * 90}vw`;
    globo.style.animationDelay = `${Math.random() * 3}s`;
    globo.style.animationDuration = `${4 + Math.random() * 3}s`;
    globo.style.fontSize = `${2 + Math.random() * 2}rem`;
    container.appendChild(globo);
  }
}

export default function Celebracion({ activa }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!activa) return;
    const container = containerRef.current;
    if (!container) return;

    crearConfetti(container);
    crearGlobos(container);

    const timeout = setTimeout(() => {
      if (container) container.innerHTML = '';
    }, 7000);

    return () => clearTimeout(timeout);
  }, [activa]);

  if (!activa) return null;

  return <div className="celebracion-container" ref={containerRef} />;
}
