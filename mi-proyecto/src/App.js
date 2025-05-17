import React, { useState } from 'react';
import Ruleta from './Ruleta';
import Menu from './menuComponent/Menu';
import Historial from './historialComponent/historial';
import Navbar from './NavbarComponent/navbar';
import RuletaIncidencias from './RuletaIncidencias';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('menu');


  let title = '';
  if (currentView === 'menu') {
    title = 'Ruleta de Incidencias';
  } else if (currentView === 'ruletaEstandar') {
    title = 'Ruleta Estándar';
  } else if (currentView === 'ruletaIncidencias') {
    title = 'Girar Ruleta de Incidencias';
  } else if (currentView === 'historial') {
    title = 'Historial de Sorteos';
  }

  return (
    <div className="App">
      <Navbar
        title={title}
        onBack={currentView !== 'menu' ? () => setCurrentView('menu') : null}
      />

      {currentView === 'menu' && (
        <Menu
          onCreateRuleta={() => setCurrentView('ruletaEstandar')}
          onGirarRuleta={() => setCurrentView('ruletaIncidencias')}
          onHistorial={() => setCurrentView('historial')}
        />
      )}

      {currentView === 'ruletaEstandar' && (
        <main className="content">
          <Ruleta defaultTitulos={['Titulo1', 'Titulo2', 'Titulo3', 'Titulo4']} />
        </main>
      )}

      {currentView === 'ruletaIncidencias' && (
        <main className="content">
          <RuletaIncidencias />
        </main>
      )}

      {currentView === 'historial' && (
        <Historial onBackToMenu={() => setCurrentView('menu')} />
      )}
    </div>
  );
}

export default App;
