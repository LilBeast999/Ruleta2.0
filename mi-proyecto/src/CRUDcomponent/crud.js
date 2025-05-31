import React, { useState, useEffect } from 'react';
import './crud.css';

function CRUD() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categorias, setCategorias] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      switch (activeTab) {
        case 'categorias':
          const categoriasRes = await fetch('http://localhost:5000/categorias');
          const categoriasData = await categoriasRes.json();
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
          break;
        case 'incidencias':
          const incidenciasRes = await fetch('http://localhost:5000/incidencias');
          const incidenciasData = await incidenciasRes.json();
          setIncidencias(Array.isArray(incidenciasData) ? incidenciasData : []);
          break;
        case 'grupos':
          const gruposRes = await fetch('http://localhost:5000/grupos');
          const gruposData = await gruposRes.json();
          setGrupos(Array.isArray(gruposData) ? gruposData : []);
          break;
        case 'alumnos':
          const alumnosRes = await fetch('http://localhost:5000/alumnos');
          const alumnosData = await alumnosRes.json();
          setAlumnos(Array.isArray(alumnosData) ? alumnosData : []);
          break;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
    
    try {
      const endpoint = getEndpoint();
      await fetch(`http://localhost:5000/${endpoint}/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar el elemento');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = getEndpoint();
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `http://localhost:5000/${endpoint}/${editingItem.id}`
        : `http://localhost:5000/${endpoint}`;
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar el elemento');
    }
  };

  const getEndpoint = () => {
    const endpoints = {
      categorias: 'categorias',
      incidencias: 'incidencias',
      grupos: 'grupos',
      alumnos: 'alumnos'
    };
    return endpoints[activeTab];
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'categorias': return categorias;
      case 'incidencias': return incidencias;
      case 'grupos': return grupos;
      case 'alumnos': return alumnos;
      default: return [];
    }
  };

  const filteredData = getCurrentData().filter(item => {
    const matchesSearch = Object.values(item).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCategory = !selectedCategory || 
      (activeTab === 'incidencias' && item.categoria_id?.toString() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const renderTable = () => {
    const data = filteredData;
    
    if (data.length === 0) {
      return (
        <div className="empty-state">
          <p>No hay elementos para mostrar</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'categorias':
        return (
          <table className="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.descripcion}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'incidencias':
        return (
          <table className="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.descripcion}</td>
                  <td>{item.categoria_nombre}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'grupos':
        return (
          <table className="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Cantidad Alumnos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.descripcion}</td>
                  <td>{item.alumnos?.length || 0}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      case 'alumnos':
        return (
          <table className="crud-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>RUT</th>
                <th>Grupo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.nombre}</td>
                  <td>{item.apellido}</td>
                  <td>{item.rut}</td>
                  <td>{item.grupo_nombre}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      
      default:
        return null;
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
          <h2>{editingItem ? 'Editar' : 'Crear'} {activeTab.slice(0, -1)}</h2>
          
          <form onSubmit={handleSave}>
            {renderFormFields()}
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-save">
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'categorias':
        return (
          <>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
          </>
        );
      
      case 'incidencias':
        return (
          <>
            <div className="form-group">
              <label>Descripción:</label>
              <input
                type="text"
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Categoría:</label>
              <select
                value={formData.categoria_id || ''}
                onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
          </>
        );
      
      case 'grupos':
        return (
          <>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
          </>
        );
      
      case 'alumnos':
        return (
          <>
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido:</label>
              <input
                type="text"
                value={formData.apellido || ''}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>RUT:</label>
              <input
                type="text"
                value={formData.rut || ''}
                onChange={(e) => setFormData({...formData, rut: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Grupo:</label>
              <select
                value={formData.grupo_id || ''}
                onChange={(e) => setFormData({...formData, grupo_id: e.target.value})}
              >
                <option value="">Sin grupo</option>
                {grupos.map(grupo => (
                  <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                ))}
              </select>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h1>Administración de Datos</h1>
      </div>

      <div className="crud-tabs">
        <button 
          className={`tab-button ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          Categorías
        </button>
        <button 
          className={`tab-button ${activeTab === 'incidencias' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidencias')}
        >
          Incidencias
        </button>
        <button 
          className={`tab-button ${activeTab === 'grupos' ? 'active' : ''}`}
          onClick={() => setActiveTab('grupos')}
        >
          Grupos
        </button>
        <button 
          className={`tab-button ${activeTab === 'alumnos' ? 'active' : ''}`}
          onClick={() => setActiveTab('alumnos')}
        >
          Alumnos
        </button>
      </div>

      <div className="crud-toolbar">
        <div className="toolbar-left">
          <button onClick={handleCreate} className="btn-create">
            Crear {activeTab.slice(0, -1)}
          </button>
        </div>
        
        <div className="toolbar-right">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {activeTab === 'incidencias' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="crud-content">
        {renderTable()}
      </div>

      {renderModal()}
    </div>
  );
}

export default CRUD;
