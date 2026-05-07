import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Fotos from './components/Fotos';
import Celebracion from './components/Celebracion';
import data from './data/mesesaurios.json';

function App() {
  const [monthsTogether, setMonthsTogether] = useState(0);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const [showPopup, setShowPopup] = useState(true);
  const [esDia26, setEsDia26] = useState(false);
  const [celebracionActiva, setCelebracionActiva] = useState(false);
  const [fraseDelDia, setFraseDelDia] = useState('');
  const [poemaDelDia] = useState(() => {
    const randomIndex = Math.floor(Math.random() * data.poemas.length);
    return data.poemas[randomIndex];
  });
  const intervalRef = useRef(null);
  const controllerRef = useRef(null);
  const userAcceptedRef = useRef(false);

  useEffect(() => {
    const updateMonths = () => {
      const startDate = new Date(2024, 5, 26);
      const now = new Date();
      const yearDiff = now.getFullYear() - startDate.getFullYear();
      const monthDiff = now.getMonth() - startDate.getMonth();
      const dayDiff = now.getDate() >= startDate.getDate() ? 0 : -1;
      const totalMonths = yearDiff * 12 + monthDiff + dayDiff;
      setMonthsTogether(totalMonths);

      const today = new Date();
      let nextAnniversary = new Date(today.getFullYear(), today.getMonth(), 26);
      if (today.getDate() >= 26) {
        nextAnniversary = new Date(today.getFullYear(), today.getMonth() + 1, 26);
      }
      const diffTime = nextAnniversary - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilNext(diffDays);

      if (today.getDate() === 26) {
        setEsDia26(true);
        const randomIndex = Math.floor(Math.random() * data.frases26.length);
        setFraseDelDia(data.frases26[randomIndex]);
      }
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
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const options = {
        uri: 'spotify:playlist:0rHcsnXMIQjMNPzUmQfK2Z',
        width: '100%',
        height: '352',
      };
      const element = document.getElementById('spotify-embed-container');
      IFrameAPI.createController(element, options, (EmbedController) => {
        controllerRef.current = EmbedController;
        EmbedController.addListener('ready', () => {
          if (userAcceptedRef.current) {
            EmbedController.play();
          }
        });
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePopupAccept = () => {
    setShowPopup(false);
    userAcceptedRef.current = true;
    if (controllerRef.current) {
      controllerRef.current.play();
    }
    if (esDia26) {
      setCelebracionActiva(true);
      setTimeout(() => setCelebracionActiva(false), 7000);
    }
  };

  useEffect(() => {
    const createHeart = (e) => {
      const newHeart = document.createElement('div');
      newHeart.className = 'heart';
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetY = (Math.random() - 0.5) * 50;
      newHeart.style.left = `${e.pageX + offsetX}px`;
      newHeart.style.top = `${e.pageY + offsetY}px`;
      document.body.appendChild(newHeart);
      newHeart.style.opacity = 1;
      newHeart.style.transform = 'scale(1.5)';
      setTimeout(() => {
        newHeart.style.opacity = 0;
        newHeart.style.transform = 'scale(1)';
        setTimeout(() => newHeart.remove(), 400);
      }, 200);
    };
    window.addEventListener('mousemove', createHeart);
    return () => window.removeEventListener('mousemove', createHeart);
  }, []);

  return (
    <div className="app-container">

      <Celebracion activa={celebracionActiva} />

      {showPopup && (
        <>
          <div className="heart" />
          <div className="overlay" />
          <div className="popup">
            <h2>¡Bienvenido!</h2>
            <p>Estás celebrando <strong>{monthsTogether} meses</strong> juntos.</p>
            {daysUntilNext === 0
              ? <p className="popup-countdown">🎉 {fraseDelDia}</p>
              : <p className="popup-countdown">Faltan <strong>{daysUntilNext} días</strong> para el próximo mes ❤️</p>
            }
            <button onClick={handlePopupAccept}>Aceptar</button>
          </div>
        </>
      )}

      <header className="header">
        <h1 style={{ fontFamily: "Miss Fajardose, cursive" }}>¡Feliz {monthsTogether} Meses, Mi Amor!</h1>
        <p>Gracias por hacerme la persona más feliz del mundo.</p>
      </header>

      <div className="layout">

        <aside className="col-left">
          <div className="widget-spotify">
            <h3 className="widget-title">🎵 Nuestra Música</h3>
            <div id="spotify-embed-container" style={{ borderRadius: '12px', overflow: 'hidden' }} />
          </div>
        </aside>

        <main className="col-center">
          <section className="content">
            <Fotos />
            <p className="message">
              {poemaDelDia.split('\n').map((linea, i) => (
                <span key={i}>{linea}<br /></span>
              ))}
            </p>
          </section>
        </main>

        <aside className="col-right">
          <div className="widget-placeholder">
            <span>✨ Próximamente</span>
          </div>
        </aside>

      </div>

      <footer className="footer" style={{ fontFamily: "Edu AU VIC WA NT Dots, cursive" }}>
        <p>Para siempre, con amor ❤️ Pingui</p>
      </footer>
    </div>
  );
}

export default App;
