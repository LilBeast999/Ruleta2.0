import React, { useState } from 'react';
import logo from './logo.png';
import avatarPlaceholder from './avatar.png';
import config from './config';

function Login({ onLogin }) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerData, setRegisterData] = useState({
    rut: '',
    password: '',
    confirmPassword: '',
    recoveryCode: '',
    name: '',
    lastName: ''
  });
  const [registerError, setRegisterError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!rut || !password) {
      setError('Debes ingresar el RUT y la contraseña');
      return;
    }
    try {
      const response = await fetch(`${config.API_BASE_URL}/login`, {
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

  const validateRegisterData = ({ rut, password, confirmPassword, name, lastName, recoveryCode }) => {
    // validar que todos los campos obligatorios estén presentes
    if (!rut || !password || !confirmPassword || !name || !lastName) {
      return "Todos los campos deben completarse";
    }
    
    if (password.length !== 9) {
      return "La contraseña debe tener exactamente 9 caracteres";
    }
    if (!(/[A-Z]/.test(password))) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    
    if (/\s/.test(name)) {
      return "El nombre debe ser una sola palabra";
    }
    if (/\s/.test(lastName)) {
      return "El apellido debe ser una sola palabra";
    }
    
    if (recoveryCode && recoveryCode.length !== 9) {
      return "El código de recuperación debe tener exactamente 9 caracteres";
    }

    // Validar RUT: debe tener 7 u 8 dígitos seguidos de un guión y un dígito o 'k/K'
    const rutRegex = /^[0-9]{7,8}-[0-9kK]$/;
    if (!rutRegex.test(rut)) {
      return "El RUT debe estar en formato xxxxxxxx-x, donde x son dígitos y el último es un dígito o 'k/K'";
    }
    return null;
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setRegisterError('');
    
    const { rut, password, confirmPassword, recoveryCode, name, lastName } = registerData;
    
    const errorMsg = validateRegisterData({ rut, password, confirmPassword, name, lastName, recoveryCode });
    if (errorMsg) {
      setRegisterError(errorMsg);
      return;
    }
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut,
          password,
          nombre: name,
          apellido: lastName,
          codigo_recuperacion: recoveryCode
        })
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterError('Registro exitoso. Por favor, inicia sesión.');
        setIsModalOpen(false);  
        window.location.reload();
      } else {
        setRegisterError(data.error || 'Error durante el registro');
      }
    } catch (err) {
      setRegisterError('Error al conectarse con el servidor');
    }
  };

  const handleRegisterChange = e => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
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
          style={{ height: 80, marginRight: -60 }}  
        />
        <h1 style={{
          flex:1,
          margin:0,
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
            style={{ width: '110%', height: '110%' }} 
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
              onClick={() => setIsModalOpen(true)}
              style={{
                flex: 1,
                padding: '10px',
                marginRight: '10px',
                backgroundColor: '#bbb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
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

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: 400,
            maxWidth: '90%',
            margin: '0 auto',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ textAlign: 'center' }}>Registro</h2>
            {registerError && <p style={{ color: 'red', textAlign: 'center' }}>{registerError}</p>}
            <form onSubmit={handleRegisterSubmit}>
              <label htmlFor="registerRut" style={{ display: 'block', fontWeight: 'bold' }}>RUT</label>
              <input
                id="registerRut"
                name="rut"
                type="text"
                placeholder="Ingresa tu RUT"
                value={registerData.rut}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <label htmlFor="registerPassword" style={{ display: 'block', fontWeight: 'bold' }}>Contraseña</label>
              <input
                id="registerPassword"
                name="password"
                type="password"
                placeholder="Contraseña"
                value={registerData.password}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <label htmlFor="confirmPassword" style={{ display: 'block', fontWeight: 'bold' }}>Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <label htmlFor="recoveryCode" style={{ display: 'block', fontWeight: 'bold' }}>Código de Recuperación</label>
              <input
                id="recoveryCode"
                name="recoveryCode"
                type="text"
                placeholder="Importante: algún patrón que recuerdes"
                value={registerData.recoveryCode}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <label htmlFor="name" style={{ display: 'block', fontWeight: 'bold' }}>Nombre</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ingresa tu nombre"
                value={registerData.name}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <label htmlFor="lastName" style={{ display: 'block', fontWeight: 'bold' }}>Apellido</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Ingresa tu apellido"
                value={registerData.lastName}
                onChange={handleRegisterChange}
                style={{
                  width: '95%',
                  padding: '6px',
                  margin: '4px 0 12px',
                  borderRadius: '3px',
                  border: '1px solid #ccc'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    marginRight: '10px',
                    backgroundColor: '#bbb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
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
                  Registrarse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
