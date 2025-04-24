import React, { useState } from 'react';
import logo from './logo.png';
import avatarPlaceholder from './avatar.png';

function Login({ onLogin }) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!rut || !password) {
      setError('Debes ingresar el RUT y la contraseña');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rut, password })
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(rut);
      } else {
        setError(data.error || 'Error de autenticación');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f2f2f2'
    }}>
      {/* 1. HEADER */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <img 
          src={logo} 
          alt="Talca" 
          style={{ height: 80, marginRight: 10 }}  
        />
        <h1 style={{
          flex: 1,
          margin: 0,
          textAlign: 'center',
          fontSize: '2.5rem',
          fontFamily: 'Arial Black, Gadget, sans-serif'
        }}>
          Ruleta de Incidencias
        </h1>  
      </header>

      {/* 2. CONTENEDOR CENTRAL */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Avatar */}
        <div style={{
          width: 150,     
          height: 150,
          borderRadius: '50%',
          border: '8px solid #333',
          overflow: 'hidden',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff'
        }}>
          <img 
            src={avatarPlaceholder} 
            alt="avatar" 
            style={{ width: '80%', height: '80%' }} 
          />
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: 320,
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {/* Mostrar mensaje de error */}
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          {/* RUT */}
          <label htmlFor="rut" style={{ display: 'block', fontWeight: 'bold' }}>RUT</label>
          <input
            id="rut"
            type="text"
            placeholder="Ingresa tu RUT"
            value={rut}
            onChange={e => setRut(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              margin: '6px 0 16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />

          {/* CONTRASEÑA */}
          <label htmlFor="password" style={{ display: 'block', fontWeight: 'bold' }}>Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              margin: '6px 0 24px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />

          {/* BOTONES */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              disabled
              style={{
                flex: 1,
                padding: '10px',
                marginRight: '10px',
                backgroundColor: '#bbb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'not-allowed'
              }}
            >
              Registrarse
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#d50000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
