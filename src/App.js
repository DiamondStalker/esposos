import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Fotos from './components/Fotos';

function App() {
  const [monthsTogether, setMonthsTogether] = useState(0);
  const [showPopup, setShowPopup] = useState(true);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const intervalRef = useRef(null); // Usar un ref para el intervalo

  useEffect(() => {
    const updateMonths = () => {
      const startDate = new Date(2024, 5, 26);
      const now = new Date();
      const yearDiff = now.getFullYear() - startDate.getFullYear();
      const monthDiff = now.getMonth() - startDate.getMonth();
      const dayDiff = now.getDate() >= startDate.getDate() ? 0 : -1;
      const totalMonths = yearDiff * 12 + monthDiff + dayDiff;
      setMonthsTogether(totalMonths);
    };

    updateMonths();

    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      updateMonths();
      intervalRef.current = setInterval(updateMonths, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current); // Limpiar el intervalo
    };
  }, []);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(error => {
        console.log("Autoplay bloqueado por el navegador. Interacción requerida.", error);
      });
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handlePopupAccept = () => {
    setShowPopup(false);
    playAudio();
  };

  const updateProgress = () => {
    if (audioRef.current && progressRef.current) {
      const { duration, currentTime } = audioRef.current;
      const progressPercentage = (currentTime / duration) * 100;
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  };

  useEffect(() => {
    const createHeart = (e) => {
      const newHeart = document.createElement('div');
      newHeart.className = 'heart';

      // Agregar un desplazamiento aleatorio para mayor dispersión
      const offsetX = (Math.random() - 0.5) * 50; // Desplazamiento horizontal aleatorio
      const offsetY = (Math.random() - 0.5) * 50; // Desplazamiento vertical aleatorio

      newHeart.style.left = `${e.pageX + offsetX}px`; // Posición en X con desplazamiento
      newHeart.style.top = `${e.pageY + offsetY}px`; // Posición en Y con desplazamiento

      document.body.appendChild(newHeart);

      // Muestra el corazón y anima su desaparición
      newHeart.style.opacity = 1;
      newHeart.style.transform = 'scale(1.5)'; // Aumenta el tamaño del corazón
      setTimeout(() => {
        newHeart.style.opacity = 0; // Desvanece el corazón
        newHeart.style.transform = 'scale(1)'; // Vuelve al tamaño original
        setTimeout(() => {
          newHeart.remove(); // Elimina el corazón del DOM después de que se desvanece
        }, 400); // Tiempo que tarda en desaparecer
      }, 200); // Tiempo que se muestra el corazón
    };

    window.addEventListener('mousemove', createHeart);

    return () => {
      window.removeEventListener('mousemove', createHeart);
    };
  }, []);

  return (
    <div className="app-container">
      {showPopup && (
        <>
          <div className="heart" />
          <div className="overlay" />
          <div className="popup">
            <h2>¡Bienvenido!</h2>
            <p>
              Estás a punto de celebrar {monthsTogether} meses juntos.
              Haz clic en aceptar para escuchar una canción especial.
            </p>
            <button onClick={handlePopupAccept}>Aceptar</button>
          </div>
        </>
      )}

      <div className="audio-bar">
        <audio ref={audioRef} loop onTimeUpdate={updateProgress}>
          <source src="/LIM KIM - Confess To You (OST KING THE LAND).mp3" type="audio/mpeg" />
          Tu navegador no soporta el elemento de audio.
        </audio>

        <div className="custom-controls">
          <button className="custom-button" onClick={playAudio}>▶️</button>
          <button className="custom-button" onClick={pauseAudio}>⏸️</button>
        </div>

        <div className="progress-container">
          <div className="progress" ref={progressRef}></div>
        </div>
      </div>

      <header className="header" >
        <center>
          <h1 style={{ fontFamily: "Miss Fajardose, cursive" }}>¡Feliz {monthsTogether} Meses, Mi Amor!</h1>
        </center>
        <p>Gracias por hacerme la persona más feliz del mundo.</p>
      </header>

      <section className="content">


        <div id="carouselExample" className="carousel slide">
          <div className="carousel-inner">
            <Fotos />

          </div>
        </div>

        <p className="message">
          Cada día contigo es una nueva aventura llena de amor y alegría. <br />
          ¡Te amo más de lo que las palabras pueden expresar!
        </p>
      </section>

      <footer className="footer" style={{ fontFamily: "Edu AU VIC WA NT Dots, cursive" }}>
        <p>Para siempre, con amor ❤️</p>
      </footer>
    </div>
  );
}

export default App;
