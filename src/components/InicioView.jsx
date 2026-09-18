import React from 'react';
import styles from '../App.module.css';
import Fotos from './Fotos';
import FeedPosts from './FeedPosts';
import SubirFoto from './SubirFoto';
import CalendarioWidget from './CalendarioWidget';
import SushiGoWidget from './SushiGoWidget';
import BienvenidaPopup from './BienvenidaPopup';

export default function InicioView({
  showPopup,
  monthsTogether,
  daysUntilNext,
  esDia26,
  fraseDelDia,
  onPopupAccept,
  poemaDelDia,
}) {
  return (
    <>
      <SubirFoto />

      {showPopup && (
        <BienvenidaPopup
          monthsTogether={monthsTogether}
          daysUntilNext={daysUntilNext}
          esDia26={esDia26}
          fraseDelDia={fraseDelDia}
          onAccept={onPopupAccept}
        />
      )}

      <header className={styles.header}>
        <h1 style={{ fontFamily: 'Miss Fajardose, cursive' }}>
          ¡Feliz {monthsTogether} Meses, Mi Amor!
        </h1>
        <p>Gracias por hacerme la persona más feliz del mundo.</p>
      </header>

      <div className={styles.layout}>
        {/* Col 1: Partidas del mes + Calendario */}
        <aside className={styles.colSide}>
          <SushiGoWidget />
          <CalendarioWidget />
        </aside>

        {/* Col 2: Nuestras Aventuras */}
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

        {/* Col 3: Nuestros Momentos */}
        <aside className={styles.colSide}>
          <FeedPosts />
        </aside>

        {/* Col 4: Nuestra Música */}
        <aside className={styles.colSide}>
          <div className={styles.widgetSpotify}>
            <h3 className={styles.widgetTitle}>🎵 Nuestra Música</h3>
            <div id="spotify-embed-container" style={{ borderRadius: '12px', overflow: 'hidden' }} />
          </div>
        </aside>
      </div>

      <footer className={styles.footer} style={{ fontFamily: 'Edu AU VIC WA NT Dots, cursive' }}>
        <p>Para siempre, con amor ❤️ Pingui</p>
      </footer>
    </>
  );
}
