// ─────────────────────────────────────────────
// Configuración global del proyecto
// Edita este archivo para personalizar la página
// ─────────────────────────────────────────────

const config = {
  // Nombres
  nombres: {
    autor: 'Pingui',
    pareja: 'Gatutu',
    etiqueta: 'Gatutu x Pingui', // texto del typewriter en el carrusel
  },

  // Fecha de inicio de la relación (año, mes-1, día)
  fechaInicio: new Date(2024, 5, 26),

  // Textos de la página
  textos: {
    bienvenida: '¡Bienvenido!',
    header: '¡Feliz {meses} Meses, Mi Amor!',
    subheader: 'Gracias por hacerme la persona más feliz del mundo.',
    tituloCarrusel: 'Nuestras Aventuras',
    mensaje:
      'Cada día contigo es una nueva aventura llena de amor y alegría.\n¡Te amo más de lo que las palabras pueden expresar!',
    footer: 'Para siempre, con amor ❤️',
  },

  // Canción
  audio: {
    archivo: './cancion.mp3',
  },
};

export default config;
