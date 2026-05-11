# 🦕 Mesesaurios

[![React Doctor](https://www.react.doctor/share/badge?p=pagina-romantica&s=100)](https://www.react.doctor/share?p=pagina-romantica&s=100)
[![Deploy](https://github.com/DiamondStalker/esposos/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/DiamondStalker/esposos/actions/workflows/gh-pages.yml)
[![PR Checks](https://github.com/DiamondStalker/esposos/actions/workflows/pr_checks.yml/badge.svg)](https://github.com/DiamondStalker/esposos/actions/workflows/pr_checks.yml)
![Version](https://img.shields.io/github/package-json/v/DiamondStalker/esposos)
![Last Commit](https://img.shields.io/github/last-commit/DiamondStalker/esposos)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-222?logo=github)

Página web romántica hecha con amor para celebrar cada mes juntos. 🐧💕🐱

🔗 **[Ver en vivo](https://DiamondStalker.github.io/esposos)**

---

## ✨ Funcionalidades

- 🎉 **Popup de bienvenida** con contador de meses y días hasta el próximo aniversario
- 🎵 **Playlist de Spotify** con autoplay al aceptar el popup
- 📸 **Carrusel de fotos** con marco Polaroid personalizado
- ✍️ **Animación typewriter** con el nombre de la pareja en el Polaroid
- 🎈 **Celebración especial el día 26** — confetti y globos por toda la pantalla
- 💕 **Corazones en el cursor** al mover el mouse
- 🦕 **Cursor dinosaurio** personalizado
- 📝 **Poema aleatorio** que cambia en cada visita
- 📱 **Responsive** — se adapta a móvil y escritorio

---

## 🛠️ Tecnologías

- [React 18](https://react.dev/)
- [Bootstrap 5](https://getbootstrap.com/)
- [React Bootstrap](https://react-bootstrap.netlify.app/)
- [Spotify IFrame API](https://developer.spotify.com/documentation/embeds)
- CSS Modules
- GitHub Actions (CI/CD)
- GitHub Pages

---

## 📁 Estructura del proyecto

```
src/
├── assets/          # Imágenes, cursor, marco Polaroid
│   └── img/         # Fotos del carrusel
├── components/
│   ├── Celebracion.jsx      # Animación confetti + globos
│   ├── Celebracion.module.css
│   ├── Fotos.jsx            # Carrusel Polaroid + Typewriter
│   └── Fotos.module.css
├── data/
│   └── mesesaurios.json     # Frases, poemas, emojis y colores configurables
├── App.js
├── App.module.css
├── config.js                # Configuración global (nombres, textos, fecha)
└── index.css                # Estilos globales
```

---

## ⚙️ Configuración

Para personalizar el proyecto edita estos dos archivos:

**`src/config.js`** — nombres, fecha de inicio, textos de la página
**`src/data/mesesaurios.json`** — frases del día 26, poemas, emojis y colores de la celebración

---

## 🚀 Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Compilar para producción
npm run build

# Ejecutar lint
npm run lint
```

---

## 🔄 Flujo de trabajo

```
feature/nombre-rama → PR → checks automáticos → merge → deploy automático
```

- Toda nueva funcionalidad se desarrolla en una rama `feature/`
- Los PRs ejecutan **lint + build** automáticamente antes de permitir el merge
- Al mergear a `master` se despliega automáticamente a GitHub Pages

---

## 📜 Licencia

Proyecto personal y privado. Hecho con ❤️ por Pingui para Gatutu.
