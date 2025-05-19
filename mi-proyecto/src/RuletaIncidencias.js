// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export default function RuletaIncidencias() {
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [miembros, setMiembros] = useState([]);

  // fases: 0 = inicio, 1 = categorías, 2 = incidencias, 3 = miembros
  const [fase, setFase] = useState(0);

  const [grupoSel, setGrupoSel] = useState(null);
  const [catSel, setCatSel]     = useState(null);
  const [incSel, setIncSel]     = useState(null);
  const [mbrSel, setMbrSel]     = useState(null);

  const [individual, setIndividual] = useState(false);
  const [comentario, setComentario] = useState('');

  const botonEstilo = {
    padding: '12px 24px',
    fontSize: 18,
    borderRadius: 5,
    cursor: 'pointer',
    marginTop: 20
  };

  // 1) cargar grupos
  useEffect(() => {
    fetch('http://localhost:5000/grupos')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setGrupos(data) : setGrupos([]))
      .catch(() => setGrupos([]));
  }, []);

  // 2) cargar categorías al entrar en fase 1
  useEffect(() => {
    if (fase === 1) {
      fetch('http://localhost:5000/categorias')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setCategorias(data) : setCategorias([]))
        .catch(() => setCategorias([]));
    }
  }, [fase]);

  // 3) cargar incidencias al entrar en fase 2
  useEffect(() => {
    if (fase === 2 && catSel) {
      fetch(`http://localhost:5000/incidencias/categoria/${catSel.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setIncidencias(data) : setIncidencias([]))
        .catch(() => setIncidencias([]));
    }
  }, [fase, catSel]);

  // 4) cargar miembros si individual + fase 2
  useEffect(() => {
    if (fase === 2 && individual && grupoSel) {
      fetch(`http://localhost:5000/grupo/${grupoSel.id}`)
        .then(r => r.json())
        .then(data => {
          console.log('Datos recibidos de /grupo/:id →', data);
          if (Array.isArray(data.alumnos)) {
            setMiembros(data.alumnos);
            setFase(3);
          } else {
            console.warn('❗ La respuesta no contiene campo alumnos:', data);
            setMiembros([]);
          }
        })
        .catch(err => {
          console.error('Error en fetch grupo:', err);
          setMiembros([]);
        });
    } else if (fase === 3 && !individual) {
      // si desactivas individual, volvemos a fase 2
      setFase(2);
      setMiembros([]);
      setMbrSel(null);
    }
  }, [individual, fase, grupoSel]);

  // Componente Wheel reutilizable
  function Wheel({ titulos = [], onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning]   = useState(false);

    const size   = 500;
    const center = size / 2;
    const radius = center - 8;
    const n      = titulos.length;
    const slice  = 360 / (n || 1);
    const colors = useMemo(() => [
      '#e6194b','#f58231','#ffe119','#3cb44b','#42d4f4','#4363d8'
    ], []);

    const draw = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,size,size);
      for (let i = 0; i < n; i++) {
        const start = i * slice * Math.PI/180;
        const end   = (i+1) * slice * Math.PI/180;
        ctx.beginPath();
        ctx.moveTo(center,center);
        ctx.arc(center,center,radius,start,end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        // texto
        const mid = (start + end) / 2;
        ctx.save();
        ctx.translate(center,center);
        ctx.rotate(mid);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(titulos[i] || '', radius * 0.6, 8);
        ctx.restore();
      }
    }, [titulos, slice, center, radius, colors, n]);

    useEffect(() => {
      draw();
      window.addEventListener('resize', draw);
      return () => window.removeEventListener('resize', draw);
    }, [draw]);

    const spin = () => {
      if (spinning || n === 0) return;
      setSpinning(true);
      const idx = Math.floor(Math.random() * n);
      const mid = idx * slice + slice/2;
      const vueltas = Math.floor(Math.random()*6) + 3;
      const finalA = vueltas * 360 - mid;
      setSpinAngle(finalA);
      setTimeout(() => {
        setSpinning(false);
        onDone(idx);
      }, 3500);
    };

    return (
      <div style={{ textAlign:'center', position:'relative', marginBottom:20 }}>
        <div style={{
          width: size, height: size, borderRadius:'50%',
          boxShadow:'0 0 10px rgba(0,0,0,0.3)',
          transform:`rotate(${spinAngle}deg)`,
          transition:'transform 3.5s ease-out'
        }}>
          <canvas ref={canvasRef} width={size} height={size}
            style={{ borderRadius:'50%', display:'block' }} />
          <div style={{
            position:'absolute', width:50, height:50,
            background:'#fff', border:'4px solid #ddd',
            borderRadius:'50%', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)'
          }} />
        </div>
        <button onClick={spin} disabled={spinning} style={botonEstilo}>
          {spinning ? 'Girando…' : 'Girar ruleta'}
        </button>
      </div>
    );
  }

  // POST /sorteo
  const guardarSorteo = async () => {
    const nowIso = new Date().toISOString();
    const payload = {
      id_grupo:         grupoSel.id,
      fecha:            nowIso,
      id_profesor:      4,
      id_incidencia:    incSel.id,
      id_alumno:        individual ? mbrSel.id : null,
      comentario:       comentario,
      comentario_fecha: nowIso
    };

    try {
      const res = await fetch('http://localhost:5000/sorteo', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error desconocido');
      }
      alert('🎉 Sorteo y comentario guardados correctamente');
    } catch (e) {
      console.error(e);
      alert('⚠️ Error guardando sorteo/comentario: ' + e.message);
    }
  };

  return (
    <div style={{ display:'flex', gap:40, alignItems:'flex-start' }}>
      {/* Columna de Ruleta */}
      <div style={{ width:520, minHeight:540 }}>
        {fase === 0 && (
          <div style={{ textAlign:'center', marginTop:200, color:'#888' }}>
            <p>Selecciona un grupo para comenzar.</p>
          </div>
        )}
        {fase === 1 && (
          <Wheel
            titulos={categorias.map(c=>c.nombre)}
            onDone={i=>{
              setCatSel(categorias[i]);
              setIncSel(null);
              setMbrSel(null);
              setFase(2);
            }}
          />
        )}
        {fase === 2 && (
          <Wheel
            titulos={incidencias.map(x=>x.descripcion)}
            onDone={i=>{
              setIncSel(incidencias[i]);
              setMbrSel(null);
              if (individual) setFase(3);
            }}
          />
        )}
        {fase === 3 && individual && (
          <Wheel
            titulos={miembros.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrSel(miembros[i])}
          />
        )}
      </div>

      {/* Columna de Controles */}
      <div style={{
        maxWidth:300,
        display:'flex',
        flexDirection:'column',
        gap:12
      }}>
        {/* Grupo */}
        <label><strong>Grupo:</strong></label>
        <select
          value={grupoSel?.id || ''}
          onChange={e => {
            const g = grupos.find(x => x.id === +e.target.value);
            setGrupoSel(g);
            setCatSel(null);
            setIncSel(null);
            setMbrSel(null);
            setIndividual(false);
            setFase(1);
          }}
          style={{ fontSize:16, padding:8 }}
        >
          <option value="">— Selecciona un grupo —</option>
          {grupos.map(g => (
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>

        {/* Categoría */}
        <label><strong>Categoría:</strong></label>
        <input readOnly value={catSel?.nombre||''}
          style={{ padding:8, fontSize:16 }} />

        {/* Incidencia */}
        <label><strong>Incidencia:</strong></label>
        <input readOnly value={incSel?.descripcion||''}
          style={{ padding:8, fontSize:16 }} />

        {/* Integrante (solo individual) */}
        {individual && mbrSel && (
          <>
            <label><strong>Integrante seleccionado:</strong></label>
            <input readOnly
              value={`${mbrSel.nombre} ${mbrSel.apellido}`}
              style={{ padding:8, fontSize:16 }}
            />
          </>
        )}

        {/* Comentario */}
        <label><strong>Comentario:</strong></label>
        <textarea
          rows={3}
          value={comentario}
          disabled={!incSel}
          onChange={e => setComentario(e.target.value)}
          style={{ padding:8, fontSize:16, resize:'none' }}
        />

        {/* Switch Grupal / Individual */}
        <div>
          <label style={{ marginRight:8 }}>Grupal</label>
          <input
            type="checkbox"
            checked={individual}
            disabled={!incSel}
            onChange={e => {
              setIndividual(e.target.checked);
              if (!e.target.checked) {
                setMbrSel(null);
                if (fase === 3) setFase(2);
              }
            }}
          />
          <label style={{ marginLeft:8 }}>Individual</label>
        </div>

        {/* Botón Guardar */}
        {incSel && (!individual || mbrSel) && (
          <button onClick={guardarSorteo} style={botonEstilo}>
            Guardar Resultado
          </button>
        )}
      </div>
    </div>
  );
}
