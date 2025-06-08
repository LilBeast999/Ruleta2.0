// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './RuletaIncidencias.css';

export default function RuletaIncidencias({ onReturnToMenu }) {
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
    if (individual && grupoSel && incSel && fase === 3) {
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
    } else if (!individual && (fase === 3 || (fase >= 4 && mbrSel))) {
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
      console.log('Cargando miembros del grupo extra:', grupoExtraSel);
      fetch(`http://localhost:5000/grupo/${grupoExtraSel.id}`)
        .then(r => r.json())
        .then(data => {
          console.log('Respuesta del API:', data);
          if (Array.isArray(data.alumnos)) {
            console.log('Miembros encontrados:', data.alumnos);
            setMiembrosExtra(data.alumnos);
          } else {
            console.log('No se encontraron alumnos en la respuesta');
            setMiembrosExtra([]);
          }
        })
        .catch(error => {
          console.error('Error cargando miembros extra:', error);
          setMiembrosExtra([]);
        });
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

  // Función para determinar si se debe mostrar la ruleta individual
  const deberiaCargarMiembros = useMemo(() => {
    return individual && grupoSel && incSel && (fase === 2 || fase >= 4);
  }, [individual, grupoSel, incSel, fase]);

  // Función para activar la ruleta extra
  const activarRuletaExtra = () => {
    console.log('Activando ruleta extra, grupos disponibles:', gruposDisponibles);
    setRuletaExtraActiva(true);
    setFase(4);
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

  // Rueda genérica mejorada
  function Wheel({ titulos = [], onDone }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [mostrandoResultado, setMostrandoResultado] = useState(false);
    const [resultadoTexto, setResultadoTexto] = useState('');
    const [resultadoIndice, setResultadoIndice] = useState(null);

    const size = 600, center = size/2, radius = center - 10;
    const n = titulos.length, slice = 360 / (n || 1);
    const colors = useMemo(() => [
      '#e6194b','#f58231','#ffe119','#3cb44b','#42d4f4','#4363d8'
    ], []);

    // Función para ajustar el tamaño del texto según la longitud
    const getTextSize = (text, sliceAngle) => {
      const maxLength = 12;
      const minSize = 14; // Aumentado de 10 a 14
      const maxSize = 20; // Aumentado de 16 a 20
      
      // Calcular tamaño basado en la longitud del texto y el tamaño del slice
      const lengthFactor = Math.max(0.4, 1 - (text.length - maxLength) / 15);
      const sliceFactor = Math.max(0.6, sliceAngle / 50);
      
      return Math.max(minSize, maxSize * lengthFactor * sliceFactor);
    };

    // Función para dividir texto largo en múltiples líneas
    const wrapText = (text, maxLength = 10) => { // Reducido para líneas más cortas
      if (text.length <= maxLength) return [text];
      
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + word).length <= maxLength) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Si aún es muy largo, cortar palabras
      return lines.map(line => {
        if (line.length <= maxLength) return line;
        return line.substring(0, maxLength - 3) + '...';
      });
    };

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
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); // Línea más gruesa
        
        // Texto mejorado
        const mid = (start + end)/2;
        const texto = titulos[i] || '';
        const textSize = getTextSize(texto, slice);
        const lines = wrapText(texto, Math.max(6, Math.floor(15 - slice/12)));
        
        ctx.save();
        ctx.translate(center,center);
        ctx.rotate(mid);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${textSize}px Arial, sans-serif`; // Fuente más específica
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3; // Sombra más pronunciada
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Dibujar múltiples líneas centradas
        const lineHeight = textSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = -totalHeight/2 + lineHeight/2;
        
        lines.forEach((line, lineIndex) => {
          const y = startY + (lineIndex * lineHeight);
          ctx.fillText(line, radius*0.65, y); // Más cerca del borde para mejor visibilidad
        });
        
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
      setMostrandoResultado(false);
      
      // Algoritmo de giro más realista y variable
      const minVueltas = 3;
      const maxVueltas = 8;
      const vueltas = Math.random() * (maxVueltas - minVueltas) + minVueltas;
      
      // Añadir variabilidad al ángulo final
      const baseAngle = Math.random() * 360;
      const variabilidad = (Math.random() - 0.5) * slice * 0.8;
      const anguloFinal = baseAngle + variabilidad;
      
      const totalRotacion = vueltas * 360 + anguloFinal;
      setSpinAngle(prev => prev + totalRotacion);
      
      setTimeout(() => {
        setSpinning(false);
        
        // Calcular qué sección tocó el pointer considerando la variabilidad
        const anguloNormalizado = (totalRotacion % 360);
        const anguloPointer = (360 - anguloNormalizado) % 360;
        const indiceSeleccionado = Math.floor(anguloPointer / slice) % n;
        
        // Mostrar resultado arriba de la ruleta
        setResultadoTexto(titulos[indiceSeleccionado] || '');
        setResultadoIndice(indiceSeleccionado);
        setMostrandoResultado(true);
      }, 3500);
    };

    const continuarSiguienteRuleta = () => {
      setMostrandoResultado(false);
      onDone(resultadoIndice);
    };

    return (
      <div style={{ position:'relative', marginBottom:20 }}>
        {/* Contenedor de la ruleta con pointer pegado */}
        <div style={{ 
          position: 'relative', 
          width: size, 
          height: size,
          margin: '0 auto'
        }}>
          {/* Pointer corregido - pegado al borde derecho de la ruleta */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '-2px',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '20px solid transparent',
            borderBottom: '20px solid transparent',
            borderRight: '30px solid #d50000',
            zIndex: 3
          }} />

          {/* Rueda giratoria */}
          <div style={{
            width: size, 
            height: size, 
            borderRadius:'50%',
            boxShadow:'0 0 10px rgba(0,0,0,0.3)',
            transform:`rotate(${spinAngle}deg)`,
            transition: spinning ? 'transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
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
        </div>

        {/* Modal de resultado elegante */}
        {mostrandoResultado && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              animation: 'modalSlideIn 0.4s ease-out'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                🎯
              </div>
              <h2 style={{
                color: '#e53e3e',
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Resultado del Sorteo
              </h2>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '12px',
                margin: '1.5rem 0',
                border: '3px solid #e53e3e'
              }}>
                <p style={{
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  color: '#2d3748',
                  margin: 0,
                  lineHeight: 1.4,
                  wordWrap: 'break-word'
                }}>
                  {resultadoTexto}
                </p>
              </div>
              <button
                onClick={continuarSiguienteRuleta}
                style={{
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(229, 62, 62, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#c53030';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(229, 62, 62, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#e53e3e';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(229, 62, 62, 0.3)';
                }}
              >
                Siguiente Ruleta →
              </button>
            </div>
          </div>
        )}

        {/* Botón girar */}
        <button 
          className="wheel-button" 
          disabled={spinning || n === 0 || mostrandoResultado}
          onClick={spin}
          style={{
            display: 'block',
            margin: '30px auto 0',
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            fontWeight: '700',
            backgroundColor: '#89ac76',
            minWidth: '200px',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: spinning || mostrandoResultado ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {spinning ? 'Girando…' : 
           mostrandoResultado ? 'Ver resultado' : 
           n === 0 ? 'Sin opciones disponibles' : 'Girar ruleta'}
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
      onReturnToMenu?.();
    } catch (e) {
      console.error(e);
      alert('⚠️ Error guardando sorteo/comentario: ' + e.message);
      onReturnToMenu?.();
    }
  };

  return (
    <div className="ruleta-container">
      {/* Columna de controles */}
      <div className="controls-column">
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
                const nuevoIndividual = e.target.checked;
                setIndividual(nuevoIndividual);
                
                if (nuevoIndividual && incSel && grupoSel) {
                  // Si se activa individual y ya hay incidencia, ir a cargar miembros
                  setFase(3);
                } else if (!nuevoIndividual) {
                  // Si se desactiva individual, volver a fase 2
                  setFase(2);
                  setMbrSel(null);
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

      {/* Columna de la ruleta */}
      <div className="ruleta-column">
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
            onDone={i=>{ 
              setIncSel(incidencias[i]); 
              setMbrSel(null); 
            }}
          />
        )}
        {fase === 3 && individual && (
          <Wheel
            titulos={miembrosDisponibles.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrSel(miembrosDisponibles[i])}
          />
        )}
        {fase === 4 && ruletaExtraActiva && gruposDisponibles.length > 0 && (
          <Wheel
            titulos={gruposDisponibles.map(g=>g.nombre)}
            onDone={i=>{
              console.log('Grupo extra seleccionado:', gruposDisponibles[i]);
              setGrupoExtraSel(gruposDisponibles[i]); 
              setMbrExtraSel(null); 
              setFase(5);
            }}
          />
        )}
        
        {/* AGREGA ESTA LÍNEA para mostrar cuando no hay grupos disponibles */}
        {fase === 4 && ruletaExtraActiva && gruposDisponibles.length === 0 && (
          <div style={{ textAlign:'center', marginTop:200, color:'#888' }}>
            No hay otros grupos disponibles para seleccionar.
          </div>
        )}
        
        {fase === 5 && ruletaExtraActiva && miembrosExtra.length > 0 && (
          <Wheel
            titulos={miembrosExtra.map(m=>`${m.nombre} ${m.apellido}`)}
            onDone={i=>setMbrExtraSel(miembrosExtra[i])}
          />
        )}
        
        {/* AGREGA ESTA LÍNEA para mostrar cuando está cargando miembros */}
        {fase === 5 && ruletaExtraActiva && miembrosExtra.length === 0 && (
          <div style={{ textAlign:'center', marginTop:200, color:'#888' }}>
            Cargando miembros del grupo extra...
          </div>
        )}
      </div>
    </div>
  );
}