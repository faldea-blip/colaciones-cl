// src/components/TipJarModal.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { dbClient } from '../database/dbClient';
import { Heart, X, Coffee, CupSoda, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TipJarModal: React.FC = () => {
  const { pendingTipReservation, setPendingTipReservation } = useApp();
  const [selectedTip, setSelectedTip] = useState<number>(500);
  const navigate = useNavigate();

  if (!pendingTipReservation) return null;

  const handleClose = async () => {
    // Register that the tip request was shown/handled for this reservation
    try {
      if (pendingTipReservation.id && !pendingTipReservation.id.startsWith('simulation-')) {
        await dbClient.registrarAporteSolicitado(pendingTipReservation.id);
      }
    } catch (err) {
      console.warn('Error saving interaction update:', err);
    }
    setPendingTipReservation(null);
  };

  const handleContribute = async () => {
    // Navigate to Aportes page with the selected amount
    navigate('/aportar', { state: { amount: selectedTip } });
    await handleClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🍽️</span>
            <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              ¿Qué tal estuvo el almuerzo?
            </h3>
          </div>
          <button 
            onClick={handleClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Esperamos que hayas disfrutado tu <strong>{pendingTipReservation.titulo}</strong> de{' '}
          <strong>{pendingTipReservation.nombre_cocinera}</strong>.
        </p>

        <div style={{
          backgroundColor: 'rgba(224, 90, 71, 0.05)',
          border: '1px solid rgba(224, 90, 71, 0.1)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center'
        }}>
          <Heart 
            size={36} 
            className="pulse-heart" 
            style={{ color: 'var(--primary)', fill: 'var(--primary)', filter: 'drop-shadow(0 2px 8px rgba(224,90,71,0.3))' }} 
          />
          <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Aporte Voluntario a aldeaUno</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            En <strong>colaciones.cl</strong> no le cobramos comisión a las cocineras vecinas. Si te sirvió la app hoy, apóyanos para mantener los servidores activos.
          </p>
        </div>

        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Selecciona tu aporte:
          </span>
          <div className="tips-grid">
            <button
              type="button"
              className={`tip-option ${selectedTip === 300 ? 'selected' : ''}`}
              onClick={() => setSelectedTip(300)}
            >
              <Coffee size={18} style={{ margin: '0 auto 4px auto', display: 'block' }} />
              $300
              <span style={{ fontSize: '9px', fontWeight: 400, display: 'block', color: 'var(--text-muted)' }}>
                Té/Café
              </span>
            </button>
            <button
              type="button"
              className={`tip-option ${selectedTip === 500 ? 'selected' : ''}`}
              onClick={() => setSelectedTip(500)}
            >
              <CupSoda size={18} style={{ margin: '0 auto 4px auto', display: 'block' }} />
              $500
              <span style={{ fontSize: '9px', fontWeight: 400, display: 'block', color: 'var(--text-muted)' }}>
                Bebida
              </span>
            </button>
            <button
              type="button"
              className={`tip-option ${selectedTip === 1000 ? 'selected' : ''}`}
              onClick={() => setSelectedTip(1000)}
            >
              <Smile size={18} style={{ margin: '0 auto 4px auto', display: 'block' }} />
              $1.000
              <span style={{ fontSize: '9px', fontWeight: 400, display: 'block', color: 'var(--text-muted)' }}>
                Harto Cariño
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <button 
            onClick={handleContribute}
            className="btn btn-primary"
          >
            Aportar {selectedTip ? `$${selectedTip}` : ''}
          </button>
          <button 
            onClick={handleClose} 
            className="btn btn-secondary"
            style={{ fontSize: '14px', padding: '10px' }}
          >
            Tal vez más tarde
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .pulse-heart {
            animation: pulse 1.8s infinite ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
};
