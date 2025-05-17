// src/App.js
import React, { useState } from 'react';
import Login from './Login';
import Menu from './Menu';
import Ruleta from './Ruleta';
import RuletaIncidencias from './RuletaIncidencias';
import './App.css';
import logo from './logo.png';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'menu' | 'ruleta-estandar' | 'incidencias'
  
  const defaultInput = ['Titulo1', 'Titulo2', 'Titulo3', 'Titulo4'].join('\n');
  const [rawInput, setRawInput] = useState(defaultInput);
  const titulosEstandar = rawInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  // 1) Pantalla de login
  if (!user) {
    return (
      <Login
        onLogin={(rut) => {
          setUser(rut);
          setCurrentView('menu');
        }}
      />
    );
  }

  // 2) Menú principal
  if (currentView === 'menu') {
    return (
      <Menu
        onCreateRuleta={() => setCurrentView('ruleta-estandar')}
        onShowRuleta={() => setCurrentView('incidencias')}
      />
    );
  }

  // 3) Ruleta estándar
  if (currentView === 'ruleta-estandar') {
    return (
      <div className="App">
        <header className="header">
          <div className="header-logo">
            <img src={logo} alt="Logo Universidad" />
          </div>
          <h1 className="header-title">Ruleta Estándar</h1>
          <div className="header-button">
            <button onClick={() => setCurrentView('menu')}>
              Volver al menú
            </button>
          </div>
        </header>
        <main className="content">
          <section className="ruleta-section">
            <Ruleta titulos={titulosEstandar} />
          </section>
          <section className="titulos-section">
            <h2>Títulos para la Ruleta</h2>
            <textarea
              className="titulos-textarea"
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="Escribe cada opción en una línea"
            />
          </section>
        </main>
      </div>
    );
  }

  // 4) Ruleta de incidencias
  if (currentView === 'incidencias') {
    return (
      <div className="App">
        <header className="header">
          <div className="header-logo">
            <img src={logo} alt="Logo Universidad" />
          </div>
          <h1 className="header-title">La Ruleta de Incidencias</h1>
          <div className="header-button">
            <button onClick={() => setCurrentView('menu')}>
              Volver al menú
            </button>
          </div>
        </header>
        <main className="content">
          <RuletaIncidencias />
        </main>
      </div>
    );
  }

  return null;
}

export default App;
