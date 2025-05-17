// src/historial.js
import React, { useState } from 'react';
import './historial.css';

function Historial({ onBackToMenu }) {
  // Estado para los filtros
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    grupo: ''
  });

  // Estado para los resultados del historial
  const [historial, setHistorial] = useState([
    {
      id: 1,
      grupo: 'Grupo 1',
      tipoIncidente: 'Organizacional',
      incidente: 'Problemas en la coordinacion',
      fecha: '24/12/2025',
      comentario: 'un integrante del equipo saboteara de alguna forma (commits erroneos, o dando ideas que causen conflicto)',
      expandido: true
    },
    {
      id: 2,
      grupo: 'Grupo 2',
      tipoIncidente: 'Administrativo',
      incidente: 'Horario cambiado',
      fecha: '17/12/2025',
      comentario: 'el nuevo horario de reuniones sera los viernes a las 15:00',
      expandido: false
    }
  ]);


  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
  };


  const handleBuscar = () => {
    console.log('Buscando con filtros:', filtros);
    // Aquí se puede agregar la llamada al servidor
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
              type="text"
              id="desde"
              name="desde"
              placeholder="dd/mm/aa"
              value={filtros.desde}
              onChange={handleFiltroChange}
            />
          </div>
          <div>
            <label htmlFor="hasta">Hasta</label>
            <input
              type="text"
              id="hasta"
              name="hasta"
              placeholder="dd/mm/aa"
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
                      <td colSpan="6">
                        <div>
                          <p><strong>Grupo:</strong> {item.grupo}</p>
                          <p><strong>Tipo Incidente:</strong> {item.tipoIncidente}</p>
                          <p><strong>Incidente:</strong> {item.incidente}</p>
                          <p><strong>Fecha:</strong> {item.fecha}</p>
                          <p><strong>Comentario:</strong> {item.comentario}</p>
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