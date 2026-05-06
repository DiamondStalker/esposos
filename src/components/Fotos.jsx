import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';
import config from '../config';

function Typewriter({ text, speed = 100, deleteSpeed = 60, pauseAfter = 1500 }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let timeout;

    if (!deleting && index < text.length) {
      // Escribiendo
      timeout = setTimeout(() => {
        setDisplayed(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);

    } else if (!deleting && index === text.length) {
      // Terminó de escribir — pausa antes de borrar
      timeout = setTimeout(() => setDeleting(true), pauseAfter);

    } else if (deleting && displayed.length > 0) {
      // Borrando
      timeout = setTimeout(() => {
        setDisplayed(prev => prev.slice(0, -1));
      }, deleteSpeed);

    } else if (deleting && displayed.length === 0) {
      // Terminó de borrar — reinicia
      setDeleting(false);
      setIndex(0);
    }

    return () => clearTimeout(timeout);
  }, [index, displayed, deleting, text, speed, deleteSpeed, pauseAfter]);

  return (
    <p className="typewriter-text">
      {displayed}
      <span className="typewriter-cursor">|</span>
    </p>
  );
}

export default function Fotos() {
  const importAll = (r) => r.keys().map(r);
  const images = importAll(require.context('../assets/img', false, /\.(png|jpe?g|svg)$/));

  return (
    <div>
      <h4>{config.textos.tituloCarrusel}</h4>
      <Typewriter text={config.nombres.etiqueta} speed={120} deleteSpeed={60} pauseAfter={1500} />
      <Carousel>
        {images.map((img, index) => (
          <Carousel.Item key={index}>
            <div className="carousel-image-container">
              <img
                src={img}
                alt={`Aventura ${index + 1}`}
                className="carousel-image"
              />
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
