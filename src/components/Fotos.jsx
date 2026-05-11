import React, { useState, useReducer, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
import styles from './Fotos.module.css';
import config from '../config';
import marco from '../assets/marco.png';

// ── Reducer para el Typewriter ──
const twInitial = { displayed: '', deleting: false };

function twReducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      const { text, indexRef } = action;
      if (!state.deleting && indexRef.current < text.length) {
        indexRef.current += 1;
        return { ...state, displayed: state.displayed + text[indexRef.current - 1] };
      }
      if (!state.deleting && indexRef.current === text.length) {
        return { ...state, deleting: true };
      }
      if (state.deleting && state.displayed.length > 0) {
        return { ...state, displayed: state.displayed.slice(0, -1) };
      }
      if (state.deleting && state.displayed.length === 0) {
        indexRef.current = 0;
        return { displayed: '', deleting: false };
      }
      return state;
    }
    default:
      return state;
  }
}

function Typewriter({ text, speed = 100, deleteSpeed = 60, pauseAfter = 1500 }) {
  const [twState, twDispatch] = useReducer(twReducer, twInitial);
  const indexRef = useRef(0);

  useEffect(() => {
    const { displayed, deleting } = twState;
    let delay;

    if (!deleting && indexRef.current < text.length) {
      delay = speed;
    } else if (!deleting && indexRef.current === text.length) {
      delay = pauseAfter;
    } else if (deleting && displayed.length > 0) {
      delay = deleteSpeed;
    } else {
      delay = speed;
    }

    const timeout = setTimeout(() => {
      twDispatch({ type: 'TICK', text, indexRef });
    }, delay);

    return () => clearTimeout(timeout);
  }, [twState, text, speed, deleteSpeed, pauseAfter]);

  return (
    <h2 className={styles.typewriterText}>
      {twState.displayed}
      <span className={styles.typewriterCursor}>|</span>
    </h2>
  );
}

export default function Fotos() {
  const importAll = (r) => r.keys().map(r);
  const images = importAll(require.context('../assets/img', false, /\.(png|jpe?g|svg)$/));
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => setActiveIndex(i => (i === 0 ? images.length - 1 : i - 1));
  const handleNext = () => setActiveIndex(i => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div>
      <h4>{config.textos.tituloCarrusel}</h4>

      <div className={styles.carouselOuter}>
        <button className={styles.carouselBtn} onClick={handlePrev}>‹</button>

        <div className={styles.carouselWrapper}>
          <div className={styles.carouselInnerWrapper}>
            <Carousel
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              controls={false}
              indicators={false}
            >
              {images.map((img, idx) => (
                <Carousel.Item key={img.default || img}>
                  <div className={styles.carouselImageContainer}>
                    <img
                      src={img}
                      alt={`Aventura ${idx + 1}`}
                      className={styles.carouselImage}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>

          <img src={marco} alt="marco" className={styles.carouselMarco} />

          <div className={styles.polaroidTextArea}>
            <Typewriter text={config.nombres.etiqueta} speed={120} deleteSpeed={60} pauseAfter={1500} />
          </div>
        </div>

        <button className={styles.carouselBtn} onClick={handleNext}>›</button>
      </div>

      <p className={styles.carouselCounter}>{activeIndex + 1} / {images.length}</p>
    </div>
  );
}
