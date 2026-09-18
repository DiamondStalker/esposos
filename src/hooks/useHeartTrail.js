import { useEffect } from 'react';

// Crea un corazoncito flotante cada vez que el mouse se mueve.
export default function useHeartTrail() {
  useEffect(() => {
    const pendingTimeouts = new Set();

    const runTimeout = (fn, delay) => {
      const id = setTimeout(() => {
        pendingTimeouts.delete(id);
        fn();
      }, delay);
      pendingTimeouts.add(id);
      return id;
    };

    const createHeart = (e) => {
      const newHeart = document.createElement('div');
      newHeart.className = 'heart';
      const offsetX = (Math.random() - 0.5) * 50;
      const offsetY = (Math.random() - 0.5) * 50;
      newHeart.style.cssText = `left:${e.pageX + offsetX}px;top:${e.pageY + offsetY}px;opacity:1;transform:scale(1.5)`;
      document.body.appendChild(newHeart);
      runTimeout(() => {
        newHeart.style.cssText += ';opacity:0;transform:scale(1)';
        runTimeout(() => newHeart.remove(), 400);
      }, 200);
    };

    window.addEventListener('mousemove', createHeart);
    return () => {
      window.removeEventListener('mousemove', createHeart);
      pendingTimeouts.forEach((id) => clearTimeout(id));
      pendingTimeouts.clear();
    };
  }, []);
}
