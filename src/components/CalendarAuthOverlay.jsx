import React from 'react';

export default function CalendarAuthOverlay({ onConnect, error }) {
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
      <p
        style={{
          fontSize: 'clamp(1.8rem, 8vw, 2.2rem)',
          color: '#c0396b',
          margin: '0 0 0.5rem',
          textAlign: 'center',
          padding: '0 1rem',
        }}
      >
        🗓️ Conectar calendario
      </p>
      <p
        style={{
          fontSize: '1rem',
          color: '#a0395b',
          marginBottom: '1.5rem',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '0 1rem',
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
          padding: '1rem 3rem',
          minHeight: '56px',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 16px rgba(192, 57, 107, 0.4)',
        }}
      >
        {error ? 'Reintentar ♥' : 'Conectar ♥'}
      </button>

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '0.9rem',
            color: '#b3001b',
            marginTop: '1rem',
            maxWidth: '320px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            padding: '0 1rem',
          }}
        >
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
