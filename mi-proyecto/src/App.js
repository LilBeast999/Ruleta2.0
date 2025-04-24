// src/App.js
import React, { useState } from 'react';
import Ruleta from './Ruleta';
import './App.css';
import logo from './logo.svg';

function App() {
  // Estado “crudo”: el contenido del textarea
  const defaultInput = ['Titulo1','Titulo2','Titulo3','Titulo4'].join('\n');
  const [rawInput, setRawInput] = useState(defaultInput);

  // Derivamos el array de títulos a partir de las líneas no vacías
  const titulos = rawInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  return (
    <div className="App">
      {/* CABECERA */}
      <header className="header">
        <div className="header-logo">
          <img src={logo} alt="Logo Universidad" />
        </div>
        <h1 className="header-title">La Ruleta de Incidencias</h1>
        <div className="header-button">
          <button>Volver al menú</button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="content">
        <section className="ruleta-section">
          <Ruleta titulos={titulos} />
        </section>

        <section className="titulos-section">
          <h2>Títulos para la Ruleta</h2>

          {/* Aquí el textarea en vez de un <ul> */}
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

export default App;
