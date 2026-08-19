// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Feed } from './pages/Feed';
import { Publicar } from './pages/Publicar';
import { Aportes } from './pages/Aportes';
import { BottomNav } from './components/BottomNav';
import { TipJarModal } from './components/TipJarModal';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="app-layout">
          
          {/* Sticky Global Top Bar */}
          <header className="app-header">
            <div className="app-brand">
              <span className="app-logo">🍳</span>
              <div>
                <h1 className="app-title">colaciones.cl</h1>
                <span className="app-subtitle">Barrio Conectado</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                backgroundColor: 'rgba(224, 90, 71, 0.1)',
                color: 'var(--primary)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                letterSpacing: '0.3px'
              }}>
                aldeaUno
              </span>
            </div>
          </header>

          {/* Page Routing Views */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/publicar" element={<Publicar />} />
              <Route path="/aportar" element={<Aportes />} />
            </Routes>
          </main>

          {/* Mobile bottom navigation */}
          <BottomNav />

          {/* Post-reservation Tip Drawer */}
          <TipJarModal />
          
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
