import React, { useState } from 'react';
import Ruleta from './Ruleta';
import './App.css';

function App() {
  const defaultTitulos = 'Título 1, Título 2, Título 3, Título 4, Título 5';
  const [input, setInput] = useState(defaultTitulos);
  const titulos = input.split(',').map(t => t.trim()).filter(t => t !== '');

  return (
    <div className="App">
      <header
        className="App-header"
        style={{
          padding: '20px',
          backgroundColor: '#282c34',
          minHeight: '100vh',
          color: '#fff'
        }}
      >
        <h1 style={{ marginBottom: '20px' }}>Ruleta Aleatoria</h1>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="titulos" style={{ marginRight: '10px' }}>
            Titulos (separados por comas):
          </label>
          <input
            type="text"
            id="titulos"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              padding: '8px',
              width: '60%',
              borderRadius: '5px',
              border: 'none'
            }}
          />
        </div>
        <Ruleta titulos={titulos} />
      </header>
    </div>
  );
}

export default App;