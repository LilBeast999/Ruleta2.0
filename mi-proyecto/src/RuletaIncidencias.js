// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function RuletaIncidencias() {
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);

  const [fase, setFase] = useState(0); // 0: grupo, 1: categoria, 2: incidencia
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [comentario, setComentario] = useState('');

  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingInc, setLoadingInc] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/grupos')
      .then(res => res.json())
      .then(setGrupos);
  }, []);

  const handleLoadCategorias = () => {
    if (!grupoSeleccionado) return;
    setLoadingCat(true);
    fetch('http://localhost:5000/categorias')
      .then(res => res.json())
      .then(data => {
        setCategorias(data);
        setFase(1);
      })
      .finally(() => setLoadingCat(false));
  };

  const handleLoadIncidencias = () => {
    if (!categoriaSeleccionada) return;
    setLoadingInc(true);
    fetch(`http://localhost:5000/incidencias/categoria/${categoriaSeleccionada.id}`)
      .then(res => res.json())
      .then(data => {
        setIncidencias(data);
        setFase(2);
      })
      .finally(() => setLoadingInc(false));
  };

  function Wheel({ titulos, onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const size = 600;
    const center = size / 2;
    const radius = center - 10;
    const n = titulos.length;
    const slice = 360 / (n || 1);
    const colors = [
      '#e6194b','#f58231','#ffe119','#3cb44b',
      '#42d4f4','#4363d8','#f032e6','#a9a9a9'
    ];

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
        const mid = (start + end)/2;
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(mid);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(t, radius * 0.65, 10);
        ctx.restore();
      });
    }, [titulos, slice, radius, center, colors]);

    useEffect(() => {
      drawWheel();
      window.addEventListener('resize', drawWheel);
      return () => window.removeEventListener('resize', drawWheel);
    }, [drawWheel]);

    const spin = () => {
      if (spinning || n === 0) return;
      setSpinning(true);
      const idx = Math.floor(Math.random() * n);
      const midSeg = idx * slice + slice/2;
      const vueltas = Math.floor(Math.random()*8) + 4;
      const finalA = vueltas*360 - midSeg;
      setSpinAngle(finalA);
      setTimeout(() => {
        setSpinning(false);
        onDone(idx);
      }, 4500);
    };

    const wheelStyle = {
      width: size, height: size, borderRadius: '50%',
      boxShadow: '0 0 12px rgba(0,0,0,0.3)',
      transition: 'transform 4.5s ease-out',
      transform: `rotate(${spinAngle}deg)`
    };

    return (
      <div style={{ textAlign:'center', position:'relative', fontSize:'18px' }}>
        <div style={{ position:'relative', display:'inline-block' }}>
          <div style={wheelStyle}>
            <canvas ref={canvasRef} width={size} height={size} style={{ display:'block', borderRadius:'50%' }} />
            <div style={{
              position:'absolute', width:70, height:70,
              background:'#fff', border:'5px solid #ddd',
              borderRadius:'50%', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)'
            }} />
          </div>
          <div style={{
            position:'absolute', top:'50%', right:-25,
            transform:'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '20px solid transparent',
            borderBottom:'20px solid transparent',
            borderRight:'25px solid red'
          }} />
        </div>

        <div style={{ marginTop: 25 }}>
          <button onClick={spin} disabled={spinning} style={botonEstilo}>
            {spinning ? 'Girando…' : 'Girar ruleta'}
          </button>
        </div>
      </div>
    );
  }

  const campoEstilo = {
    width: '100%',
    fontSize: '20px',
    padding: '8px',
    marginBottom: '15px'
  };

  const botonEstilo = {
    marginTop: 15,
    padding: '12px 24px',
    fontSize: '18px',
    borderRadius: 5,
    cursor: 'pointer'
  };

  const renderCampos = () => (
    <div style={{ flex: 1, maxWidth: '400px' }}>
      <label>Grupo:</label>
      <input readOnly value={grupoSeleccionado?.nombre || ''} style={campoEstilo} />
      <label>Tipo de Categoría:</label>
      <input readOnly value={categoriaSeleccionada?.nombre || ''} style={campoEstilo} />
      <label>Incidencia:</label>
      <input readOnly value={incidenciaSeleccionada?.descripcion || ''} style={campoEstilo} />
      <label>Comentario:</label>
      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        disabled={!incidenciaSeleccionada}
        rows={4}
        style={{ ...campoEstilo, resize: 'none' }}
      />

      {fase === 0 && grupoSeleccionado && (
        <button onClick={handleLoadCategorias} disabled={loadingCat} style={botonEstilo}>
          {loadingCat ? 'Cargando…' : 'Ruleta de Categorías'}
        </button>
      )}
      {fase === 1 && categoriaSeleccionada && (
        <button onClick={handleLoadIncidencias} disabled={loadingInc} style={botonEstilo}>
          {loadingInc ? 'Cargando…' : 'Ruleta de Incidencias'}
        </button>
      )}
      {fase === 2 && incidenciaSeleccionada && (
        <button onClick={() => alert('Cambios guardados')} style={botonEstilo}>
          Guardar cambios
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:60 }}>
      {fase === 0 && (
        <Wheel
          titulos={grupos.map(g => g.nombre)}
          onDone={idx => setGrupoSeleccionado(grupos[idx])}
        />
      )}
      {fase === 1 && (
        <Wheel
          titulos={categorias.map(c => c.nombre)}
          onDone={idx => setCategoriaSeleccionada(categorias[idx])}
        />
      )}
      {fase === 2 && (
        <Wheel
          titulos={incidencias.map(i => i.descripcion)}
          onDone={idx => setIncidenciaSeleccionada(incidencias[idx])}
        />
      )}
      {renderCampos()}
    </div>
  );
}
