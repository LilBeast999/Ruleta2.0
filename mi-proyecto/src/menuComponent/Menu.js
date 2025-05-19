// src/Menu.js
import React from 'react';
import './Menu.css';

export default function Menu({ onCreateRuleta, onRegister, onHistorial, onGirarRuleta }) {
  return (
    <div className="menu-container">
      <div className="menu-button-container">
        <button className="menu-button" onClick={onCreateRuleta}>
          Crear Ruleta Estándar
        </button>
        <button className="menu-button" onClick={onGirarRuleta}>
          Girar Ruleta
        </button>
        <button className="menu-button">
          Subir Excel de datos
        </button>
        <button className="menu-button" onClick={onHistorial}>
          Historial de Ruletas
        </button>
      </div>
    </div>
  );
}
