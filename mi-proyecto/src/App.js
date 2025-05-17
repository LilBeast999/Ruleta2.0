// src/App.js
import React, { useState } from 'react';
import Ruleta from './Ruleta';
import Menu from './menuComponent/Menu';
import Historial from './historialComponent/historial';
import Navbar from './NavbarComponent/navbar';
import './App.css';

function App() {
  const defaultInput = ['Titulo1', 'Titulo2', 'Titulo3', 'Titulo4'].join('\n');
  const [rawInput, setRawInput] = useState(defaultInput);
  const [currentView, setCurrentView] = useState('menu');

  const titulos = rawInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  let title = "";
  if (currentView === 'menu') {
    title = "Ruleta de Incidencias";
  } else if (currentView === 'ruleta') {
    title = "La Ruleta de Incidencias";
  } else if (currentView === 'historial') {
    title = "Historial de Sorteos";
  }

  return (
    <div className="App">
      {/* Se muestra la Navbar en todas las vistas */}
      <Navbar 
        title={title} 
        onBack={currentView !== 'menu' ? () => setCurrentView('menu') : null}
      />

      {/* Renderizado variable según la vista */}
      {currentView === 'menu' && (
        <Menu 
          onCreateRuleta={() => setCurrentView('ruleta')}
          onHistorial={() => setCurrentView('historial')}
        />
      )}

      {currentView === 'ruleta' && (
        <main className="content">
          <section className="ruleta-section">
            <Ruleta titulos={titulos} />
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
      )}

      {currentView === 'historial' && (
        <Historial onBackToMenu={() => setCurrentView('menu')} />
      )}
    </div>
  );
}

export default App;
