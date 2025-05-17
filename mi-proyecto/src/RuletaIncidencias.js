// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function RuletaIncidencias() {
  // Estados generales
  const [categorias, setCategorias] = useState([]);
  const [errorCat, setErrorCat] = useState(null);
  const [fase, setFase] = useState(0);              // 0 = elegir categoría, 1 = incidencias
  const [selectedCatIdx, setSelectedCatIdx] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [errorInc, setErrorInc] = useState(null);
  const [loadingInc, setLoadingInc] = useState(false);

  // Carga inicial de categorías
  useEffect(() => {
    fetch('http://localhost:5000/categorias')
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => setCategorias(data))
      .catch(err => setErrorCat(err.message));
  }, []);

  const handleLoadIncidencias = () => {
    const cat = categorias[selectedCatIdx];
    if (!cat) return;
    setLoadingInc(true);
    setErrorInc(null);

    fetch(`http://localhost:5000/incidencias/categoria/${cat.id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        setIncidencias(data);
        setFase(1);
      })
      .catch(err => setErrorInc(err.message))
      .finally(() => setLoadingInc(false));
  };

  if (errorCat)     return <p style={{ fontSize: '18px' }}>Error cargando categorías: {errorCat}</p>;
  if (categorias.length === 0) return <p style={{ fontSize: '18px' }}>Cargando categorías…</p>;

  // ----------------------------------------------------------------
  //   Componente interno Wheel con texto más grande y resultado
  // ----------------------------------------------------------------
  function Wheel({ titulos, onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [winnerIdx, setWinnerIdx] = useState(null);

    // tamaños y estilos
    const size   = 500;
    const center = size / 2;
    const radius = center - 8;
    const n      = titulos.length;
    const slice  = 360 / (n || 1);
    const colors = [
      '#e6194b','#f58231','#ffe119','#3cb44b',
      '#42d4f4','#4363d8','#f032e6','#a9a9a9'
    ];

    // dibujar
    const drawWheel = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);

      titulos.forEach((t,i) => {
        const start = (i * slice) * Math.PI/180;
        const end   = ((i+1) * slice) * Math.PI/180;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // texto más grande
        const mid = (start + end)/2;
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(mid);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(t, radius * 0.65, 10);
        ctx.restore();
      });
    }, [titulos, slice, radius, center, colors]);

    useEffect(() => {
      drawWheel();
      window.addEventListener('resize', drawWheel);
      return () => window.removeEventListener('resize', drawWheel);
    }, [drawWheel]);

    // girar
    const spin = () => {
      if (spinning || n === 0) return;
      setSpinning(true);
      setWinnerIdx(null);

      const idx = Math.floor(Math.random() * n);
      const midSeg = idx * slice + slice/2;
      const vueltas = Math.floor(Math.random()*8) + 4;
      const finalA = vueltas*360 - midSeg;

      setSpinAngle(finalA);

      setTimeout(() => {
        setSpinning(false);
        setWinnerIdx(idx);
        onDone(idx);
      }, 4500);
    };

    // estilos
    const wheelStyle = {
      width: size, height: size, borderRadius: '50%',
      boxShadow: '0 0 12px rgba(0,0,0,0.3)',
      transition: 'transform 4.5s ease-out',
      transform: `rotate(${spinAngle}deg)`
    };
    const pointerStyle = {
      position: 'absolute', top: '50%', right: -25,
      transform: 'translateY(-50%)',
      width: 0, height: 0,
      borderTop: '20px solid transparent',
      borderBottom:'20px solid transparent',
      borderRight:'25px solid red'
    };

    return (
      <div style={{ textAlign:'center', position:'relative', fontSize:'18px' }}>
        <div style={{ position:'relative', display:'inline-block' }}>
          <div style={wheelStyle}>
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              style={{ display:'block', borderRadius:'50%' }}
            />
            <div style={{
              position:'absolute', width:60, height:60,
              background:'#fff', border:'5px solid #ddd',
              borderRadius:'50%',
              top:'50%', left:'50%',
              transform:'translate(-50%,-50%)'
            }} />
          </div>
          <div style={pointerStyle} />
        </div>

        {/* botón */}
        <button
          onClick={spin}
          disabled={spinning}
          style={{
            marginTop:25,
            padding:'10px 24px',
            borderRadius:5,
            fontSize:'18px',
            cursor: spinning ? 'not-allowed' : 'pointer'
          }}
        >
          {spinning ? 'Girando…' : 'Girar ruleta'}
        </button>

        {/* resultado */}
        {winnerIdx !== null && (
          <div style={{ marginTop: 20 }}>
            Resultado: <strong>{titulos[winnerIdx]}</strong>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------------
  //   Renderizado según fase
  // ----------------------------------------------------------------
  if (fase === 1) {
    if (errorInc) return <p style={{ fontSize: '18px' }}>Error cargando incidencias: {errorInc}</p>;
    if (incidencias.length === 0) return <p style={{ fontSize: '18px' }}>No hay incidencias.</p>;

    const titulosInc = incidencias.map(i => i.descripcion);
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:50 }}>
        <Wheel titulos={titulosInc} onDone={() => {}} />
        <div style={{ fontSize:'18px' }}>
          <h3>Incidencias de <em>{categorias[selectedCatIdx].nombre}</em></h3>
          <ul>
            {incidencias.map(i => <li key={i.id}>{i.descripcion}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  // Fase 0: ruleta de categorías
  const catNames = categorias.map(c => c.nombre);
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:50 }}>
      <Wheel
        titulos={catNames}
        onDone={idx => setSelectedCatIdx(idx)}
      />

      <div style={{ fontSize:'18px' }}>
        <h3>Categorías</h3>
        <ul>
          {categorias.map((c,i) => (
            <li key={c.id}>
              {c.nombre} {i === selectedCatIdx && <strong>← seleccionada</strong>}
            </li>
          ))}
        </ul>

        <button
          onClick={handleLoadIncidencias}
          disabled={selectedCatIdx === null || loadingInc}
          style={{
            marginTop:25,
            padding:'10px 24px',
            borderRadius:5,
            fontSize:'18px',
            cursor: selectedCatIdx===null ? 'not-allowed' : 'pointer'
          }}
        >
          {loadingInc ? 'Cargando…' : 'Mostrar Incidencias'}
        </button>
      </div>
    </div>
  );
}
