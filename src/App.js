import React, { useReducer, useEffect } from 'react';
import styles from './App.module.css';
import 'bootstrap/dist/css/bootstrap.css';
import Celebracion from './components/Celebracion';
import Login from './components/Login';
import SushiGoCierreModal from './components/SushiGoCierreModal';
import GooeyNav from './components/GooeyNav';
import VistaJuegos from './components/VistaJuegos';
import CalendarAuthOverlay from './components/CalendarAuthOverlay';
import LogoutButton from './components/LogoutButton';
import InicioView from './components/InicioView';
import { useAuth } from './context/AuthContext';
import useMonthsTogether from './hooks/useMonthsTogether';
import useSpotifyEmbed from './hooks/useSpotifyEmbed';
import useHeartTrail from './hooks/useHeartTrail';
import data from './data/mesesaurios.json';

const DIVOON_URL = process.env.REACT_APP_DIVOON_URL;

const initialState = {
  showPopup: true,
  celebracionActiva: false,
  showSushiModal: false,
  view: 'inicio', // 'inicio' | 'juegos'
  poemaDelDia: (() => {
    const randomIndex = Math.floor(Math.random() * data.poemas.length);
    return data.poemas[randomIndex];
  })(),
};

function reducer(state, action) {
  switch (action.type) {
    case 'ACCEPT_POPUP':
      return {
        ...state,
        showPopup: false,
        celebracionActiva: action.esDia26,
        // Modal SushiGO aparece al mismo tiempo que la celebración
        showSushiModal: action.esDia26 && !!DIVOON_URL,
      };
    case 'STOP_CELEBRACION':
      return { ...state, celebracionActiva: false };
    case 'CLOSE_SUSHI_MODAL':
      return { ...state, showSushiModal: false };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    default:
      return state;
  }
}

function MainApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showPopup, celebracionActiva, showSushiModal, view, poemaDelDia } = state;

  const { user, logout, needsCalendarAuth, connectCalendar } = useAuth();
  const { monthsTogether, daysUntilNext, esDia26, fraseDelDia } = useMonthsTogether();
  const spotify = useSpotifyEmbed();
  useHeartTrail();

  const handlePopupAccept = () => {
    spotify.markUserAccepted();
    dispatch({ type: 'ACCEPT_POPUP', esDia26 });
    spotify.play();
    if (esDia26) {
      // Celebración dura 7s
      setTimeout(() => dispatch({ type: 'STOP_CELEBRACION' }), 7000);
    }
  };

  // Vuelve al tope de la página al cambiar de vista
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  return (
    <div className={styles.appContainer}>
      {/* ── Navegación gooey (siempre visible) ── */}
      <GooeyNav activeView={view} onNavigate={(v) => dispatch({ type: 'SET_VIEW', view: v })} />

      {/* ── Overlay de conexión de Calendar (una sola vez) ── */}
      {needsCalendarAuth && <CalendarAuthOverlay onConnect={connectCalendar} />}

      {/* ── Overlays globales (siempre) ── */}
      <Celebracion activa={celebracionActiva} />

      {/* Modal de cierre SushiGO — aparece tras la celebración del día 26 */}
      {showSushiModal && (
        <SushiGoCierreModal onClose={() => dispatch({ type: 'CLOSE_SUSHI_MODAL' })} />
      )}

      {/* ── Botón de logout (siempre) ── */}
      <LogoutButton user={user} onLogout={logout} />

      {/* ── Vista Inicio (sin cambios) ── */}
      {view === 'inicio' && (
        <InicioView
          showPopup={showPopup}
          monthsTogether={monthsTogether}
          daysUntilNext={daysUntilNext}
          esDia26={esDia26}
          fraseDelDia={fraseDelDia}
          onPopupAccept={handlePopupAccept}
          poemaDelDia={poemaDelDia}
        />
      )}

      {/* ── Vista Juegos ── */}
      {view === 'juegos' && <VistaJuegos />}
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  // ── OAuth callback handler ─────────────────────────────────────────────
  // Si la app carga en el popup del callback (window.opener existe y hay ?code),
  // envía el código al padre via postMessage y cierra el popup.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if ((code || error) && window.opener) {
      window.opener.postMessage({ type: 'CALENDAR_OAUTH', code, error }, window.location.origin);
      window.close();
    }
  }, []);

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
