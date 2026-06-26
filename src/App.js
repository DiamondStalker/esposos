import React, { useReducer, useEffect, useRef } from 'react';
import styles from './App.module.css';
import 'bootstrap/dist/css/bootstrap.css';
import Fotos from './components/Fotos';
import Celebracion from './components/Celebracion';
import Login from './components/Login';
import FeedPosts from './components/FeedPosts';
import SubirFoto from './components/SubirFoto';
import CalendarioWidget from './components/CalendarioWidget';
import { useAuth } from './context/AuthContext';
import data from './data/mesesaurios.json';

const initialState = {
  monthsTogether: 0,
  daysUntilNext: 0,
  showPopup: true,
  esDia26: false,
  celebracionActiva: false,
  fraseDelDia: '',
  poemaDelDia: (() => {
    const randomIndex = Math.floor(Math.random() * data.poemas.length);
    return data.poemas[randomIndex];
  })(),
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_MONTHS':
      return {
        ...state,
        monthsTogether: action.monthsTogether,
        daysUntilNext: action.daysUntilNext,
        esDia26: action.esDia26,
        fraseDelDia: action.fraseDelDia,
      };
    case 'ACCEPT_POPUP':
      return { ...state, showPopup: false, celebracionActiva: action.esDia26 };
    case 'STOP_CELEBRACION':
      return { ...state, celebracionActiva: false };
    default:
      return state;
  }
}

function MainApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    monthsTogether,
    daysUntilNext,
    showPopup,
    esDia26,
    celebracionActiva,
    fraseDelDia,
    poemaDelDia,
  } = state;

  const { user, logout } = useAuth();
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

      const today = new Date();
      let nextAnniversary = new Date(today.getFullYear(), today.getMonth(), 26);
      if (today.getDate() >= 26) {
        nextAnniversary = new Date(today.getFullYear(), today.getMonth() + 1, 26);
      }
      const diffTime = nextAnniversary - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isDia26 = today.getDate() === 26;
      const frase = isDia26 ? data.frases26[Math.floor(Math.random() * data.frases26.length)] : '';

      dispatch({
        type: 'UPDATE_MONTHS',
        monthsTogether: totalMonths,
        daysUntilNext: diffDays,
        esDia26: isDia26,
        fraseDelDia: frase,
      });
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
    if (document.getElementById('spotify-iframe-script')) return;

    const script = document.createElement('script');
    script.id = 'spotify-iframe-script';
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    let embedController = null;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = document.getElementById('spotify-embed-container');
      if (!element) return;

      const options = {
        uri: 'spotify:playlist:0rHcsnXMIQjMNPzUmQfK2Z',
        width: '100%',
        height: '352',
      };

      IFrameAPI.createController(element, options, (EmbedController) => {
        embedController = EmbedController;
        controllerRef.current = EmbedController;

        const onReady = () => {
          if (userAcceptedRef.current) {
            EmbedController.play();
          }
        };

        EmbedController.addListener('ready', onReady);

        return () => {
          EmbedController.removeListener('ready', onReady);
        };
      });
    };

    return () => {
      if (embedController) {
        embedController.destroy?.();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePopupAccept = () => {
    userAcceptedRef.current = true;
    dispatch({ type: 'ACCEPT_POPUP', esDia26 });
    if (controllerRef.current) {
      controllerRef.current.play();
    }
    if (esDia26) {
      setTimeout(() => dispatch({ type: 'STOP_CELEBRACION' }), 7000);
    }
  };

  useEffect(() => {
    const createHeart = (e) => {
      const newHeart = document.createElement('div');
      newHeart.className = 'heart';
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetY = (Math.random() - 0.5) * 50;
      newHeart.style.cssText = `left:${e.pageX + offsetX}px;top:${e.pageY + offsetY}px;opacity:1;transform:scale(1.5)`;
      document.body.appendChild(newHeart);
      setTimeout(() => {
        newHeart.style.cssText += ';opacity:0;transform:scale(1)';
        setTimeout(() => newHeart.remove(), 400);
      }, 200);
    };
    window.addEventListener('mousemove', createHeart);
    return () => window.removeEventListener('mousemove', createHeart);
  }, []);

  return (
    <div className={styles.appContainer}>
      <Celebracion activa={celebracionActiva} />

      <SubirFoto />

      <div className={styles.logoutWrapper}>
        <button className={styles.logoutBtn} onClick={logout}>
          👤 {user?.displayName} · Cerrar sesión
        </button>
      </div>

      {showPopup && (
        <>
          <div className="heart" />
          <div className={styles.overlay} />
          <div className={styles.popup}>
            <h2>¡Bienvenido!</h2>
            <p>
              Estás celebrando <strong>{monthsTogether} meses</strong> juntos.
            </p>
            {esDia26 ? (
              <p className={styles.popupCountdown}>🎉 {fraseDelDia}</p>
            ) : (
              <p className={styles.popupCountdown}>
                Faltan <strong>{daysUntilNext} días</strong> para el próximo mes ❤️
              </p>
            )}
            <button onClick={handlePopupAccept}>Aceptar</button>
          </div>
        </>
      )}

      <header className={styles.header}>
        <h1 style={{ fontFamily: 'Miss Fajardose, cursive' }}>
          ¡Feliz {monthsTogether} Meses, Mi Amor!
        </h1>
        <p>Gracias por hacerme la persona más feliz del mundo.</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.colLeft}>
          <div className={styles.widgetSpotify}>
            <h3 className={styles.widgetTitle}>🎵 Nuestra Música</h3>
            <div
              id="spotify-embed-container"
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            />
          </div>
          <CalendarioWidget />
        </aside>

        <main className={styles.colCenter}>
          <section className={styles.content}>
            <Fotos />
            <p className={styles.message}>
              {poemaDelDia.split('\n').map((linea) => (
                <span key={linea}>
                  {linea}
                  <br />
                </span>
              ))}
            </p>
          </section>
        </main>

        <aside className={styles.colRight}>
          <FeedPosts />
        </aside>
      </div>

      <footer className={styles.footer} style={{ fontFamily: 'Edu AU VIC WA NT Dots, cursive' }}>
        <p>Para siempre, con amor ❤️ Pingui</p>
      </footer>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#ffe4e1',
        }}
      >
        <p style={{ fontFamily: 'Miss Fajardose, cursive', fontSize: '2rem', color: '#c0396b' }}>
          Cargando... 🦕
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <MainApp />;
}

export default App;
