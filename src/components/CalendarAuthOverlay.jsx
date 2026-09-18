import React from 'react';

export default function CalendarAuthOverlay({ onConnect }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(255,228,225,0.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Miss Fajardose, cursive',
      }}
    >
      <p style={{ fontSize: '2.2rem', color: '#c0396b', margin: '0 0 0.5rem' }}>
        🗓️ Conectar calendario
      </p>
      <p
        style={{
          fontSize: '1rem',
          color: '#a0395b',
          marginBottom: '1.5rem',
          fontFamily: 'sans-serif',
        }}
      >
        Solo esta vez — después funciona automático.
      </p>
      <button
        onClick={onConnect}
        style={{
          background: '#c0396b',
          color: '#fff',
          border: 'none',
          borderRadius: '2rem',
          padding: '0.75rem 2.5rem',
          fontSize: '1.1rem',
          cursor: 'pointer',
          fontFamily: 'Miss Fajardose, cursive',
        }}
      >
        Conectar ♥
      </button>
    </div>
  );
}
