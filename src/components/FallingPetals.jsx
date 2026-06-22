import React, { useEffect, useState } from 'react';

const Petal = ({ style }) => (
  <svg
    viewBox="0 0 100 100"
    className="absolute pointer-events-none opacity-30 text-primary"
    style={{
      ...style,
      width: `${Math.random() * 15 + 10}px`,
      height: `${Math.random() * 15 + 10}px`,
    }}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 0C60 30 100 50 100 50C100 50 60 70 50 100C40 70 0 50 0 50C0 50 40 30 50 0Z" />
  </svg>
);

export default function FallingPetals() {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    // Generate petals only on the client side
    const newPetals = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      animationDuration: `${Math.random() * 10 + 10}s`,
      animationDelay: `-${Math.random() * 20}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {petals.map((petal) => (
        <Petal
          key={petal.id}
          style={{
            left: petal.left,
            top: '-50px',
            animation: `fall ${petal.animationDuration} linear infinite, sway ${Math.random() * 4 + 4}s ease-in-out infinite alternate`,
            animationDelay: petal.animationDelay,
            transform: petal.transform,
          }}
        />
      ))}
    </div>
  );
}
