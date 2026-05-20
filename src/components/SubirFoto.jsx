import React, { useReducer, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './SubirFoto.module.css';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const initialState = {
  open: false,
  preview: null,
  file: null,
  descripcion: '',
  tag: 'post',
  uploading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      return { ...state, open: !state.open, error: null };
    case 'SET_FILE':
      return { ...state, file: action.file, preview: action.preview };
    case 'SET_DESCRIPCION':
      return { ...state, descripcion: action.value };
    case 'SET_TAG':
      return { ...state, tag: action.value };
    case 'SET_UPLOADING':
      return { ...state, uploading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value, uploading: false };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

const InstaxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="6" width="20" height="14" rx="2" ry="2" fill="none" />
    <circle cx="12" cy="13" r="3.5" />
    <circle cx="12" cy="13" r="1.5" strokeWidth="1" />
    <rect x="6" y="3" width="5" height="3" rx="1" />
    <rect x="15" y="3" width="3" height="3" rx="0.5" />
    <circle cx="18.5" cy="9" r="0.8" fill="white" />
  </svg>
);

export default function SubirFoto() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { open, preview, file, descripcion, tag, uploading, error } = state;
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => dispatch({ type: 'SET_FILE', file: selected, preview: reader.result });
    reader.readAsDataURL(selected);
  };

  const handleSubir = async () => {
    if (!file) return dispatch({ type: 'SET_ERROR', value: 'Selecciona una imagen primero.' });
    dispatch({ type: 'SET_UPLOADING', value: true });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'mesesaurios');

      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const data = await res.json();

      if (!data.secure_url) throw new Error('Error al subir la imagen a Cloudinary');

      await addDoc(collection(db, 'fotos'), {
        url: data.secure_url,
        descripcion,
        tag,
        fecha: serverTimestamp(),
        publicId: data.public_id,
      });

      dispatch({ type: 'RESET' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', value: err.message });
    }
  };

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => dispatch({ type: 'TOGGLE' })}
        title="Subir foto"
        aria-label="Subir foto"
      >
        <InstaxIcon />
      </button>

      {open && (
        /* Overlay como button para accesibilidad */
        <div
          className={styles.overlayWrapper}
          role="dialog"
          aria-modal="true"
          aria-label="Subir foto"
        >
          <button
            className={styles.overlay}
            onClick={() => dispatch({ type: 'TOGGLE' })}
            aria-label="Cerrar modal"
            type="button"
          />
          <div className={styles.modal}>
            <button
              className={styles.close}
              onClick={() => dispatch({ type: 'TOGGLE' })}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <h2 className={styles.title}>📸 Subir foto</h2>

            <button
              className={styles.previewArea}
              onClick={() => fileRef.current.click()}
              aria-label="Seleccionar imagen"
              type="button"
            >
              {preview ? (
                <img src={preview} alt="Vista previa" className={styles.preview} />
              ) : (
                <span className={styles.previewPlaceholder}>Toca para elegir una foto</span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={styles.fileInput}
            />

            <textarea
              className={styles.textarea}
              placeholder="Escribe una descripción..."
              value={descripcion}
              onChange={(e) => dispatch({ type: 'SET_DESCRIPCION', value: e.target.value })}
              rows={3}
            />

            <div className={styles.tagGroup} role="radiogroup" aria-label="Tipo de foto">
              <label className={`${styles.tagOption} ${tag === 'post' ? styles.tagActive : ''}`}>
                <input
                  type="radio"
                  value="post"
                  checked={tag === 'post'}
                  onChange={() => dispatch({ type: 'SET_TAG', value: 'post' })}
                />
                📱 Post
              </label>
              <label
                className={`${styles.tagOption} ${tag === 'principal' ? styles.tagActive : ''}`}
              >
                <input
                  type="radio"
                  value="principal"
                  checked={tag === 'principal'}
                  onChange={() => dispatch({ type: 'SET_TAG', value: 'principal' })}
                />
                ⭐ Principal
              </label>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubir} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir foto ❤️'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
