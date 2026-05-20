import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './Fotos.module.css';
import config from '../config';
import marco from '../assets/marco.png';

function Typewriter({ text, speed = 100, deleteSpeed = 60, pauseAfter = 1500 }) {
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    let timeout;

    if (!deleting && indexRef.current < text.length) {
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      }, speed);
    } else if (!deleting && indexRef.current === text.length) {
      timeout = setTimeout(() => setDeleting(true), pauseAfter);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed((prev) => prev.slice(0, -1));
      }, deleteSpeed);
    } else if (deleting && displayed.length === 0) {
      indexRef.current = 0;
      setDeleting(false);
    }

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

  // Cargar fotos principales desde Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'fotos'),
      where('tag', '==', 'principal'),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRemoteImages(data);
    });

    return () => unsubscribe();
  }, []);

  // Usar fotos de Firestore si hay, si no usar las locales
  const useRemote = remoteImages.length > 0;
  const totalImages = useRemote ? remoteImages.length : localImages.length;

  const handlePrev = () => setActiveIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
  const handleNext = () => setActiveIndex((i) => (i === totalImages - 1 ? 0 : i + 1));

  return (
    <div>
      <h4>{config.textos.tituloCarrusel}</h4>

      <div className={styles.carouselOuter}>
        <button className={styles.carouselBtn} onClick={handlePrev}>
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

        <button className={styles.carouselBtn} onClick={handleNext}>
          &gt;
        </button>
      </div>

      <p className={styles.carouselCounter}>
        {activeIndex + 1} / {totalImages}
      </p>
    </div>
  );
}
