import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
import styles from './Fotos.module.css';
import config from '../config';
import marco from '../assets/marco.png';

function Typewriter({ text, speed = 100, deleteSpeed = 60, pauseAfter = 1500 }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    if (!deleting && index < text.length) {
      timeout = setTimeout(() => {
        setDisplayed(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
    } else if (!deleting && index === text.length) {
      timeout = setTimeout(() => setDeleting(true), pauseAfter);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(prev => prev.slice(0, -1));
      }, deleteSpeed);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex(0);
    }
    return () => clearTimeout(timeout);
  }, [index, displayed, deleting, text, speed, deleteSpeed, pauseAfter]);

  return (
    <h2 className={styles.typewriterText}>
      {displayed}
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
                <Carousel.Item key={idx}>
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
