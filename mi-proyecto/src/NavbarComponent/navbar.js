import React from 'react';
import logo from '../logo.png'; // Ajusta la ruta si es necesario
import './navbar.css';

function Navbar({ title, onBack }) {
  return (
    <header className="header">
      <div className="header-logo">
        <img src={logo} alt="Logo Universidad" />
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-button">
        {onBack && <button onClick={onBack}>Volver al menú</button>}
      </div>
    </header>
  );
}

export default Navbar;