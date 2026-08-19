// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbClient, IS_DEMO_MODE } from '../database/dbClient';
import { getBrowserLocation, FALLBACK_COORDINATES } from '../utils/geolocation';
import type { Coordinates } from '../utils/geolocation';
import type { Usuario, ColacionCercana } from '../database/mockDb';

interface AppContextProps {
  currentUser: Usuario | null;
  setCurrentUser: (user: Omit<Usuario, 'creado_en'>) => Promise<Usuario>;
  userCoords: Coordinates;
  locationStatus: 'loading' | 'success' | 'error';
  addressReference: string;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  colaciones: ColacionCercana[];
  loadingColaciones: boolean;
  refreshColaciones: () => Promise<void>;
  updateLocation: (coords?: Coordinates, reference?: string) => Promise<void>;
  pendingTipReservation: { id: string; titulo: string; nombre_cocinera: string } | null;
  setPendingTipReservation: (val: { id: string; titulo: string; nombre_cocinera: string } | null) => void;
  triggerTipSimulated: () => void;
  isDemoMode: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<Usuario | null>(null);
  const [userCoords, setUserCoords] = useState<Coordinates>(FALLBACK_COORDINATES);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [addressReference, setAddressReference] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(1500); // 1.5 km walk distance
  const [colaciones, setColaciones] = useState<ColacionCercana[]>([]);
  const [loadingColaciones, setLoadingColaciones] = useState<boolean>(true);
  const [pendingTipReservation, setPendingTipReservation] = useState<{ id: string; titulo: string; nombre_cocinera: string } | null>(null);

  // Initialize user profile
  useEffect(() => {
    const initUser = async () => {
      let savedUserId = localStorage.getItem('colaciones_curr_user_id');
      if (!savedUserId) {
        // Fallback to default neighbor in demo mode
        savedUserId = 'vecino-default';
        localStorage.setItem('colaciones_curr_user_id', savedUserId);
      }

      try {
        let user = await dbClient.getUsuario(savedUserId);
        if (!user && IS_DEMO_MODE) {
          // Double check or seed user
          user = await dbClient.guardarUsuario({
            id: 'vecino-default',
            nombre: 'Juan Pablo',
            telefono_whatsapp: '+56911112222',
            rol: 'vecino',
            ubicacion: FALLBACK_COORDINATES,
            direccion_referencia: 'Metro Dorsal'
          });
        }
        if (user) {
          setCurrentUserState(user);
          if (user.ubicacion) {
            setUserCoords(user.ubicacion);
            setLocationStatus('success');
            if (user.direccion_referencia) {
              setAddressReference(user.direccion_referencia);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };

    initUser();
  }, []);

  // Fetch coordinates on start if user doesn't have custom ones
  useEffect(() => {
    const fetchGeo = async () => {
      setLocationStatus('loading');
      const coords = await getBrowserLocation();
      setUserCoords(coords);
      setLocationStatus('success');
      
      // Attempt to set reference if coords match fallback
      if (coords.latitude === FALLBACK_COORDINATES.latitude && coords.longitude === FALLBACK_COORDINATES.longitude) {
        setAddressReference('Conchalí (Centro)');
      } else {
        setAddressReference('Ubicación GPS Actual');
      }
    };
    
    // Only auto-locate if we don't have custom coordinates loaded from user profile
    if (locationStatus === 'loading') {
      fetchGeo();
    }
  }, []);

  // Refresh feed whenever coords or radius changes
  useEffect(() => {
    refreshColaciones();
  }, [userCoords, searchRadius]);

  const refreshColaciones = async () => {
    setLoadingColaciones(true);
    try {
      const data = await dbClient.obtenerColacionesCercanas(
        userCoords.latitude,
        userCoords.longitude,
        searchRadius
      );
      setColaciones(data);
    } catch (error) {
      console.error('Error loading near colaciones:', error);
    } finally {
      setLoadingColaciones(false);
    }
  };

  const updateLocation = async (coords?: Coordinates, reference?: string) => {
    let finalCoords = coords;
    
    if (!finalCoords) {
      setLocationStatus('loading');
      finalCoords = await getBrowserLocation();
    }

    setUserCoords(finalCoords);
    setLocationStatus('success');
    if (reference) {
      setAddressReference(reference);
    } else {
      setAddressReference(
        finalCoords.latitude === FALLBACK_COORDINATES.latitude && finalCoords.longitude === FALLBACK_COORDINATES.longitude
          ? 'Conchalí (Centro)'
          : 'Ubicación GPS Actual'
      );
    }

    // Save location to user profile if user is logged in
    if (currentUser) {
      try {
        const updatedUser = await dbClient.guardarUsuario({
          ...currentUser,
          ubicacion: finalCoords,
          direccion_referencia: reference || addressReference
        });
        setCurrentUserState(updatedUser);
      } catch (err) {
        console.error('Error updating user location in DB:', err);
      }
    }
  };

  const setCurrentUser = async (user: Omit<Usuario, 'creado_en'>): Promise<Usuario> => {
    const saved = await dbClient.guardarUsuario(user);
    setCurrentUserState(saved);
    localStorage.setItem('colaciones_curr_user_id', saved.id);
    if (saved.ubicacion) {
      setUserCoords(saved.ubicacion);
      if (saved.direccion_referencia) {
        setAddressReference(saved.direccion_referencia);
      }
    }
    return saved;
  };

  // Simulates a notification trigger after meal reservation
  const triggerTipSimulated = () => {
    // Look up if we reserved anything in this session, otherwise choose GLADYS
    setPendingTipReservation({
      id: 'simulation-id',
      titulo: 'Cazuela de Vacuno',
      nombre_cocinera: 'Señora Gladys'
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        userCoords,
        locationStatus,
        addressReference,
        searchRadius,
        setSearchRadius,
        colaciones,
        loadingColaciones,
        refreshColaciones,
        updateLocation,
        pendingTipReservation,
        setPendingTipReservation,
        triggerTipSimulated,
        isDemoMode: IS_DEMO_MODE,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
