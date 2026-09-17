import React from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import styles from './GooeyNav.module.css';

// Autora: Camamore

const ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'juegos', label: 'Juegos 🎮' },
];

// Ancho de cada ítem en px — mitad del ancho total del nav (260 / 2 = 130)
const ITEM_WIDTH = 130;

export default function GooeyNav({ activeView, onNavigate }) {
  const activeIndex = ITEMS.findIndex((item) => item.id === activeView);

  return (
    <LazyMotion features={domAnimation}>
      <nav className={styles.nav} aria-label="Navegación principal">
        {/* Definición del filtro gooey (nodo SVG invisible) */}
        <svg className={styles.svgFilter} aria-hidden="true">
          <defs>
            <filter id="goo-nav">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              />
            </filter>
          </defs>
        </svg>

        {/* Capa filtrada: fondo de la barra + blob activo */}
        <div className={styles.gooLayer}>
          <div className={styles.navBg} />
          <m.div
            className={styles.indicator}
            animate={{ x: activeIndex * ITEM_WIDTH }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
        </div>

        {/* Capa de etiquetas: botones semánticos sin filtro */}
        <div className={styles.labelRow}>
          {ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.btn} ${activeView === item.id ? styles.btnActive : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </LazyMotion>
  );
}
