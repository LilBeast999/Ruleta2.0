// src/menuComponent/ExcelUploadModal.js
import React, { useState } from 'react';
import './ExcelUploadModal.css';
import config from '../config';

export default function ExcelUploadModal({ isOpen, onClose, onFileSelected }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [clearData, setClearData] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Nuevo estado

  // reinicia el estado del modal
  const resetModal = () => {
    setSelectedFile(null);
    setUploadStatus({ type: '', message: '' });
    setClearData(false);
    setIsUploading(false); // Resetear estado de carga
  };

  const handleFileSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedFile({ file, type });
        if (onFileSelected) {
          onFileSelected(file, type);
        }
      }
    };
    input.click();
  };
  const handleGenerate = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true); // Iniciar estado de carga
    setUploadStatus({ type: '', message: '' }); // Limpiar mensajes anteriores
    
    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('clearData', clearData.toString());

    // define la url según el tipo de excel seleccionado
    let url = '';
    if (selectedFile.type === 'incidencias') {
      url = `${config.API_BASE_URL}/upload_excel_incidencias`;
    } else if (selectedFile.type === 'alumnos') {
      url = `${config.API_BASE_URL}/upload_excel_grupos_alumnos`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setUploadStatus({ type: 'success', message: data.message || 'Archivo subido correctamente' });
      } else {
        setUploadStatus({ type: 'error', message: data.error || 'Error al subir el archivo' });
      }
      // reinicia el modal y cierra tras 3 segundos
      setTimeout(() => {
        resetModal();
        onClose();
      }, 3000);
    } catch (error) {
      console.error('error subiendo excel:', error);
      setUploadStatus({ type: 'error', message: 'Error al subir el archivo' });
      setTimeout(() => {
        resetModal();
      }, 3000);
    } finally {
      setIsUploading(false); // Finalizar estado de carga
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="modal-close-btn" onClick={handleClose}>
          ✕
        </button>
        
        <h2 className="modal-title">Subir excel con información</h2>
        
        <div className="upload-options">
          <div 
            className={`upload-option ${selectedFile?.type === 'incidencias' ? 'selected' : ''}`}
            onClick={() => handleFileSelect('incidencias')}
          >
            <div className="upload-icon documents-icon">
              <div className="document-stack">
                <div className="document document-1"></div>
                <div className="document document-2"></div>
                <div className="document document-3"></div>
              </div>
            </div>
            <span className="upload-label">Subir excel de incidencias</span>
          </div>
          
          <div 
            className={`upload-option ${selectedFile?.type === 'alumnos' ? 'selected' : ''}`}
            onClick={() => handleFileSelect('alumnos')}
          >
            <div className="upload-icon user-icon">
              <div className="user-silhouette"></div>
            </div>
            <span className="upload-label">Subir excel de alumnos</span>
          </div>
        </div>
          {selectedFile && (
          <div className="file-selected">
            <span className="file-name">{selectedFile.file.name}</span>
          </div>
        )}

        {/* opción para limpiar datos existentes */}
        {selectedFile && (
          <div className="clear-data-option">
            <label className="clear-data-label">
              <input
                type="checkbox"
                checked={clearData}
                onChange={(e) => setClearData(e.target.checked)}
                className="clear-data-checkbox"
              />
              <span className="checkmark"></span>
              Limpiar datos existentes antes de importar
            </label>
            <div className="clear-data-warning">
              ⚠️ Esta acción eliminará todos los datos relacionados (sorteos, comentarios, etc.)
            </div>
          </div>
        )}
        
        {/* enlaces para descargar plantillas pre-generadas */}
        <div className="templates-section">
          <h3 className="templates-title">Descargar plantillas</h3>
          <div className="templates-links">
            <a className="template-link" href="/plantilla_incidencias.xlsx" download>
              Plantilla de incidencias
            </a>
            <a className="template-link" href="/plantilla_alumnos.xlsx" download>
              Plantilla de alumnos
            </a>
          </div>
        </div>
        
        {/* mensaje de confirmación con estética personalizada */}
        {uploadStatus.message && (
          <div className={`status-message ${uploadStatus.type}`}>
            {uploadStatus.type === 'success' ? (
              <span className="status-icon">&#10003;</span>
            ) : (
              <span className="status-icon">&#9888;</span>
            )}
            <span className="status-text">{uploadStatus.message}</span>
          </div>
        )}
        
        <button 
          className={`generate-btn ${isUploading ? 'processing' : ''}`}
          onClick={handleGenerate}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Procesando Excel...' : 'Subir'}
        </button>
      </div>
    </div>
  );
}