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

  // Dibuja segmentos y texto
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
      ctx.textAlign = 'center';
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

  // Gira la ruleta
  const spin = () => {
    if (spinning || n === 0) return;
    setSpinning(true);
    setGanador(null);

    // Elegimos un índice al azar
    const indiceGanador = Math.floor(Math.random() * n);

    // Calculamos el centro de ese segmento
    const centroSegmento = indiceGanador * slice + slice / 2;

    // Generamos las vueltas
    const vueltasCompletas = Math.floor(Math.random() * 10) + 3; // 3 a 12 vueltas
    const finalAngle = vueltasCompletas * 360 - centroSegmento;

    setSpinAngle(finalAngle);

    // Tras la animación, mostramos el ganador
    setTimeout(() => {
      setSpinning(false);
      setGanador(titulos[indiceGanador]);
    }, 4000);
  };

  // Estilos (tomados de la segunda ruleta)
  const styles = {
    container: {
      textAlign: 'center',
      position: 'relative',
    },
    wheelContainer: {
      position: 'relative',
      display: 'inline-block',
    },
    wheel: {
      margin: 'auto',
      width: size,
      height: size,
      borderRadius: '50%',
      boxShadow: '0 0 15px rgba(0,0,0,0.3)',
      transition: 'transform 4s ease-out',
      transform: `rotate(${spinAngle}deg)`,
    },
    canvas: {
      borderRadius: '50%',
      display: 'block',
    },
    pointer: {
      position: 'absolute',
      top: '50%',
      right: '-20px',
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '15px solid transparent',
      borderBottom: '15px solid transparent',
      borderRight: '20px solid red',
      zIndex: 2,
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
      marginTop: 20,
      padding: '10px 20px',
      borderRadius: '5px',
      backgroundColor: '#61dafb',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
    },
    winner: {
      marginTop: 20,
      fontSize: 18,
      color: '#000',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wheelContainer}>
        {/* Flecha indicadora */}
        <div style={styles.pointer} />

        {/* Ruleta giratoria */}
        <div style={styles.wheel}>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={styles.canvas}
          />
          <div style={styles.center} />
        </div>
      </div>

      <button onClick={spin} disabled={spinning} style={styles.button}>
        {spinning ? 'Girando…' : 'Girar ruleta'}
      </button>

      {ganador && (
        <div style={styles.winner}>
          Resultado: <strong>{ganador}</strong>
        </div>
      )}
    </div>
  );
}
