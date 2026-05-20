import React, { useEffect, useReducer, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './FeedPosts.module.css';

function feedReducer(state, action) {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.posts };
    case 'SELECT':
      return { ...state, selectedIndex: action.index };
    case 'CLOSE':
      return { ...state, selectedIndex: null };
    case 'PREV':
      return {
        ...state,
        selectedIndex: state.selectedIndex > 0 ? state.selectedIndex - 1 : state.posts.length - 1,
      };
    case 'NEXT':
      return {
        ...state,
        selectedIndex: state.selectedIndex < state.posts.length - 1 ? state.selectedIndex + 1 : 0,
      };
    default:
      return state;
  }
}

export default function FeedPosts() {
  const [state, dispatch] = useReducer(feedReducer, { posts: [], selectedIndex: null });
  const { posts, selectedIndex } = state;

  useEffect(() => {
    const q = query(collection(db, 'fotos'), where('tag', '==', 'post'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      dispatch({
        type: 'SET_POSTS',
        posts: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      });
    });
    return () => unsubscribe();
  }, []);

  const handlePrev = useCallback((e) => {
    e.stopPropagation();
    dispatch({ type: 'PREV' });
  }, []);

  const handleNext = useCallback((e) => {
    e.stopPropagation();
    dispatch({ type: 'NEXT' });
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') dispatch({ type: 'PREV' });
      if (e.key === 'ArrowRight') dispatch({ type: 'NEXT' });
      if (e.key === 'Escape') dispatch({ type: 'CLOSE' });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex]);

  const selectedPost = selectedIndex !== null ? posts[selectedIndex] : null;

  return (
    <div className={styles.feedContainer}>
      <h3 className={styles.feedTitle}>📸 Nuestros Momentos</h3>

      {posts.length === 0 ? (
        <div className={styles.feedEmpty}>
          <span>Aún no hay fotos aquí ✨</span>
        </div>
      ) : (
        <ul className={styles.feedList}>
          {posts.map((post, idx) => (
            <li key={post.id} className={styles.feedItem}>
              <button
                className={styles.feedItemBtn}
                onClick={() => dispatch({ type: 'SELECT', index: idx })}
                aria-label={post.descripcion || `Ver foto ${idx + 1}`}
              >
                <img
                  src={post.url}
                  alt={post.descripcion || `Foto ${idx + 1}`}
                  className={styles.feedImg}
                />
              </button>
              {post.descripcion && <p className={styles.feedDesc}>{post.descripcion}</p>}
            </li>
          ))}
        </ul>
      )}

      {selectedPost && (
        <div
          className={styles.modalOverlayWrapper}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <button
            className={styles.modalOverlay}
            onClick={() => dispatch({ type: 'CLOSE' })}
            aria-label="Cerrar foto"
            type="button"
          />

          {posts.length > 1 && (
            <button className={styles.modalPrev} onClick={handlePrev} aria-label="Foto anterior">
              &lt;
            </button>
          )}

          <div className={styles.modalContent}>
            <button
              className={styles.modalClose}
              onClick={() => dispatch({ type: 'CLOSE' })}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <img
              src={selectedPost.url}
              alt={selectedPost.descripcion || 'Foto ampliada'}
              className={styles.modalImg}
            />
            <div className={styles.modalFooter}>
              {selectedPost.descripcion && (
                <p className={styles.modalDesc}>{selectedPost.descripcion}</p>
              )}
              <p className={styles.modalCounter}>
                {selectedIndex + 1} / {posts.length}
              </p>
            </div>
          </div>

          {posts.length > 1 && (
            <button className={styles.modalNext} onClick={handleNext} aria-label="Foto siguiente">
              &gt;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
