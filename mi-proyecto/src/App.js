// src/App.js
import React, { useState } from 'react';
import Ruleta from './Ruleta';
import Login from './Login';
import './App.css';
import logo from './logo.svg';

function App() {
  // Estado para el login
  const [user, setUser] = useState(null);

  // Estado “crudo”: el contenido del textarea
  const defaultInput = ['Titulo1', 'Titulo2', 'Titulo3', 'Titulo4'].join('\n');
  const [rawInput, setRawInput] = useState(defaultInput);

  // Derivamos el array de títulos a partir de las líneas no vacías
  const titulos = rawInput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  // Si el usuario no está autenticado, mostramos el Login
  if (!user) {
    return <Login onLogin={setUser} />;
  }

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
