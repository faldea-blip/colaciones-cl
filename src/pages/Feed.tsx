// src/pages/Feed.tsx
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GPSBanner } from '../components/GPSBanner';
import { MealCard } from '../components/MealCard';
import type { ColacionCercana } from '../database/mockDb';
import { Utensils, Bell } from 'lucide-react';

export const Feed: React.FC = () => {
  const { colaciones, loadingColaciones, refreshColaciones, triggerTipSimulated, isDemoMode } = useApp();
  const [localMeals, setLocalMeals] = useState<ColacionCercana[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'close'>('all'); // close = < 500m (5 min walk)

  // Sync global context meals with local state for immediate optimistic updates
  useEffect(() => {
    setLocalMeals(colaciones);
  }, [colaciones]);

  const handleReserveSuccess = (mealId: string) => {
    setLocalMeals((prevMeals) =>
      prevMeals
        .map((m) => {
          if (m.id === mealId) {
            const nextDisponibles = m.porciones_disponibles - 1;
            return {
              ...m,
              porciones_disponibles: nextDisponibles,
            };
          }
          return m;
        })
        .filter((m) => m.porciones_disponibles > 0) // Hide immediately if sold out
    );
  };

  const filteredMeals = localMeals.filter((m) => {
    if (activeFilter === 'close') {
      return m.distancia_metros <= 500;
    }
    return true;
  });

  return (
    <div className="app-content" style={{ gap: '16px' }}>
      
      {/* GPS Proximity Tracker */}
      <GPSBanner />

      {/* Demo helper banner */}
      {isDemoMode && (
        <div style={{
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          border: '1px solid rgba(76, 175, 80, 0.15)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: '13px',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span>Panel de Simulación (Modo Demo)</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.3' }}>
            Puedes testear el modal de aportes que reciben los vecinos después de almorzar (14:15 hrs) usando el siguiente botón de depuración:
          </p>
          <button
            onClick={triggerTipSimulated}
            className="btn btn-accent"
            style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', alignSelf: 'flex-start', borderRadius: 'var(--radius-sm)' }}
          >
            <Bell size={13} />
            Simular Notificación Post-Almuerzo
          </button>
        </div>
      )}

      {/* Feed Filters */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => setActiveFilter('all')}
          className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', width: 'auto', borderRadius: '30px' }}
        >
          Todo el radio
        </button>
        <button
          onClick={() => setActiveFilter('close')}
          className={`btn ${activeFilter === 'close' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', width: 'auto', borderRadius: '30px' }}
        >
          🚶 Menos de 5 min (500m)
        </button>
      </div>

      {/* Feed Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 className="section-title">Colaciones de hoy</h2>
        
        {loadingColaciones ? (
          // Skeleton loader
          [1, 2].map((i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundColor: 'var(--border)', width: '100%' }} className="skeleton" />
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '20px', backgroundColor: 'var(--border)', width: '60%', borderRadius: '4px' }} className="skeleton" />
                <div style={{ height: '14px', backgroundColor: 'var(--border)', width: '90%', borderRadius: '4px' }} className="skeleton" />
                <div style={{ height: '14px', backgroundColor: 'var(--border)', width: '40%', borderRadius: '4px' }} className="skeleton" />
              </div>
            </div>
          ))
        ) : filteredMeals.length === 0 ? (
          // Empty State
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Utensils size={48} style={{ color: 'var(--border)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>No hay colaciones activas</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.4' }}>
              No encontramos platos disponibles en este momento. Intenta ampliar el radio de búsqueda o cambiar tu ubicación.
            </p>
            <button 
              onClick={refreshColaciones} 
              className="btn btn-secondary" 
              style={{ width: 'auto', fontSize: '13px', padding: '8px 16px', marginTop: '8px' }}
            >
              Actualizar Feed
            </button>
          </div>
        ) : (
          filteredMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onReserveSuccess={handleReserveSuccess}
            />
          ))
        )}
      </div>

      {/* Legal Footer Disclaimer */}
      <footer className="legal-footer">
        <strong>Aviso Comunitario Importante:</strong><br />
        colaciones.cl es un directorio de anuncios comunitarios operado por <strong>aldeaUno</strong>. 
        La plataforma no elabora, fiscaliza, comercializa ni distribuye alimentos, ni procesa pagos por los mismos. 
        La relación transaccional se realiza exclusivamente de forma directa entre particulares.
      </footer>

      {/* Simple skeleton animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .skeleton {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
