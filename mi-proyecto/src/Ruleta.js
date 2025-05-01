// src/Ruleta.js
import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function Ruleta({ titulos = [] }) {
  const canvasRef = useRef(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [ganador, setGanador] = useState(null);

  const size = 500;
  const center = size / 2;
  const radius = center - 8;      // espacio para el borde
  const n = titulos.length;
  const slice = 360 / (n || 1);

  const colors = [
    '#e6194b','#f58231','#ffe119','#3cb44b',
    '#42d4f4','#4363d8','#f032e6','#a9a9a9'
  ];

  // Dibuja segmentos, texto 
  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    titulos.forEach((t, i) => {
      const start = (i * slice) * Math.PI / 180;
      const end = ((i + 1) * slice) * Math.PI / 180;

      // Segmento
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto
      const mid = (start + end) / 2;
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(mid);
      ctx.textAlign = "center"; 
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(t, radius * 0.7, 8);
      ctx.restore();

    });
  }, [titulos, slice, radius, center]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

const spin = () => {
  if (spinning || n === 0) return;
  setSpinning(true);
  setGanador(null);

  // 1. Selección del ganador
  const win = Math.floor(Math.random() * n);
  
  // 2. Cálculo angular simplificado (como el código funcional)
  const centroSegmento = (win * slice) + (slice / 2);
  const vueltas = Math.floor(Math.random() * 10) + 3; // 3 a 12 vueltas
  const finalAngle = vueltas * 360 - centroSegmento;

  // 3. Rotación directa (sin acumular)
  setSpinAngle(finalAngle);

  // 4. Quitar el signo negativo del CSS
  setTimeout(() => {
    setSpinning(false);
    setGanador(titulos[win]); // Resultado directo sin recálculos
  }, 4500);
};

  // Estilos inline
  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      textAlign: 'center',
    },
    pointer: {
      position: 'absolute',
      top: -0,
      left: '50%',
      transform: 'translateX(-50%) rotate(180deg)',
      width: 0,
      height: 0,
      borderLeft: '20px solid transparent',
      borderRight: '20px solid transparent',
      borderBottom: '25px solid #ccc',
      zIndex: 2,
    },
    wheel: {
      position: 'relative',
      width: size,
      height: size,
      border: '8px solid #eee',
      borderRadius: '50%',
      boxShadow: '0 0 15px rgba(0,0,0,0.2)',
      transition: 'transform 4s ease-out', 
      transform: `rotate(${spinAngle}deg)`,
    },
    canvas: {
      borderRadius: '50%',
      display: 'block',
    },
    center: {
      position: 'absolute',
      width: 60,
      height: 60,
      background: '#fff',
      border: '4px solid #ddd',
      borderRadius: '50%',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      zIndex: 1,
    },
    button: {
      display: 'block',
      margin: '20px auto 0',
      padding: '10px 24px',
      border: 'none',
      borderRadius: '30px',
      background: '#61dafb',
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    winner: {
      marginTop: 16,
      color: '#333',
      fontSize: 18,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.pointer} />

      <div style={styles.wheel}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={styles.canvas}
        />
        <div style={styles.center} />
      </div>

      <button
        style={styles.button}
        onClick={spin}
        disabled={spinning}
      >
        {spinning ? 'Girando…' : 'Girar'}
      </button>

      {ganador && (
        <div style={styles.winner}>
          Resultado: <strong>{ganador}</strong>
        </div>
      )}
    </div>
  );
}
