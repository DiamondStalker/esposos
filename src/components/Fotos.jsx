import React, { useState, useEffect, useReducer } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Fotos.module.css';
import config from '../config';
import marco from '../assets/marco.png';

// ── Reducer typewriter — un solo TICK por ciclo ──
function twReducer(state, action) {
  if (action.type !== 'TICK') return state;
  const { text } = action;
  const { displayed, deleting } = state;

  if (!deleting && displayed.length < text.length) {
    return { displayed: text.slice(0, displayed.length + 1), deleting: false };
  }
  if (!deleting && displayed.length === text.length) {
    return { displayed, deleting: true };
  }
  if (deleting && displayed.length > 0) {
    return { displayed: displayed.slice(0, -1), deleting: true };
  }
  // deleting && displayed.length === 0 → reset
  return { displayed: '', deleting: false };
}

function Typewriter({ text, speed = 100, deleteSpeed = 60, pauseAfter = 1500 }) {
  const [twState, twDispatch] = useReducer(twReducer, { displayed: '', deleting: false });
  const { displayed, deleting } = twState;

  useEffect(() => {
    const atEnd = !deleting && displayed.length === text.length;
    const delay = atEnd ? pauseAfter : deleting ? deleteSpeed : speed;
    const timeout = setTimeout(() => twDispatch({ type: 'TICK', text }), delay);
    return () => clearTimeout(timeout);
  }, [displayed, deleting, text, speed, deleteSpeed, pauseAfter]);

  return (
    <h2 className={styles.typewriterText}>
      {displayed}
      <span className={styles.typewriterCursor}>|</span>
    </h2>
  );
}

export default function Fotos() {
  const importAll = (r) => r.keys().map(r);
  const localImages = importAll(require.context('../assets/img', false, /\.(png|jpe?g|svg)$/));

  const [remoteImages, setRemoteImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'fotos'),
      where('tag', '==', 'principal'),
      orderBy('fecha', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRemoteImages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const useRemote = remoteImages.length > 0;
  const totalImages = useRemote ? remoteImages.length : localImages.length;

  const handlePrev = () => setActiveIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
  const handleNext = () => setActiveIndex((i) => (i === totalImages - 1 ? 0 : i + 1));

  return (
    <div>
      <h4>{config.textos.tituloCarrusel}</h4>

      <div className={styles.carouselOuter}>
        <button className={styles.carouselBtn} onClick={handlePrev} aria-label="Foto anterior">
          &lt;
        </button>

        <div className={styles.carouselWrapper}>
          <div className={styles.carouselInnerWrapper}>
            <Carousel
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              controls={false}
              indicators={false}
            >
              {useRemote
                ? remoteImages.map((foto) => (
                    <Carousel.Item key={foto.id}>
                      <div className={styles.carouselImageContainer}>
                        <img
                          src={foto.url}
                          alt={foto.descripcion || 'Foto principal'}
                          className={styles.carouselImage}
                        />
                      </div>
                    </Carousel.Item>
                  ))
                : localImages.map((img, idx) => (
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
            <Typewriter
              text={config.nombres.etiqueta}
              speed={120}
              deleteSpeed={60}
              pauseAfter={1500}
            />
          </div>
        </div>

        <button className={styles.carouselBtn} onClick={handleNext} aria-label="Foto siguiente">
          &gt;
        </button>
      </div>

      <p className={styles.carouselCounter}>
        {activeIndex + 1} / {totalImages}
      </p>
    </div>
  );
}
