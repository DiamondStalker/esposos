import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import styles from './FeedPosts.module.css';

export default function FeedPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'fotos'),
      where('tag', '==', 'post'),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  const handlePrev = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((i) => (i > 0 ? i - 1 : posts.length - 1));
  }, [posts.length]);

  const handleNext = useCallback((e) => {
    e.stopPropagation();
    setSelectedIndex((i) => (i < posts.length - 1 ? i + 1 : 0));
  }, [posts.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') setSelectedIndex((i) => (i > 0 ? i - 1 : posts.length - 1));
      if (e.key === 'ArrowRight') setSelectedIndex((i) => (i < posts.length - 1 ? i + 1 : 0));
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, posts.length]);

  const selectedPost = selectedIndex !== null ? posts[selectedIndex] : null;

  return (
    <div className={styles.feedContainer}>
      <h3 className={styles.feedTitle}>📸 Nuestros Momentos</h3>

      {posts.length === 0 ? (
        <div className={styles.feedEmpty}>
          <span>Aún no hay fotos aquí ✨</span>
        </div>
      ) : (
        <div className={styles.feedList}>
          {posts.map((post, idx) => (
            <div
              key={post.id}
              className={styles.feedItem}
              onClick={() => setSelectedIndex(idx)}
            >
              <img src={post.url} alt={post.descripcion} className={styles.feedImg} />
              {post.descripcion && (
                <p className={styles.feedDesc}>{post.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <div className={styles.modalOverlay} onClick={() => setSelectedIndex(null)}>

          {posts.length > 1 && (
            <button className={styles.modalPrev} onClick={handlePrev}>&lt;</button>
          )}

          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedIndex(null)}>✕</button>
            <img src={selectedPost.url} alt={selectedPost.descripcion} className={styles.modalImg} />
            <div className={styles.modalFooter}>
              {selectedPost.descripcion && (
                <p className={styles.modalDesc}>{selectedPost.descripcion}</p>
              )}
              <p className={styles.modalCounter}>{selectedIndex + 1} / {posts.length}</p>
            </div>
          </div>

          {posts.length > 1 && (
            <button className={styles.modalNext} onClick={handleNext}>&gt;</button>
          )}

        </div>
      )}
    </div>
  );
}
