import React, { useState } from 'react';
import Ruleta from './Ruleta';
import Menu from './menuComponent/Menu';
import Historial from './historialComponent/historial';
import Navbar from './NavbarComponent/navbar';
import Footer from './FooterComponent/footer';
import RuletaIncidencias from './RuletaIncidencias';
import CRUD from './CRUDcomponent/crud';
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
  } else if (currentView === 'crud') {
    title = 'Administración de Datos';
  }

  return (
    <div className="App">
      <Navbar
        title={title}
        onBack={currentView !== 'menu' ? () => setCurrentView('menu') : null}
      />

      {/* Contenido principal */}
      {currentView === 'menu' && (
        <Menu
          onCreateRuleta={() => setCurrentView('ruletaEstandar')}
          onGirarRuleta={() => setCurrentView('ruletaIncidencias')}
          onHistorial={() => setCurrentView('historial')}
          onCRUD={() => setCurrentView('crud')}
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

      {currentView === 'crud' && (
        <CRUD />
      )}

      {/* Footer que aparece en todas las vistas */}
      <Footer />
    </div>
  );
}

export default App;
