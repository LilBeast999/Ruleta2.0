// src/Menu.js
import React from 'react';

export default function Menu({ onCreateRuleta }) {
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '40px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #ccc',
      padding: '10px 30px',
    },
    logo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      fontWeight: 'bold',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userName: {
      fontSize: '14px',
    },
    userIcon: {
      width: '32px',
      height: '32px',
      backgroundColor: '#000',
      borderRadius: '50%',
      display: 'inline-block',
    },
    buttonContainer: {
      marginTop: '50px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      alignItems: 'center',
    },
    button: {
      backgroundColor: '#c00',
      color: '#fff',
      border: 'none',
      padding: '15px 30px',
      fontSize: '16px',
      borderRadius: '5px',
      cursor: 'pointer',
      width: '250px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <div>TALCA</div>
          <div style={{ fontSize: '12px' }}>UNIVERSIDAD DE CHILE</div>
        </div>
        <div style={styles.title}>Ruleta de Incidencias</div>
        <div style={styles.userSection}>
          <span style={styles.userName}>Lsilvester</span>
          <span style={styles.userIcon}></span>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={onCreateRuleta}>Crear Ruleta Estándar</button>
        <button style={styles.button}>Girar Ruleta</button>
        <button style={styles.button}>Subir Excel de datos</button>
        <button style={styles.button}>Historial de Ruletas</button>
      </div>
    </div>
  );
}
