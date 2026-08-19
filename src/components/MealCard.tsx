// src/components/MealCard.tsx
import React, { useState } from 'react';
import type { ColacionCercana } from '../database/mockDb';
import { calculateWalkTime } from '../utils/geolocation';
import { dbClient } from '../database/dbClient';
import { useApp } from '../context/AppContext';
import { MessageSquare, Flame, Navigation, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MealCardProps {
  meal: ColacionCercana;
  onReserveSuccess: (mealId: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onReserveSuccess }) => {
  const { currentUser, setPendingTipReservation } = useApp();
  const [loading, setLoading] = useState(false);

  const formatCLP = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleReserve = async () => {
    setLoading(true);
    try {
      // 1. Trigger stock reduction & insert reservation transaction
      const response = await dbClient.reservarPorcion(meal.id, currentUser?.id || null);

      if (response.success) {
        // 2. Fire high-quality UI confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#E05A47', '#F5A623', '#4CAF50']
        });

        // 3. Register reservation for the post-lunch prompt simulation
        setPendingTipReservation({
          id: response.interaccionId || `sim-${Date.now()}`,
          titulo: meal.titulo,
          nombre_cocinera: meal.nombre_cocinera
        });

        // 4. Update the list view state optimistically in the parent component
        onReserveSuccess(meal.id);

        // 5. Construct WhatsApp message and redirect after short delay (for visual feedback)
        setTimeout(() => {
          const rawText = `Hola ${meal.nombre_cocinera}, vi tu "${meal.titulo}" en colaciones.cl y quiero reservar 1 porción!`;
          const whatsappUrl = `https://wa.me/${meal.telefono_whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(rawText)}`;
          window.open(whatsappUrl, '_blank');
        }, 1200);
      } else {
        alert('Lo sentimos, ¡esta colación se acaba de agotar!');
      }
    } catch (err) {
      console.error('Error during reservation:', err);
      alert('Hubo un error al reservar. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const walkTime = calculateWalkTime(meal.distancia_metros);

  return (
    <article className="meal-card">
      <div className="meal-image-container">
        <img
          src={meal.imagen_url}
          alt={meal.titulo}
          className="meal-image"
          loading="lazy"
        />
        <div className="meal-price-badge">
          {formatCLP(meal.precio)}
        </div>
      </div>

      <div className="meal-card-content">
        <div className="meal-header-row">
          <h3 className="meal-title">{meal.titulo}</h3>
        </div>

        <p className="meal-desc">
          {meal.descripcion || 'Sin descripción disponible. ¡Comida casera hecha con amor!'}
        </p>

        <div className="meal-meta-row">
          {/* Distance Indicator */}
          <span className="distance-badge">
            <Navigation size={12} />
            a {meal.distancia_metros < 1000 ? `${meal.distancia_metros}m` : `${(meal.distancia_metros / 1000).toFixed(1)}km`}
          </span>

          {/* Estimated walk time */}
          <span className="distance-badge" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#1976D2' }}>
            <Clock size={12} />
            {walkTime} min a pie
          </span>

          {/* Portion stock status */}
          <span className={`stock-badge ${meal.porciones_disponibles <= 3 ? 'low' : 'high'}`}>
            <Flame size={12} />
            {meal.porciones_disponibles <= 3 
              ? `Últimas ${meal.porciones_disponibles} porciones!` 
              : `Quedan ${meal.porciones_disponibles} porciones`}
          </span>
        </div>

        {/* Cook info */}
        <div className="meal-cook-info" style={{ marginTop: '6px' }}>
          <span>Por: <strong>{meal.nombre_cocinera}</strong></span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleReserve}
          disabled={loading || meal.porciones_disponibles <= 0}
          className="btn btn-primary meal-reserve-btn"
        >
          <MessageSquare size={18} />
          {loading ? 'Reservando...' : 'RESERVAR POR WHATSAPP'}
        </button>
      </div>
    </article>
  );
};
