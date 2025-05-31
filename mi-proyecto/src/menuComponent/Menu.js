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
        <button className="menu-button" onClick={onCreateRuleta}>
          Crear Ruleta Estándar
        </button>
        <button className="menu-button" onClick={onGirarRuleta}>
          Girar Ruleta
        </button>
        <button className="menu-button" onClick={handleExcelUpload}>
          Subir Excel de datos
        </button>
        <button className="menu-button" onClick={onCRUD}>
          Administrar Datos
        </button>
        <button className="menu-button" onClick={onHistorial}>
          Historial de Ruletas
        </button>
      </div>
      
      <ExcelUploadModal 
        isOpen={isExcelModalOpen}
        onClose={handleModalClose}
        onFileSelected={handleFileSelected}
      />
    </div>
  );
}