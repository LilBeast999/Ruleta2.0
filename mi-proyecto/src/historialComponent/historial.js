// src/historial.js
import React, { useState, useEffect } from 'react';
import './historial.css';

function Historial({ onBackToMenu }) {
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    grupo: ''
  });

  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/sorteos')  // Ajusta la URL según tu configuración
      .then(response => response.json())
      .then(data => {
        const sortedData = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHistorial(sortedData);
        console.log("Sorteos obtenidos:", sortedData);
      })
      .catch(error => console.error("Error al obtener sorteos:", error));
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };

  const handleBuscar = () => {
    if (
      filtros.desde.trim() === "" &&
      filtros.hasta.trim() === "" &&
      filtros.grupo.trim() === ""
    ) {
      fetch('http://localhost:5000/sorteos')
        .then(response => {
          if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
          }
          return response.json();
        })
        .then(data => {
          const sortedData = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          setHistorial(sortedData);
          console.log("Sorteos encontrados:", sortedData);
        })
        .catch(error => console.error("Error al buscar sorteos:", error));
      return;
    }

    let fechaInicio = filtros.desde.trim() !== "" ? filtros.desde : new Date().toISOString();
    let fechaTermino = filtros.hasta.trim() !== "" ? filtros.hasta : new Date().toISOString();
    const grupo = filtros.grupo; 

    const isValidDate = (dateStr) => {
      const parsedDate = Date.parse(dateStr);
      return !isNaN(parsedDate);
    };

    if (!isValidDate(fechaInicio)) {
      fechaInicio = new Date().toISOString();
    }
    if (!isValidDate(fechaTermino)) {
      fechaTermino = new Date().toISOString();
    }

    const url = `http://localhost:5000/sorteos?fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_termino=${encodeURIComponent(fechaTermino)}&grupo=${encodeURIComponent(grupo)}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then(data => {
        const sortedData = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHistorial(sortedData);
        console.log("Sorteos encontrados:", sortedData);
      })
      .catch(error => console.error("Error al buscar sorteos:", error));
  };

  const toggleExpand = (id) => {
    setHistorial(historial.map(item => 
      item.id === id ? { ...item, expandido: !item.expandido } : item
    ));
  };

  return (
    <div className="historial-container">
      {/* Contenido Principal */}
      <div className="historial-content">
        {/* Panel de Filtros */}
        <div className="filtros-panel">
          <h2>Filtros</h2>
          <div>
            <label htmlFor="desde">Desde</label>
            <input
              type="date"
              id="desde"
              name="desde"
              value={filtros.desde}
              onChange={handleFiltroChange}
            />
          </div>
          <div>
            <label htmlFor="hasta">Hasta</label>
            <input
              type="date"
              id="hasta"
              name="hasta"
              value={filtros.hasta}
              onChange={handleFiltroChange}
            />
          </div>
          <div>
            <label htmlFor="grupo">Grupo</label>
            <input
              type="text"
              id="grupo"
              name="grupo"
              placeholder="Nombre"
              value={filtros.grupo}
              onChange={handleFiltroChange}
            />
          </div>
          <button onClick={handleBuscar}>Buscar</button>
        </div>
        
        {/* Tabla de Resultados */}
        <div className="table-container">
          <table className="historial-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Tipo Incidente</th>
                <th>Incidente</th>
                <th>Fecha</th>
                <th>Comentario</th>
                <th>Individual</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => {
                // Tratar la fecha como string y crear Date manualmente para evitar conversiones de zona horaria
                let fecha;
                try {
                  // Si la fecha viene como string "YYYY-MM-DD HH:MM:SS", parsearlo manualmente
                  if (typeof item.fecha === 'string' && item.fecha.includes(' ')) {
                    const [fechaParte, horaParte] = item.fecha.split(' ');
                    const [año, mes, dia] = fechaParte.split('-');
                    const [hora, minuto, segundo] = horaParte.split(':');
                    
                    // Crear fecha local sin conversión de zona horaria
                    fecha = new Date(
                      parseInt(año), 
                      parseInt(mes) - 1, // Los meses en JavaScript van de 0-11
                      parseInt(dia), 
                      parseInt(hora), 
                      parseInt(minuto), 
                      parseInt(segundo || 0)
                    );
                  } else {
                    // Fallback al método anterior
                    fecha = new Date(item.fecha);
                  }
                } catch (error) {
                  console.error('Error parseando fecha:', item.fecha, error);
                  fecha = new Date(); // Fecha actual como fallback
                }
                
                return (
                  <React.Fragment key={item.id}>
                    <tr className="historial-row">
                      <td>{item.grupo}</td>
                      <td>{item.tipoIncidente}</td>
                      <td>{item.incidente}</td>
                      <td>{fecha.toLocaleDateString('es-CL', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric'
                      })}</td>
                      <td>
                        {item.comentario.length > 30
                          ? `${item.comentario.substring(0, 30)}...`
                          : item.comentario}
                      </td>
                      <td>{item.alumno ? "Si" : "No"}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className={`expand-button ${item.expandido ? 'expanded' : ''}`}
                        >
                          {item.expandido ? '-' : '+'}
                        </button>
                      </td>
                    </tr>
                    {item.expandido && (
                      <tr className="expanded-row">
                        <td colSpan="7">
                          <div>
                            <p><strong>Grupo:</strong> {item.grupo}</p>
                            <p><strong>Tipo Incidente:</strong> {item.tipoIncidente}</p>
                            <p><strong>Incidente:</strong> {item.incidente}</p>
                            <p><strong>Fecha:</strong> {fecha.toLocaleString('es-CL', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}</p>
                            <p><strong>Comentario:</strong> {item.comentario}</p>
                            {item.alumno && (
                              <p>
                                <strong>Alumno:</strong> {item.alumno.nombre} {item.alumno.apellido}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Historial;