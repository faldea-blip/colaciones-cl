// src/pages/Publicar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { dbClient } from '../database/dbClient';
import { compressImage } from '../utils/imageCompressor';
import { Camera, Plus, CheckCircle, List } from 'lucide-react';
import type { Publicacion } from '../database/mockDb';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const Publicar: React.FC = () => {
  const { currentUser, setCurrentUser, userCoords, updateLocation, refreshColaciones } = useApp();
  const navigate = useNavigate();

  // Registration states (if not cocinera)
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('+569');
  const [registering, setRegistering] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [portions, setPortions] = useState<number>(5);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [publishing, setPublishing] = useState(false);

  // Dashboard states
  const [myPubs, setMyPubs] = useState<Publicacion[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill last price used
  useEffect(() => {
    const lastPrice = localStorage.getItem('colaciones_last_price');
    if (lastPrice) {
      setPrice(Number(lastPrice));
    }
  }, []);

  // Fetch cook's publications if user is cocinera
  useEffect(() => {
    if (currentUser && currentUser.rol === 'cocinera') {
      loadMyPublications();
    }
  }, [currentUser]);

  const loadMyPublications = async () => {
    if (!currentUser) return;
    setLoadingPubs(true);
    try {
      const data = await dbClient.obtenerMisPublicaciones(currentUser.id);
      setMyPubs(data);
    } catch (error) {
      console.error('Error loading my publications:', error);
    } finally {
      setLoadingPubs(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || registerPhone.length < 12) {
      alert('Por favor ingresa un nombre y un teléfono válido en formato +569XXXXXXXX.');
      return;
    }

    setRegistering(true);
    try {
      await setCurrentUser({
        id: currentUser?.id || `user-${Date.now()}`,
        nombre: registerName,
        telefono_whatsapp: registerPhone,
        rol: 'cocinera',
        ubicacion: userCoords,
        direccion_referencia: currentUser?.direccion_referencia || 'Ubicación de Cocina'
      });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error(err);
      alert('Error al registrar. Intenta de nuevo.');
    } finally {
      setRegistering(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !portions || !imageFile) {
      alert('Por favor completa los campos obligatorios y toma una foto.');
      return;
    }

    setPublishing(true);
    try {
      // 1. Double check coordinates are tags
      let coords = userCoords;
      if (!coords) {
        await updateLocation();
        coords = userCoords;
      }

      // 2. Compress image file on client side before upload (JPEG, 0.75 quality)
      const compressedBlob = await compressImage(imageFile, 1024, 1024, 0.75);

      // 3. Save publication in Database (Supabase or MockDB)
      await dbClient.crearPublicacion(
        currentUser!.id,
        title,
        description,
        Number(price),
        portions,
        compressedBlob,
        coords
      );

      // 4. Save price to LocalStorage to remember it
      localStorage.setItem('colaciones_last_price', price.toString());

      // 5. Celebration
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#E05A47', '#F5A623']
      });

      // Reset form
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview('');
      
      // Reload listings
      await loadMyPublications();

      // Refresh global feed list
      await refreshColaciones();
      
      alert('¡Tu colación se publicó exitosamente! Los vecinos ya pueden verla.');
      navigate('/');
    } catch (err: any) {
      console.error('Error publishing:', err);
      alert(`Ocurrió un error al publicar: ${err.message || err}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleStatusChange = async (pubId: string, status: 'activa' | 'agotada' | 'expirada') => {
    try {
      await dbClient.cambiarEstadoPublicacion(pubId, status);
      await loadMyPublications();
    } catch (err) {
      console.error('Error changing publication status:', err);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  };

  // Switch role helper for demonstration testing
  const handleSwitchToNeighbor = async () => {
    if (currentUser) {
      await setCurrentUser({
        ...currentUser,
        rol: 'vecino'
      });
      navigate('/');
    }
  };

  // --- RENDER REGISTRATION ---
  if (!currentUser || currentUser.rol !== 'cocinera') {
    return (
      <div className="app-content">
        <h2 className="section-title">¿Quieres publicar comida?</h2>
        <p className="section-desc">
          Únete como vecina cocinera. Registra tu nombre y WhatsApp para que los vecinos te contacten directamente.
        </p>

        <form onSubmit={handleRegister} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Nombre o nombre de tu cocina
            </label>
            <input
              id="register-name"
              type="text"
              required
              placeholder="Ej: Sra. María o Amasandería Gladys"
              className="form-input"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-phone">
              Teléfono de WhatsApp (Formato internacional)
            </label>
            <input
              id="register-phone"
              type="tel"
              required
              placeholder="Ej: +56912345678"
              className="form-input"
              value={registerPhone}
              onChange={(e) => setRegisterPhone(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Es fundamental que esté correcto para que te lleguen las reservas.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={registering}
            style={{ marginTop: '8px' }}
          >
            <CheckCircle size={18} />
            {registering ? 'Registrando...' : 'Registrarme y empezar'}
          </button>
        </form>
      </div>
    );
  }

  // --- RENDER COOK KITCHEN DASHBOARD ---
  return (
    <div className="app-content" style={{ gap: '20px' }}>
      
      {/* Switch role helper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title">Mi Cocina</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Cocinera activa: <strong>{currentUser.nombre}</strong> ({currentUser.telefono_whatsapp})
          </span>
        </div>
        <button
          onClick={handleSwitchToNeighbor}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            padding: '4px 10px',
            fontSize: '11px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 600,
            color: 'var(--text-muted)'
          }}
        >
          Modo Vecino
        </button>
      </div>

      {/* Form Card */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Publicar menú del día
        </h3>

        <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Photo upload / Camera button */}
          <div className="form-group">
            <label className="form-label">Foto del plato *</label>
            <input
              type="file"
              accept="image/*"
              capture="environment" // Forces native camera on mobile
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera size={18} />
                </button>
              </div>
            ) : (
              <div className="camera-input-container" onClick={triggerFileInput}>
                <Camera size={32} className="camera-icon" />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '15px', display: 'block' }}>
                    Toma una foto de tu plato
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Desde tu cámara o archivos
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dish-title">Nombre del plato *</label>
            <input
              id="dish-title"
              type="text"
              required
              maxLength={40}
              placeholder="Ej: Tallarines con salsa Boloñesa"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dish-desc">Descripción (Opcional)</label>
            <textarea
              id="dish-desc"
              rows={2}
              maxLength={150}
              placeholder="Ej: Salsa casera con carne y verduras. Incluye pan."
              className="form-input"
              style={{ resize: 'none', fontFamily: 'inherit' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dish-price">Precio (CLP) *</label>
              <input
                id="dish-price"
                type="number"
                required
                min={0}
                placeholder="Ej: 3500"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dish-portions">Porciones a vender *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', width: 'auto' }}
                  onClick={() => setPortions(p => Math.max(1, p - 1))}
                >
                  -
                </button>
                <span style={{ fontSize: '16px', fontWeight: 700, width: '30px', textAlign: 'center' }}>
                  {portions}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', width: 'auto' }}
                  onClick={() => setPortions(p => Math.min(30, p + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={publishing || !title || !price || !imageFile}
            style={{ marginTop: '6px' }}
          >
            {publishing ? 'Comprimiendo y subiendo...' : 'Publicar plato ahora'}
          </button>
        </form>
      </div>

      {/* Active Listings Dashboard */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <List size={16} /> Mis publicaciones recientes
        </h3>

        {loadingPubs ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando publicaciones...</p>
        ) : myPubs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Aún no has publicado ningún plato hoy.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myPubs.map((pub) => {
              const isExpired = new Date(pub.expira_en).getTime() < Date.now();
              return (
                <div key={pub.id} className="card" style={{ display: 'flex', gap: '12px', padding: '12px' }}>
                  <img
                    src={pub.imagen_url}
                    alt={pub.titulo}
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.2 }}>{pub.titulo}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(pub.precio)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Quedan: <strong>{pub.porciones_disponibles}/{pub.porciones_totales}</strong>
                      </span>
                      
                      {/* State management toggles */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {pub.estado === 'activa' && !isExpired ? (
                          <>
                            <button
                              onClick={() => handleStatusChange(pub.id, 'agotada')}
                              style={{
                                border: 'none',
                                background: 'rgba(245, 166, 35, 0.15)',
                                color: 'var(--accent-hover)',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '3px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Marcar Agotado
                            </button>
                          </>
                        ) : (
                          <span style={{
                            backgroundColor: pub.estado === 'agotada' ? 'rgba(224, 90, 71, 0.1)' : 'rgba(0,0,0,0.05)',
                            color: pub.estado === 'agotada' ? 'var(--primary)' : 'var(--text-muted)',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '3px 6px',
                            borderRadius: '4px'
                          }}>
                            {pub.estado === 'agotada' ? 'AGOTADA' : 'EXPIRADA'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
