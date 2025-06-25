// src/RuletaIncidencias.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './RuletaIncidencias.css';
import config from './config';

export default function RuletaIncidencias() {
  // Estados del flujo paso a paso
  const [currentStep, setCurrentStep] = useState('group'); // 'group', 'category', 'incident', 'choose-path', 'individual', 'extra-group', 'extra-individual', 'comment'
  
  // Estados de selección
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedExtraGroup, setSelectedExtraGroup] = useState(null);
  const [selectedExtraMember, setSelectedExtraMember] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null); // 'simple', 'individual', 'extra'
  const [comment, setComment] = useState('');
  
  // Nuevo estado para notificaciones
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Estados de datos
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [members, setMembers] = useState([]);
  const [extraMembers, setExtraMembers] = useState([]);
  
  // Nuevo estado para sorteos del día
  const [sorteosHoy, setSorteosHoy] = useState([]);

  // Estados de carga
  const [loading, setLoading] = useState({
    groups: true,
    categories: false,
    incidents: false,
    members: false,
    extraMembers: false,
    saving: false,
    sorteosHoy: false
  });

  // Cargar grupos inicialmente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(prev => ({ ...prev, groups: true, sorteosHoy: true }));
      
      try {
        // Cargar grupos y sorteos del día en paralelo
        const [gruposRes, sorteosHoyRes] = await Promise.all([
          fetch(`${config.API_BASE_URL}/grupos`),
          fetch(`${config.API_BASE_URL}/sorteos/hoy`)
        ]);

        const gruposData = await gruposRes.json();
        const sorteosHoyData = await sorteosHoyRes.json();
        
        setGroups(Array.isArray(gruposData) ? gruposData : []);
        setSorteosHoy(Array.isArray(sorteosHoyData) ? sorteosHoyData : []);
        
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        setGroups([]);
        setSorteosHoy([]);
      } finally {
        setLoading(prev => ({ ...prev, groups: false, sorteosHoy: false }));
      }
    };

    cargarDatosIniciales();
  }, []);

  // Cargar categorías cuando pasa al paso de categorías
  useEffect(() => {
    if (currentStep === 'category') {
      setLoading(prev => ({ ...prev, categories: true }));
      fetch(`${config.API_BASE_URL}/categorias`)
        .then(r => r.json())
        .then(data => {
          setCategories(Array.isArray(data) ? data : []);
          setLoading(prev => ({ ...prev, categories: false }));
        })
        .catch(() => {
          setCategories([]);
          setLoading(prev => ({ ...prev, categories: false }));
        });
    }
  }, [currentStep]);

  // Cargar incidencias cuando se selecciona categoría
  useEffect(() => {
    if (currentStep === 'incident' && selectedCategory) {
      setLoading(prev => ({ ...prev, incidents: true }));
      fetch(`${config.API_BASE_URL}/incidencias/categoria/${selectedCategory.id}`)
        .then(r => r.json())
        .then(data => {
          setIncidents(Array.isArray(data) ? data : []);
          setLoading(prev => ({ ...prev, incidents: false }));
        })
        .catch(() => {
          setIncidents([]);
          setLoading(prev => ({ ...prev, incidents: false }));
        });
    }
  }, [currentStep, selectedCategory]);

  // Cargar miembros cuando se necesita para sorteo individual
  useEffect(() => {
    if (currentStep === 'individual' && selectedGroup && !members.length) {
      setLoading(prev => ({ ...prev, members: true }));
      fetch(`${config.API_BASE_URL}/grupo/${selectedGroup.id}`)
        .then(r => r.json())
        .then(data => {
          setMembers(Array.isArray(data.alumnos) ? data.alumnos : []);
          setLoading(prev => ({ ...prev, members: false }));
        })
        .catch(() => {
          setMembers([]);
          setLoading(prev => ({ ...prev, members: false }));
        });
    }
  }, [currentStep, selectedGroup, members.length]);

  // Cargar miembros del grupo extra
  useEffect(() => {
    if (currentStep === 'extra-individual' && selectedExtraGroup) {
      setLoading(prev => ({ ...prev, extraMembers: true }));
      fetch(`${config.API_BASE_URL}/grupo/${selectedExtraGroup.id}`)
        .then(r => r.json())
        .then(data => {
          setExtraMembers(Array.isArray(data.alumnos) ? data.alumnos : []);
          setLoading(prev => ({ ...prev, extraMembers: false }));
        })
        .catch(() => {
          setExtraMembers([]);
          setLoading(prev => ({ ...prev, extraMembers: false }));
        });
    }
  }, [currentStep, selectedExtraGroup]);

  // Componente de ruleta reutilizable
  function Wheel({ titles = [], onResult, isLoading = false, excludedOptions = [], onExclusionChange }) {
    const canvasRef = useRef(null);
    const [spinAngle, setSpinAngle] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultText, setResultText] = useState('');
    const [resultIndex, setResultIndex] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const size = 600, center = size/2, radius = center - 10;
    // Filtrar títulos disponibles excluyendo los seleccionados
    const availableTitles = titles.filter(title => !excludedOptions.includes(title));
    const n = availableTitles.length, slice = 360 / (n || 1);
    const colors = useMemo(() => [
      '#e6194b','#f58231','#ffe119','#3cb44b','#42d4f4','#4363d8'
    ], []);

    // Función para ajustar el tamaño del texto según la longitud
    const getTextSize = (text, sliceAngle) => {
      const maxLength = 12;
      const minSize = 14;
      const maxSize = 20;
      const lengthFactor = Math.max(0.4, 1 - (text.length - maxLength) / 15);
      const sliceFactor = Math.max(0.6, sliceAngle / 50);
      return Math.max(minSize, maxSize * lengthFactor * sliceFactor);
    };

    // Función para dividir texto largo en múltiples líneas
    const wrapText = (text, maxLength = 10) => {
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
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        
        const mid = (start + end)/2;
        const texto = availableTitles[i] || '';
        const textSize = getTextSize(texto, slice);
        const lines = wrapText(texto, Math.max(6, Math.floor(15 - slice/12)));
        
        ctx.save();
        ctx.translate(center,center);
        ctx.rotate(mid);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${textSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        const lineHeight = textSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = -totalHeight/2 + lineHeight/2;
        
        lines.forEach((line, lineIndex) => {
          const y = startY + (lineIndex * lineHeight);
          ctx.fillText(line, radius*0.65, y);
        });
        
        ctx.restore();
      }
    }, [availableTitles, slice, center, radius, colors, n]);

    useEffect(() => {
      draw();
    }, [draw]);

    const spin = () => {
      if (spinning || n === 0 || showResult || isProcessing) return;
      
      setIsProcessing(true);
      setSpinning(true);
      setShowResult(false);
      
      const minVueltas = 3;
      const maxVueltas = 8;
      const vueltas = Math.random() * (maxVueltas - minVueltas) + minVueltas;
      const baseAngle = Math.random() * 360;
      const totalRotacion = vueltas * 360 + baseAngle;
      setSpinAngle(prev => prev + totalRotacion);
      
      setTimeout(() => {
        setSpinning(false);
        const anguloNormalizado = (totalRotacion % 360);
        const anguloPointer = (360 - anguloNormalizado) % 360;
        const indiceSeleccionado = Math.floor(anguloPointer / slice) % n;
        
        setResultText(availableTitles[indiceSeleccionado] || '');
        // Encontrar el índice en el array original
        const originalIndex = titles.indexOf(availableTitles[indiceSeleccionado]);
        setResultIndex(originalIndex);
        
        setTimeout(() => {
          setShowResult(true);
        }, 1000);
      }, 3500);
    };

    const continueToNext = () => {
      setShowResult(false);
      setIsProcessing(false);
      onResult(resultIndex);
    };

    if (isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #e53e3e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando datos...</p>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ 
          position: 'relative', 
          width: size, 
          height: size,
          margin: '0 auto'
        }}>
          {/* Pointer */}
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

          {/* Rueda */}
          <div style={{
            width: size, 
            height: size, 
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            transform: `rotate(${spinAngle}deg)`,
            transition: spinning ? 'transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}>
            <canvas ref={canvasRef} width={size} height={size}
              style={{ borderRadius: '50%', display: 'block' }} />
          </div>

          {/* Botón central para girar */}
          <button
            disabled={spinning || n === 0 || showResult || isProcessing}
            onClick={spin}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '4px solid #fff',
              background: (spinning || isProcessing)
                ? 'linear-gradient(45deg, #9ca3af, #6b7280)' 
                : showResult
                ? 'linear-gradient(45deg, #10b981, #059669)'
                : availableTitles.length < 2
                ? 'linear-gradient(45deg, #9ca3af, #6b7280)'
                : 'linear-gradient(45deg, #e53e3e, #dc2626)',
              color: 'white',
              fontSize: (spinning || isProcessing) ? '0.75rem' : showResult ? '0.9rem' : '1rem',
              fontWeight: '700',
              cursor: (spinning || showResult || isProcessing || availableTitles.length < 2) ? 'not-allowed' : 'pointer',
              zIndex: 4,
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              lineHeight: '1.2'
            }}
            onMouseEnter={(e) => {
              if (!spinning && !showResult && !isProcessing && availableTitles.length >= 2) {
                e.target.style.transform = 'translate(-50%, -50%) scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!spinning && !showResult && !isProcessing) {
                e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
              }
            }}
          >
            {(spinning || isProcessing) ? 'Girando...' : 
             showResult ? 'Resultado' :
             availableTitles.length === 0 ? 'Sin datos' : 
             availableTitles.length < 2 ? 'Mín. 2 opciones' : 'GIRAR'}
          </button>
        </div>

        {/* MODAL DE RESULTADO RESTAURADO - Este te gustaba */}
        {showResult && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h2 style={{
                color: '#e53e3e',
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                fontWeight: '700'
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
                  wordWrap: 'break-word'
                }}>
                  {resultText}
                </p>
              </div>
              <button
                onClick={continueToNext}
                style={{
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#e53e3e';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Estados para exclusiones por paso
  const [exclusions, setExclusions] = useState({
    category: [],
    incident: [],
    individual: [],
    'extra-group': [],
    'extra-individual': []
  });

  // Función para manejar exclusiones según el paso actual
  const handleExclusionChange = (newExclusions) => {
    setExclusions(prev => ({
      ...prev,
      [currentStep]: newExclusions
    }));
  };

  // Función para obtener títulos según el paso actual
  const getCurrentWheelTitles = () => {
    switch (currentStep) {
      case 'category':
        return categories.map(c => c.nombre);
      case 'incident':
        return incidents.map(i => i.descripcion);
      case 'individual':
        return members.map(m => `${m.nombre} ${m.apellido}`);
      case 'extra-group':
        return groups.filter(g => g.id !== selectedGroup?.id).map(g => g.nombre);
      case 'extra-individual':
        return extraMembers.map(m => `${m.nombre} ${m.apellido}`);
      default:
        return [];
    }
  };

  // Función para manejar resultado de la ruleta
  const handleWheelResult = (index) => {
    const currentTitles = getCurrentWheelTitles();
    const currentExclusions = exclusions[currentStep] || [];
    const availableTitles = currentTitles.filter(title => !currentExclusions.includes(title));
    const selectedTitle = availableTitles[index];
    const originalIndex = currentTitles.indexOf(selectedTitle);

    switch (currentStep) {
      case 'category':
        setSelectedCategory(categories[originalIndex]);
        setCurrentStep('incident');
        break;
      case 'incident':
        setSelectedIncident(incidents[originalIndex]);
        setCurrentStep('choose-path');
        break;
      case 'individual':
        setSelectedMember(members[originalIndex]);
        if (selectedPath === 'extra') {
          setCurrentStep('extra-group');
        } else {
          setCurrentStep('comment');
        }
        break;
      case 'extra-group':
        const availableGroups = groups.filter(g => g.id !== selectedGroup?.id);
        setSelectedExtraGroup(availableGroups[originalIndex]);
        setCurrentStep('extra-individual');
        break;
      case 'extra-individual':
        setSelectedExtraMember(extraMembers[originalIndex]);
        setCurrentStep('comment');
        break;
      default:
        console.warn('Paso no reconocido:', currentStep);
        break;
    }
  };

  // Función para verificar si está cargando
  const isCurrentStepLoading = () => {
    switch (currentStep) {
      case 'category': return loading.categories;
      case 'incident': return loading.incidents;
      case 'individual': return loading.members;
      case 'extra-individual': return loading.extraMembers;
      default: return false;
    }
  };

  // Función para obtener mensaje del paso actual
  const getStepMessage = () => {
    switch (currentStep) {
      case 'group': return "Selecciona un grupo para comenzar";
      case 'category': return `Grupo: ${selectedGroup?.nombre} - Sortear Categoría`;
      case 'incident': return `Categoría: ${selectedCategory?.nombre} - Sortear Incidencia`;
      case 'choose-path': return "¿Qué quieres hacer ahora?";
      case 'individual': return selectedPath === 'extra' ? "Sortear Integrante del Grupo Principal" : "Sortear Integrante";
      case 'extra-group': return "Sortear Grupo Extra";
      case 'extra-individual': return `Grupo Extra: ${selectedExtraGroup?.nombre} - Sortear Integrante`;
      case 'comment': return "Finalizar y Guardar";
      default: return "";
    }
  };

  // Función para mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  };

  // Función para verificar si un grupo ya sorteó hoy
  const getInfoSorteoHoy = (grupoId) => {
    return sorteosHoy.find(sorteo => sorteo.id_grupo === grupoId);
  };

  // Función para guardar sorteo
  const handleSave = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    
    let fullComment = comment.trim() || 'Sorteo realizado';
    if (selectedExtraGroup && selectedExtraMember) {
      fullComment += ` | Grupo Extra: ${selectedExtraGroup.nombre} | Integrante Extra: ${selectedExtraMember.nombre} ${selectedExtraMember.apellido}`;
    }
    
    const payload = {
      id_grupo: selectedGroup.id,
      fecha: new Date().toISOString(), // Solo para cumplir con el backend, se ignorará
      id_profesor: 4,
      id_incidencia: selectedIncident.id,
      id_alumno: selectedMember ? selectedMember.id : null,
      comentario: fullComment,
      comentario_fecha: new Date().toISOString() // Solo para cumplir con el backend, se ignorará
    };

    try {
      const response = await fetch(`${config.API_BASE_URL}/sorteo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }

      showNotification('success', '🎉 ¡Sorteo guardado correctamente! Se ha registrado en el historial.');
      
      // Actualizar sorteos del día después de guardar
      try {
        const sorteosHoyRes = await fetch(`${config.API_BASE_URL}/sorteos/hoy`);
        const sorteosHoyData = await sorteosHoyRes.json();
        setSorteosHoy(Array.isArray(sorteosHoyData) ? sorteosHoyData : []);
      } catch (error) {
        console.error('Error actualizando sorteos del día:', error);
      }
      
      setTimeout(() => {
        resetProcess();
      }, 2000);
    } catch (error) {
      showNotification('error', `❌ Error al guardar el sorteo: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Función para reiniciar proceso
  const resetProcess = () => {
    setCurrentStep('group');
    setSelectedGroup(null);
    setSelectedCategory(null);
    setSelectedIncident(null);
    setSelectedMember(null);
    setSelectedExtraGroup(null);
    setSelectedExtraMember(null);
    setSelectedPath(null);
    setComment('');
    setMembers([]);
    setExtraMembers([]);
  };

  return (
    <div className="ruleta-container">
      {/* Notificación flotante */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          border: '1px solid',
          maxWidth: '400px',
          fontSize: '0.95rem',
          fontWeight: '600',
          backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          borderColor: notification.type === 'success' ? '#22c55e' : '#ef4444',
          color: notification.type === 'success' ? '#15803d' : '#dc2626',
          animation: 'slideInFromRight 0.4s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>
              {notification.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Columna de la ruleta (IZQUIERDA) */}
      <div className="ruleta-column">
        {currentStep === 'group' && (
          <div style={{ textAlign: 'center', marginTop: 200, color: '#888' }}>
            <h2 style={{ color: '#2d3748' }}>Bienvenido al Sorteo</h2>
            <p>Selecciona un grupo en el panel de la derecha para comenzar</p>
          </div>
        )}
        
        {['category', 'incident', 'individual', 'extra-group', 'extra-individual'].includes(currentStep) && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
              {getStepMessage()}
            </h3>
            <Wheel
              titles={getCurrentWheelTitles()}
              onResult={handleWheelResult}
              isLoading={isCurrentStepLoading()}
              excludedOptions={exclusions[currentStep] || []}
              onExclusionChange={handleExclusionChange}
            />
          </div>
        )}
      </div>

      {/* Columna de controles (DERECHA) */}
      <div className="controls-column">
        {/* Progreso visual compacto */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '2px solid #e53e3e'
        }}>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#2d3748',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {getStepMessage()}
          </div>
        </div>

        {/* Panel de exclusión - solo para pasos de sorteo que NO sean category o incident */}
        {['individual', 'extra-group', 'extra-individual'].includes(currentStep) && getCurrentWheelTitles().length > 2 && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '2px solid #e53e3e'
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#2d3748',
              fontSize: '0.95rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              🚫 Excluir del Sorteo
            </h4>
            <p style={{ 
              textAlign: 'center', 
              margin: '0 0 1rem 0', 
              fontSize: '0.8rem',
              color: '#666'
            }}>
              Disponibles: {getCurrentWheelTitles().filter(title => !(exclusions[currentStep] || []).includes(title)).length} de {getCurrentWheelTitles().length}
            </p>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {getCurrentWheelTitles().map((option, index) => {
                const isExcluded = (exclusions[currentStep] || []).includes(option);
                const canExclude = getCurrentWheelTitles().length - (exclusions[currentStep] || []).length > 2;
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isExcluded || canExclude) {
                        const currentExclusions = exclusions[currentStep] || [];
                        if (isExcluded) {
                          handleExclusionChange(currentExclusions.filter(item => item !== option));
                        } else {
                          handleExclusionChange([...currentExclusions, option]);
                        }
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: isExcluded ? '2px solid #dc3545' : '2px solid #28a745',
                      backgroundColor: isExcluded ? '#ffe6e6' : 'white',
                      cursor: (isExcluded || canExclude) ? 'pointer' : 'not-allowed',
                      opacity: (!isExcluded && !canExclude) ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '500',
                      color: isExcluded ? '#dc3545' : '#2d3748'
                    }}>
                      {option}
                    </span>
                    {isExcluded && (
                      <span style={{
                        color: '#dc3545',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}>✕</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <button
                onClick={() => handleExclusionChange([])}
                disabled={(exclusions[currentStep] || []).length === 0}
                style={{
                  background: (exclusions[currentStep] || []).length === 0 ? '#9ca3af' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: (exclusions[currentStep] || []).length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                Limpiar Exclusiones
              </button>
            </div>

            {getCurrentWheelTitles().filter(title => !(exclusions[currentStep] || []).includes(title)).length < 2 && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '5px',
                padding: '0.5rem',
                margin: '0.75rem 0 0 0',
                textAlign: 'center',
                color: '#856404',
                fontSize: '0.8rem'
              }}>
                ⚠️ Mínimo 2 opciones para sortear
              </div>
            )}
          </div>
        )}

        {/* Resumen compacto de selecciones anteriores */}
        {(selectedGroup || selectedCategory || selectedIncident || selectedMember || selectedExtraGroup || selectedExtraMember) && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #6b7280'
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#2d3748',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}>
              Selecciones Realizadas:
            </h4>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#4a5568' }}>
              {selectedGroup && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Grupo:</strong> {selectedGroup.nombre}
                </div>
              )}
              {selectedCategory && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Categoría:</strong> {selectedCategory.nombre}
                </div>
              )}
              {selectedIncident && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Incidencia:</strong> {selectedIncident.descripcion}
                </div>
              )}
              {selectedMember && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Integrante:</strong> {selectedMember.nombre} {selectedMember.apellido}
                </div>
              )}
              {selectedExtraGroup && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Grupo Extra:</strong> {selectedExtraGroup.nombre}
                </div>
              )}
              {selectedExtraMember && (
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>Integrante Extra:</strong> {selectedExtraMember.nombre} {selectedExtraMember.apellido}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solo mostrar el control activo según el paso */}
        
        {/* Paso 1: Seleccionar Grupo */}
        {currentStep === 'group' && (
          <div>
            <label style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Selecciona un Grupo:
            </label>
            {loading.groups || loading.sorteosHoy ? (
              <div style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                🔄 Cargando grupos...
              </div>
            ) : (
              <select
                value={selectedGroup?.id || ''}
                onChange={(e) => {
                  const group = groups.find(g => g.id === +e.target.value);
                  setSelectedGroup(group);
                  if (group) setCurrentStep('category');
                }}
                style={{ 
                  fontSize: '1rem', 
                  padding: '0.75rem',
                  width: '100%',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  backgroundColor: 'white'
                }}
              >
                <option value="">— Selecciona un grupo —</option>
                {groups.map(g => {
                  const sorteoInfo = getInfoSorteoHoy(g.id);
                  const yaSorteo = !!sorteoInfo;
                  const label = yaSorteo ? `${g.nombre} ✅` : g.nombre;
                  
                  return (
                    <option 
                      key={g.id} 
                      value={g.id}
                      style={{ 
                        backgroundColor: yaSorteo ? '#dcfce7' : 'white',
                        color: yaSorteo ? '#166534' : 'inherit',
                        fontWeight: yaSorteo ? '600' : 'normal'
                      }}
                    >
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}

        {/* Paso: Elegir camino - LOS 3 ESCENARIOS con paleta oficial */}
        {currentStep === 'choose-path' && (
          <div>
            <label style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '1rem',
              display: 'block',
              textAlign: 'center'
            }}>
              ¿Qué quieres hacer ahora?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* ESCENARIO 1: Simple - Rojo principal */}
              <button
                onClick={() => {
                  setSelectedPath('simple');
                  setCurrentStep('comment');
                }}
                style={{
                  padding: '1rem',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#e53e3e';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  📝 Finalizar con Comentario
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Guardar el sorteo grupal con comentario y terminar
                </div>
              </button>

              {/* ESCENARIO 2: Individual - Gris oscuro */}
              <button
                onClick={() => {
                  setSelectedPath('individual');
                  setCurrentStep('individual');
                }}
                style={{
                  padding: '1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  👤 Sortear Integrante del Grupo
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Seleccionar un integrante del grupo actual y luego comentario
                </div>
              </button>

              {/* ESCENARIO 3: Extra - Negro/Gris muy oscuro */}
              <button
                onClick={() => {
                  setSelectedPath('extra');
                  setCurrentStep('individual');
                }}
                style={{
                  padding: '1rem',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#1f2937';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#374151';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  👥 Sorteo Grupal Extra
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Integrante del grupo + otro grupo + integrante extra
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Paso final: Comentario y guardar */}
        {currentStep === 'comment' && (
          <div>
            {/* Resumen final con paleta oficial */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1.25rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '2px solid #e53e3e'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                color: '#2d3748',
                fontSize: '1.1rem',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                🎯 Resumen Final del Sorteo
              </h4>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#2d3748' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <strong>Tipo:</strong> 
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: selectedPath === 'simple' ? '#e53e3e' : selectedPath === 'individual' ? '#6b7280' : '#374151',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {selectedPath === 'simple' ? 'Grupal' : selectedPath === 'individual' ? 'Individual' : 'Grupal Extra'}
                  </span>
                  
                  <strong>Grupo:</strong> 
                  <span>{selectedGroup.nombre}</span>
                  
                  <strong>Categoría:</strong> 
                  <span>{selectedCategory.nombre}</span>
                  
                  <strong>Incidencia:</strong> 
                  <span>{selectedIncident.descripcion}</span>
                  
                  {selectedMember && (
                    <>
                      <strong>Integrante:</strong> 
                      <span>{selectedMember.nombre} {selectedMember.apellido}</span>
                    </>
                  )}
                  {selectedExtraGroup && (
                    <>
                      <strong>Grupo Extra:</strong> 
                      <span>{selectedExtraGroup.nombre}</span>
                    </>
                  )}
                  {selectedExtraMember && (
                    <>
                      <strong>Integrante Extra:</strong> 
                      <span>{selectedExtraMember.nombre} {selectedExtraMember.apellido}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <label style={{ 
              fontSize: '1rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem',
              display: 'block'
            }}>
              Comentario del Sorteo:
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agrega un comentario sobre este sorteo... (opcional)"
              style={{ 
                padding: '0.75rem', 
                fontSize: '0.95rem', 
                resize: 'vertical',
                width: '100%',
                borderRadius: '6px',
                border: '2px solid #e2e8f0',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              marginTop: '1.5rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setCurrentStep('choose-path')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ← Volver
              </button>
              <button
                onClick={handleSave}
                disabled={loading.saving}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: loading.saving ? '#9ca3af' : '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading.saving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  boxShadow: loading.saving ? 'none' : '0 2px 4px rgba(229, 62, 62, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!loading.saving) {
                    e.target.style.backgroundColor = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(229, 62, 62, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading.saving) {
                    e.target.style.backgroundColor = '#e53e3e';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(229, 62, 62, 0.3)';
                  }
                }}
              >
                {loading.saving ? (
                  <>
                    <span style={{ marginRight: '0.5rem' }}>💾</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '0.5rem' }}>💾</span>
                    Guardar Sorteo
                  </>
                )}
                {loading.saving && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 1.5s infinite'
                  }} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Botón reiniciar con paleta oficial */}
        {currentStep !== 'group' && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={resetProcess}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.3)';
              }}
            >
              🔄 Reiniciar Proceso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}