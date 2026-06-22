import { useEffect, useRef, useState } from 'react';

// Petal SVG paths for variety
const PETAL_PATHS = [
  'M50 0C60 30 100 50 100 50C100 50 60 70 50 100C40 70 0 50 0 50C0 50 40 30 50 0Z',
  'M50 5C65 20 95 35 95 50C95 65 65 80 50 95C35 80 5 65 5 50C5 35 35 20 50 5Z',
  'M50 0C75 10 100 40 90 60C80 80 60 95 50 100C40 95 20 80 10 60C0 40 25 10 50 0Z',
];

const COLORS = [
  'rgba(206,128,147,VAL)',
  'rgba(249,187,208,VAL)',
  'rgba(140,58,86,VAL)',
  'rgba(228,160,176,VAL)',
];

export default function CursorPetals() {
  const petalsRef = useRef([]);
  const mouseRef = useRef({ x: -200, y: -200 });
  const frameRef = useRef(null);
  const containerRef = useRef(null);
  const spawnCounterRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      spawnCounterRef.current += 1;

      // Spawn petal every ~4 mouse events
      if (spawnCounterRef.current % 4 === 0) {
        spawnPetal(e.clientX, e.clientY);
      }
    };

    const spawnPetal = (x, y) => {
      const el = document.createElement('div');
      const size = Math.random() * 12 + 7; // 7-19px
      const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
      const opacity = (Math.random() * 0.5 + 0.3).toFixed(2); // 0.3-0.8
      const color = colorBase.replace('VAL', opacity);
      const pathIdx = Math.floor(Math.random() * PETAL_PATHS.length);
      const vx = (Math.random() - 0.5) * 2.5; // horizontal drift
      const vy = Math.random() * 2 + 1;         // fall speed
      const rotation = Math.random() * 360;
      const rotSpeed = (Math.random() - 0.5) * 6;
      let life = 1;
      let posX = x + (Math.random() - 0.5) * 20;
      let posY = y + (Math.random() - 0.5) * 10;
      let rot = rotation;

      el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="${PETAL_PATHS[pathIdx]}" /></svg>`;
      el.style.cssText = `
        position: fixed;
        left: ${posX}px;
        top: ${posY}px;
        pointer-events: none;
        z-index: 9999;
        transform: rotate(${rot}deg);
        will-change: transform, opacity;
        transition: none;
      `;
      document.body.appendChild(el);

      const tick = () => {
        life -= 0.018;
        posX += vx;
        posY += vy;
        rot += rotSpeed;

        if (life <= 0) {
          el.remove();
          return;
        }

        el.style.left = `${posX}px`;
        el.style.top = `${posY}px`;
        el.style.opacity = life;
        el.style.transform = `rotate(${rot}deg) scale(${0.7 + life * 0.3})`;

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <div ref={containerRef} className="pointer-events-none" aria-hidden="true" />;
}
