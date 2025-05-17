// src/historial.js
import React, { useState, useEffect } from 'react';
import './historial.css';

function Historial({ onBackToMenu }) {
  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    grupo: ''
  });

  // Estado para los resultados del historial
  const [historial, setHistorial] = useState([]);

  // Llamada inicial sin filtros (opcional)
  useEffect(() => {
    fetch('http://localhost:5000/sorteos')  // Ajusta la URL según tu configuración
      .then(response => response.json())
      .then(data => {
        setHistorial(data);
        console.log("Sorteos obtenidos:", data);
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

  // Función modificada para buscar usando los 3 filtros
  const handleBuscar = () => {
    // Si las fechas están vacías, se rellenan con la fecha actual en formato ISO
    let fechaInicio = filtros.desde.trim() !== "" ? filtros.desde : new Date().toISOString();
    let fechaTermino = filtros.hasta.trim() !== "" ? filtros.hasta : new Date().toISOString();
    const grupo = filtros.grupo; // Puede quedar vacío

    // Validar formato básico (con Date.parse, por ejemplo)
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

    // Construir la URL con query params codificados
    const url = `http://localhost:5000/sorteos?fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_termino=${encodeURIComponent(fechaTermino)}&grupo=${encodeURIComponent(grupo)}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        return response.json();
      })
      .then(data => {
        setHistorial(data);
        console.log("Sorteos encontrados:", data);
      })
      .catch(error => console.error("Error al buscar sorteos:", error));
  };

  // Función para expandir/contraer detalles
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
                <th>Alumno</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="historial-row">
                    <td>{item.grupo}</td>
                    <td>{item.tipoIncidente}</td>
                    <td>{item.incidente}</td>
                    <td>{item.fecha}</td>
                    <td>
                      {item.comentario.length > 30
                        ? `${item.comentario.substring(0, 30)}...`
                        : item.comentario}
                    </td>
                    <td>
                      {item.alumno ? (
                        // Se muestran los datos del alumno. Ajusta los campos según tu modelo.
                        `${item.alumno.nombre || ''} ${item.alumno.apellido || ''}`
                      ) : (
                        "Sin alumno"
                      )}
                    </td>
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
                          <p><strong>Fecha:</strong> {item.fecha}</p>
                          <p><strong>Comentario:</strong> {item.comentario}</p>
                          {item.alumno && (
                            <p>
                              <strong>Alumno:</strong> {item.alumno.nombre || ''} {item.alumno.apellido || ''}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Historial;