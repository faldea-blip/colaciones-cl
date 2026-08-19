// src/components/GPSBanner.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { Coordinates } from '../utils/geolocation';

const PRESETS = [
  { name: '📍 Metro Dorsal (Conchalí Centro)', latitude: -33.3989, longitude: -70.6738 },
  { name: '🏢 Municipalidad (Plaza Conchalí)', latitude: -33.3858, longitude: -70.6778 },
  { name: '🚇 Metro Vivaceta (Sector Poniente)', latitude: -33.4079, longitude: -70.6865 },
  { name: '🚇 Metro Conchalí (Sector Central)', latitude: -33.3932, longitude: -70.6801 }
];

export const GPSBanner: React.FC = () => {
  const { userCoords, locationStatus, addressReference, updateLocation, searchRadius, setSearchRadius } = useApp();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAddress, setCustomAddress] = useState(addressReference);
  const [updating, setUpdating] = useState(false);

  const handleRefresh = async () => {
    setUpdating(true);
    await updateLocation();
    setUpdating(false);
  };

  const handlePresetSelect = async (preset: typeof PRESETS[0]) => {
    setUpdating(true);
    const coords: Coordinates = {
      latitude: preset.latitude,
      longitude: preset.longitude
    };
    await updateLocation(coords, preset.name.replace('📍 ', '').replace('🏢 ', '').replace('🚇 ', ''));
    setCustomAddress(preset.name.replace('📍 ', '').replace('🏢 ', '').replace('🚇 ', ''));
    setUpdating(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAddress.trim()) {
      // Keep current coordinates but tag with the new text reference
      updateLocation(userCoords, customAddress);
    }
  };

  return (
    <div className="gps-banner">
      <div className="gps-info">
        <div className="gps-status">
          <MapPin size={18} className="text-primary" style={{ color: 'var(--primary)' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
              TU UBICACIÓN
            </span>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              {addressReference || 'Buscando coordenadas...'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleRefresh} 
          disabled={updating || locationStatus === 'loading'}
          className="gps-refresh"
        >
          <RefreshCw size={15} className={updating ? 'spin' : ''} />
          {updating ? 'Buscando...' : 'GPS'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Radio de búsqueda: <strong>{(searchRadius / 1000).toFixed(1)} km</strong> ({Math.round(searchRadius / 80)} min a pie)
        </span>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)} 
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}
        >
          {showAdvanced ? (
            <>Ocultar <ChevronUp size={14} /></>
          ) : (
            <>Cambiar <ChevronDown size={14} /></>
          )}
        </button>
      </div>

      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          
          {/* Slider for search radius */}
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Distancia caminata</span>
              <span>{searchRadius} metros</span>
            </label>
            <input 
              type="range" 
              min="500" 
              max="5000" 
              step="500"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Quick presets */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Simular punto en Conchalí:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-app)',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    fontWeight: 500,
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text input to change reference label */}
          <form onSubmit={handleManualSubmit} className="gps-address-fallback">
            <input
              type="text"
              placeholder="Ingresa esquina o punto de referencia..."
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="gps-address-input"
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
            >
              Fijar
            </button>
          </form>
        </div>
      )}

      {/* Animation rotation stylesheet logic */}
      <style>{`
        @keyframes rotate-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: rotate-spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
