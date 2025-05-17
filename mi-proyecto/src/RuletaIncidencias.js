// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export default function RuletaIncidencias() {
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [miembros, setMiembros] = useState([]);

  const [fase, setFase] = useState(0); // Ruletas: 0=grupos,1=categorías,2=incidencias,3=miembros
  const [grupoSel, setGrupoSel] = useState(null);
  const [catSel, setCatSel]     = useState(null);
  const [incSel, setIncSel]     = useState(null);
  const [mbrSel, setMbrSel]     = useState(null);

  const [comentario, setComentario] = useState('');
  const [individual, setIndividual] = useState(false);

  const botonEstilo = {
    padding: '12px 24px',
    fontSize: 18,
    borderRadius: 5,
    cursor: 'pointer',
    marginTop: 20
  };

  // 1) Carga inicial de grupos
  useEffect(() => {
    fetch('http://localhost:5000/grupos')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setGrupos(data) : setGrupos([]))
      .catch(() => setGrupos([]));
  }, []);

  // 2) Al pasar a fase 1, carga categorías automáticamente
  useEffect(() => {
    if (fase === 1 && grupoSel) {
      fetch('http://localhost:5000/categorias')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setCategorias(data) : setCategorias([]))
        .catch(() => setCategorias([]));
    }
  }, [fase, grupoSel]);

  // 3) Al pasar a fase 2, carga incidencias automáticamente
  useEffect(() => {
    if (fase === 2 && catSel) {
      fetch(`http://localhost:5000/incidencias/categoria/${catSel.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setIncidencias(data) : setIncidencias([]))
        .catch(() => setIncidencias([]));
    }
  }, [fase, catSel]);

  // 4) Carga miembros si individual + fase 2
  useEffect(() => {
    if (individual && fase === 2 && grupoSel) {
      fetch(`http://localhost:5000/grupo/${grupoSel.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data.alumnos) ? setMiembros(data.alumnos) : setMiembros([]))
        .catch(() => setMiembros([]));
    } else {
      setMiembros([]);
      setMbrSel(null);
    }
  }, [individual, fase, grupoSel]);

  function Wheel({ titulos = [], onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning]   = useState(false);

    const size   = 600;
    const center = size/2;
    const radius = center - 10;
    const n      = titulos.length;
    const slice  = 360/(n||1);
    const colors = useMemo(() => [
      '#e6194b','#f58231','#ffe119','#3cb44b','#42d4f4','#4363d8'
    ], []);

    const draw = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,size,size);
      titulos.forEach((t,i)=>{
        const start = i*slice*Math.PI/180;
        const end   = (i+1)*slice*Math.PI/180;
        ctx.beginPath();
        ctx.moveTo(center,center);
        ctx.arc(center,center,radius,start,end);
        ctx.closePath();
        ctx.fillStyle = colors[i%colors.length];
        ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
        const mid=(start+end)/2;
        ctx.save();
        ctx.translate(center,center);
        ctx.rotate(mid);
        ctx.fillStyle='#fff'; ctx.font='bold 20px sans-serif';
        ctx.textAlign='center';
        ctx.fillText(t, radius*0.65, 10);
        ctx.restore();
      });
    },[titulos,slice,center,radius,colors]);

    useEffect(() => {
      draw();
      window.addEventListener('resize', draw);
      return () => window.removeEventListener('resize', draw);
    }, [draw]);

    const spin = () => {
      if (spinning||n===0) return;
      setSpinning(true);
      const idx = Math.floor(Math.random()*n);
      const mid = idx*slice + slice/2;
      const vueltas = Math.floor(Math.random()*8)+4;
      const finalA = vueltas*360-mid;
      setSpinAngle(finalA);
      setTimeout(()=>{
        setSpinning(false);
        onDone(idx);
      }, 4500);
    };

    return (
      <div style={{ textAlign:'center', position:'relative' }}>
        <div style={{
          width:size, height:size, borderRadius:'50%',
          boxShadow:'0 0 12px rgba(0,0,0,0.3)',
          transform:`rotate(${spinAngle}deg)`,
          transition:'transform 4.5s ease-out'
        }}>
          <canvas ref={canvasRef} width={size} height={size}
            style={{ borderRadius:'50%', display:'block' }} />
          <div style={{
            position:'absolute', width:70, height:70,
            background:'#fff', border:'5px solid #ddd',
            borderRadius:'50%', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)'
          }} />
        </div>
        <button onClick={spin} disabled={spinning} style={botonEstilo}>
          {spinning ? 'Girando…' : 'Girar ruleta'}
        </button>
        {!spinning && spinAngle!==0 && (
          <div style={{ marginTop:12, fontSize:18 }}>
            <strong>Resultado:</strong>{' '}
            {titulos[Math.floor(((360 - (spinAngle % 360)) / slice))]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:60, alignItems:'flex-start' }}>
      <div style={{ flexShrink:0 }}>
        {fase===0 && (
          <Wheel
            titulos={grupos.map(g=>g.nombre)}
            onDone={i=>{
              setGrupoSel(grupos[i]);
              setCatSel(null);
              setIncSel(null);
              setMbrSel(null);
              setFase(1);
            }}
          />
        )}
        {fase===1 && (
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
        {fase===2 && !individual && (
          <Wheel
            titulos={incidencias.map(x=>x.descripcion)}
            onDone={i=>setIncSel(incidencias[i])}
          />
        )}
        {fase===2 && individual && miembros.length>0 && (
          <Wheel
            titulos={miembros.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrSel(miembros[i])}
          />
        )}
      </div>

      <div style={{
        flex:1,
        maxWidth:400,
        display:'flex',
        flexDirection:'column',
        gap:12
      }}>
        <label><strong>Grupo:</strong></label>
        <input readOnly value={grupoSel?.nombre||''} style={{ fontSize:20,padding:8 }} />

        <label><strong>Categoría:</strong></label>
        <input readOnly value={catSel?.nombre||''} style={{ fontSize:20,padding:8 }} />

        <label><strong>Incidencia:</strong></label>
        <input readOnly value={incSel?.descripcion||''} style={{ fontSize:20,padding:8 }} />

        <label><strong>Comentario:</strong></label>
        <textarea
          rows={4}
          value={comentario}
          disabled={!incSel}
          onChange={e=>setComentario(e.target.value)}
          style={{ fontSize:20,padding:8,resize:'none' }}
        />

        <div style={{ marginTop:20 }}>
          <label style={{fontSize:18,marginRight:10}}>Grupal</label>
          <input
            type="checkbox"
            checked={individual}
            disabled={!incSel}
            onChange={e=>{
              setIndividual(e.target.checked);
              setMbrSel(null);
            }}
          />
          <label style={{fontSize:18,marginLeft:10}}>Individual</label>
        </div>

        {fase===2 && ((individual && mbrSel) || (!individual && incSel)) && (
          <button onClick={()=>{
            if(individual) {
              alert(`Guardado INDIVIDUAL\nGrupo:${grupoSel.nombre}\nAlumno:${mbrSel.nombre} ${mbrSel.apellido}\nIncidencia:${incSel.descripcion}`);
            } else {
              alert(`Guardado GRUPAL\nGrupo:${grupoSel.nombre}\nIncidencia:${incSel.descripcion}`);
            }
          }} style={botonEstilo}>
            Guardar resultado
          </button>
        )}
      </div>
    </div>
  );
}
