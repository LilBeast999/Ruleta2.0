// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './RuletaIncidencias.css';

export default function RuletaIncidencias() {
  const [grupos, setGrupos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [miembrosExtra, setMiembrosExtra] = useState([]);

  const [fase, setFase] = useState(0); // 0=inicio,1=categorías,2=incidencias,3=miembros,4=grupoExtra,5=miembrosExtra
  const [grupoSel, setGrupoSel] = useState(null);
  const [catSel, setCatSel] = useState(null);
  const [incSel, setIncSel] = useState(null);
  const [mbrSel, setMbrSel] = useState(null);

  // Nuevos estados para ruleta grupal extra
  const [grupoExtraSel, setGrupoExtraSel] = useState(null);
  const [mbrExtraSel, setMbrExtraSel] = useState(null);
  const [ruletaExtraActiva, setRuletaExtraActiva] = useState(false);

  // Nuevos estados para exclusión de estudiantes
  const [mostrarExclusion, setMostrarExclusion] = useState(false);
  const [estudiantesExcluidos, setEstudiantesExcluidos] = useState([]);

  const [individual, setIndividual] = useState(false);
  const [comentario, setComentario] = useState('');

  const botonEstilo = {
    padding: '12px 24px',
    fontSize: '1rem',
    borderRadius: 6,
    cursor: 'pointer',
    marginTop: 20,
    fontWeight: 600,
    transition: 'all 0.2s ease',
  };

  // Carga inicial de grupos
  useEffect(() => {
    fetch('http://localhost:5000/grupos')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setGrupos(data) : setGrupos([]))
      .catch(() => setGrupos([]));
  }, []);

  // Fase 1: categorías
  useEffect(() => {
    if (fase === 1) {
      fetch('http://localhost:5000/categorias')
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setCategorias(data) : setCategorias([]))
        .catch(() => setCategorias([]));
    }
  }, [fase]);

  // Fase 2: incidencias
  useEffect(() => {
    if (fase === 2 && catSel) {
      fetch(`http://localhost:5000/incidencias/categoria/${catSel.id}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) ? setIncidencias(data) : setIncidencias([]))
        .catch(() => setIncidencias([]));
    }
  }, [fase, catSel]);

  // Fase 3: miembros (solo individual)
  useEffect(() => {
    if (fase === 2 && individual && grupoSel) {
      fetch(`http://localhost:5000/grupo/${grupoSel.id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.alumnos)) {
            setMiembros(data.alumnos);
            setFase(3);
          } else {
            setMiembros([]);
          }
        })
        .catch(() => setMiembros([]));
    } else if (fase === 3 && !individual) {
      setFase(2);
      setMiembros([]);
      setMbrSel(null);
      // Limpiar exclusiones cuando no es individual
      setEstudiantesExcluidos([]);
      setMostrarExclusion(false);
    }
  }, [individual, fase, grupoSel]);

  // Fase 5: miembros del grupo extra
  useEffect(() => {
    if (fase === 5 && grupoExtraSel) {
      fetch(`http://localhost:5000/grupo/${grupoExtraSel.id}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.alumnos)) {
            setMiembrosExtra(data.alumnos);
          } else {
            setMiembrosExtra([]);
          }
        })
        .catch(() => setMiembrosExtra([]));
    }
  }, [fase, grupoExtraSel]);

  // Función para obtener grupos disponibles (excluyendo el grupo seleccionado)
  const gruposDisponibles = useMemo(() => {
    return grupos.filter(g => g.id !== grupoSel?.id);
  }, [grupos, grupoSel]);

  // Función para obtener miembros disponibles (excluyendo los excluidos)
  const miembrosDisponibles = useMemo(() => {
    return miembros.filter(m => !estudiantesExcluidos.some(exc => exc.id === m.id));
  }, [miembros, estudiantesExcluidos]);

  // Función para obtener estudiantes que pueden ser excluidos
  const estudiantesParaExcluir = useMemo(() => {
    return miembros.filter(m => !estudiantesExcluidos.some(exc => exc.id === m.id));
  }, [miembros, estudiantesExcluidos]);

  // Función para activar la ruleta extra
  const activarRuletaExtra = () => {
    setRuletaExtraActiva(true);
    setFase(4); // Ir a la fase de selección de grupo extra
  };

  // Función para verificar si se pueden activar las opciones extra
  const puedeActivarExtra = () => {
    return incSel && (!individual || mbrSel);
  };

  // Función para excluir un estudiante
  const excluirEstudiante = (estudianteId) => {
    const estudiante = miembros.find(m => m.id === parseInt(estudianteId));
    if (estudiante && !estudiantesExcluidos.some(exc => exc.id === estudiante.id)) {
      setEstudiantesExcluidos(prev => [...prev, estudiante]);
      // Si el estudiante seleccionado es excluido, limpiarlo
      if (mbrSel && mbrSel.id === estudiante.id) {
        setMbrSel(null);
      }
    }
    setMostrarExclusion(false);
  };

  // Función para reincluir un estudiante excluido
  const reincluirEstudiante = (estudianteId) => {
    setEstudiantesExcluidos(prev => prev.filter(exc => exc.id !== estudianteId));
  };

  // Función para construir el comentario completo con datos extra
  const construirComentarioCompleto = () => {
    let comentarioCompleto = comentario.trim() || 'No hay comentario registrado';
    
    if (grupoExtraSel && mbrExtraSel) {
      comentarioCompleto += ` | Grupo Extra: ${grupoExtraSel.nombre} | Integrante Extra: ${mbrExtraSel.nombre} ${mbrExtraSel.apellido}`;
    }
    
    return comentarioCompleto;
  };

  // Estilos del pointer (siempre fijo)
  const pointerStyle = {
    position: 'absolute',
    top: '45%',
    right: '0px',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '15px solid transparent',
    borderBottom: '15px solid transparent',
    borderRight: '20px solid red',
    zIndex: 2
  };

  // Rueda genérica
  function Wheel({ titulos = [], onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);

    const size = 500, center = size/2, radius = center - 8;
    const n = titulos.length, slice = 360 / (n || 1);
    const colors = useMemo(() => [
      '#e6194b','#f58231','#ffe119','#3cb44b','#42d4f4','#4363d8'
    ], []);

    const draw = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,size,size);
      for (let i = 0; i < n; i++) {
        const start = i*slice*Math.PI/180,
              end   = (i+1)*slice*Math.PI/180;
        ctx.beginPath();
        ctx.moveTo(center,center);
        ctx.arc(center,center,radius,start,end);
        ctx.closePath();
        ctx.fillStyle = colors[i%colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        // Texto
        const mid = (start + end)/2;
        ctx.save();
        ctx.translate(center,center);
        ctx.rotate(mid);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(titulos[i]||'', radius*0.6, 8);
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
      const idx = Math.floor(Math.random() * n),
            mid = idx*slice + slice/2,
            vueltas = Math.floor(Math.random()*6)+3,
            finalA = vueltas*360 - mid;
      setSpinAngle(finalA);
      setTimeout(() => {
        setSpinning(false);
        onDone(idx);
      }, 3500);
    };

    return (
      <div style={{ position:'relative', marginBottom:20 }}>
        {/* Pointer siempre fijo, fuera del div giratorio */}
        <div style={pointerStyle} />
        {/* Rueda giratoria */}
        <div style={{
          width:size, height:size, borderRadius:'50%',
          boxShadow:'0 0 10px rgba(0,0,0,0.3)',
          transform:`rotate(${spinAngle}deg)`,
          transition:'transform 3.5s ease-out'
        }}>
          <canvas ref={canvasRef} width={size} height={size}
            style={{ borderRadius:'50%', display:'block' }} />
          {/* Centro blanco */}
          <div style={{
            position:'absolute', width:50, height:50,
            background:'#fff', border:'4px solid #ddd',
            borderRadius:'50%', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:1
          }} />
        </div>

        {/* Botón girar */}
        <button className="wheel-button" disabled={spinning || n === 0}
          onClick={spin}
          style={{
            ...botonEstilo,
            display: 'block',       // para que margin auto funcione
            margin: '20px auto 0'   // 20px arriba, centrado, 0 abajo
          }}
        >
        {spinning ? 'Girando…' : n === 0 ? 'Sin opciones disponibles' : 'Girar ruleta'}
        </button>
      </div>
    );
  }

  // POST /sorteo (usando el comentario completo)
  const guardarSorteo = async () => {
    const nowIso = new Date().toISOString();
    const comentarioCompleto = construirComentarioCompleto();
    
    const payload = {
      id_grupo:         grupoSel.id,
      fecha:            nowIso,
      id_profesor:      4,
      id_incidencia:    incSel.id,
      id_alumno:        individual ? mbrSel.id : null,
      comentario:       comentarioCompleto,
      comentario_fecha: nowIso
    };
    try {
      const res = await fetch('http://localhost:5000/sorteo', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(payload)
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
    <div className="ruleta-container">
      {/* Columna de Ruleta */}
      <div style={{ width:520, minHeight:540 }}>
        {fase === 0 && (
          <div style={{ textAlign:'center', marginTop:200, color:'#888' }}>
            Selecciona un grupo para comenzar.
          </div>
        )}
        {fase === 1 && (
          <Wheel
            titulos={categorias.map(c=>c.nombre)}
            onDone={i=>{ setCatSel(categorias[i]); setIncSel(null); setMbrSel(null); setFase(2); }}
          />
        )}
        {fase === 2 && (
          <Wheel
            titulos={incidencias.map(x=>x.descripcion)}
            onDone={i=>{ setIncSel(incidencias[i]); setMbrSel(null); if(individual) setFase(3); }}
          />
        )}
        {fase === 3 && individual && (
          <Wheel
            titulos={miembrosDisponibles.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrSel(miembrosDisponibles[i])}
          />
        )}
        {fase === 4 && ruletaExtraActiva && (
          <Wheel
            titulos={gruposDisponibles.map(g=>g.nombre)}
            onDone={i=>{
              setGrupoExtraSel(gruposDisponibles[i]); 
              setMbrExtraSel(null); 
              setFase(5);
            }}
          />
        )}
        {fase === 5 && ruletaExtraActiva && (
          <Wheel
            titulos={miembrosExtra.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrExtraSel(miembrosExtra[i])}
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
          value={grupoSel?.id||''}
          onChange={e=>{
            const g = grupos.find(x=>x.id===+e.target.value);
            setGrupoSel(g);
            setCatSel(null); setIncSel(null); setMbrSel(null);
            setGrupoExtraSel(null); setMbrExtraSel(null);
            setIndividual(false);
            setRuletaExtraActiva(false);
            setEstudiantesExcluidos([]);
            setMostrarExclusion(false);
            setFase(1);
          }}
          style={{fontSize:16,padding:8}}
        >
          <option value="">— Selecciona un grupo —</option>
          {grupos.map(g=>(
            <option key={g.id} value={g.id}>{g.nombre}</option>
          ))}
        </select>

        {/* Categoría */}
        <label><strong>Categoría:</strong></label>
        <input readOnly value={catSel?.nombre||''} style={{padding:8,fontSize:16}}/>

        {/* Incidencia */}
        <label><strong>Incidencia:</strong></label>
        <input readOnly value={incSel?.descripcion||''} style={{padding:8,fontSize:16}}/>

        {/* Integrante con botón de exclusión */}
        {individual && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label><strong>Integrante seleccionado:</strong></label>
                <input readOnly
                  value={mbrSel ? `${mbrSel.nombre} ${mbrSel.apellido}` : ''}
                  style={{padding:8,fontSize:16, width: '100%'}}
                />
              </div>
              <button
                onClick={() => setMostrarExclusion(!mostrarExclusion)}
                disabled={fase !== 3 || estudiantesParaExcluir.length === 0}
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: estudiantesParaExcluir.length > 0 ? 'pointer' : 'not-allowed',
                  marginTop: '24px',
                  marginLeft: '15px'
                }}
                title="Excluir estudiante de la ruleta"
              >
                ✕
              </button>
            </div>

            {/* Combobox para exclusión */}
            {mostrarExclusion && (
              <div style={{ marginTop: 8 }}>
                <label><strong>Excluir estudiante:</strong></label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      excluirEstudiante(e.target.value);
                    }
                  }}
                  value=""
                  style={{fontSize:14, padding:6, width: '100%'}}
                >
                  <option value="">— Selecciona estudiante a excluir —</option>
                  {estudiantesParaExcluir.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} {m.apellido}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Lista de estudiantes excluidos */}
            {estudiantesExcluidos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <label><strong>Estudiantes excluidos:</strong></label>
                <div style={{ 
                  maxHeight: '100px', 
                  overflowY: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  padding: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {estudiantesExcluidos.map(est => (
                    <div key={est.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      <span>{est.nombre} {est.apellido}</span>
                      <button
                        onClick={() => reincluirEstudiante(est.id)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Reincluir en la ruleta"
                      >
                        ↺
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Estudiantes disponibles para sorteo: {miembrosDisponibles.length}
                </div>
              </div>
            )}
          </>
        )}

        {/* Comentario */}
        <label><strong>Comentario:</strong></label>
        <textarea
          rows={3}
          value={comentario}
          disabled={!incSel}
          onChange={e=>setComentario(e.target.value)}
          style={{padding:8,fontSize:16,resize:'none'}}
        />

        {/* Campos del Grupo Extra (solo si están seleccionados) */}
        {grupoExtraSel && (
          <>
            <label><strong>Grupo Extra:</strong></label>
            <input readOnly value={grupoExtraSel.nombre} style={{padding:8,fontSize:16}}/>
          </>
        )}

        {mbrExtraSel && (
          <>
            <label><strong>Integrante Extra:</strong></label>
            <input readOnly
              value={`${mbrExtraSel.nombre} ${mbrExtraSel.apellido}`}
              style={{padding:8,fontSize:16}}
            />
          </>
        )}

        {/* Switch Grupal/Individual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>Grupal</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={individual}
              disabled={!incSel}
              onChange={e => {
                setIndividual(e.target.checked);
                if (!e.target.checked && fase === 3) {
                  setFase(2);
                  // Limpiar exclusiones al cambiar a grupal
                  setEstudiantesExcluidos([]);
                  setMostrarExclusion(false);
                }
              }}
            />
            <span className="switch-slider"></span>
          </label>
          <label>Individual</label>
        </div>

        {/* Botón Ruleta Grupal Extra */}
        {puedeActivarExtra() && !ruletaExtraActiva && (
          <button 
            className="wheel-button" 
            onClick={activarRuletaExtra}
            style={{...botonEstilo, margin: '20px auto 0', display: 'block', backgroundColor: '#f58231'}}
          >
            Ruleta Grupal Extra
          </button>
        )}

        {/* Guardar */}
        {incSel && (!individual || mbrSel) && (
            <button className="wheel-button save-button" onClick={guardarSorteo} style={{...botonEstilo,
                  margin: '20px auto 0',     
                  display: 'block'}}>
                Guardar Resultado
              </button>
        )}
      </div>
    </div>
  );
}