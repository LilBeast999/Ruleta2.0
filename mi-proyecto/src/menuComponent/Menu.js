// src/menuComponent/Menu.js
import React, { useState } from 'react';
import ExcelUploadModal from './ExcelUploadModal';
import './Menu.css';

export default function Menu({ onCreateRuleta, onRegister, onHistorial, onGirarRuleta, onCRUD }) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const handleExcelUpload = () => {
    setIsExcelModalOpen(true);
  };

  const handleModalClose = () => {
    setIsExcelModalOpen(false);
  };

  const handleFileSelected = (file, type) => {
    console.log('Archivo seleccionado:', file.name, 'Tipo:', type);
    // Aquí puedes manejar el archivo seleccionado
    // Por ejemplo, enviarlo a una función padre o procesarlo
  };

  return (
    <div className="menu-container">
      <div className="menu-button-container">
        <button 
          className="menu-button" 
          onClick={onCreateRuleta}
          title="Crear una nueva ruleta estándar"
        >
          Crear Ruleta Estándar
        </button>
        <button 
          className="menu-button" 
          onClick={onGirarRuleta}
          title="Iniciar el sorteo de la ruleta"
        >
          Girar Ruleta
        </button>
        <button 
          className="menu-button" 
          onClick={handleExcelUpload}
          title="Subir archivos Excel con datos"
        >
          Subir Excel de datos
        </button>
        <button 
          className="menu-button" 
          onClick={onCRUD}
          title="Administrar datos del sistema"
        >
          Administrar Datos
        </button>
        <button 
          className="menu-button" 
          onClick={onHistorial}
          title="Ver historial de ruletas anteriores"
        >
          Historial de Ruletas
        </button>
      </div>
      
      <ExcelUploadModal 
        isOpen={isExcelModalOpen}
        onClose={handleModalClose}
        onFileSelected={handleFileSelected}
      />

      {/* Sección informativa para optimizar espacio */}
      <div className="menu-info-section">
        <div className="info-card">
          <h3>Gestión de Incidencias</h3>
          <p>Administre categorías e incidencias para personalizar el sistema de sorteos según sus necesidades.</p>
        </div>
        <div className="info-card">
          <h3>Control de Grupos</h3>
          <p>Organice estudiantes en grupos y gestione la información de cada participante de forma eficiente.</p>
        </div>
        <div className="info-card">
          <h3>Historial Completo</h3>
          <p>Revise todos los sorteos realizados con detalles completos de fechas, participantes y resultados.</p>
        </div>
      </div>
    </div>
  );
}