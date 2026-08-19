// src/database/mockDb.ts
import { calculateDistance } from '../utils/geolocation';

export interface Usuario {
  id: string;
  nombre: string;
  telefono_whatsapp: string;
  rol: 'cocinera' | 'vecino';
  ubicacion: { latitude: number; longitude: number } | null;
  direccion_referencia?: string;
  creado_en: string;
}

export interface Publicacion {
  id: string;
  cocinera_id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  porciones_totales: number;
  porciones_disponibles: number;
  imagen_url: string;
  ubicacion: { latitude: number; longitude: number };
  estado: 'activa' | 'agotada' | 'expirada';
  creado_en: string;
  expira_en: string;
}

export interface InteraccionReserva {
  id: string;
  publicacion_id: string;
  vecino_id: string | null;
  porciones_pedidas: number;
  creado_en: string;
  solicitado_aporte: boolean;
}

export interface ColacionCercana {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  porciones_disponibles: number;
  porciones_totales: number;
  imagen_url: string;
  nombre_cocinera: string;
  telefono_whatsapp: string;
  distancia_metros: number;
  ubicacion: { latitude: number; longitude: number };
}

// Key names for LocalStorage
const KEYS = {
  USUARIOS: 'colaciones_usuarios',
  PUBLICACIONES: 'colaciones_publicaciones',
  INTERACCIONES: 'colaciones_interacciones',
};

// Seed Data
const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'cocinera-1',
    nombre: 'Señora Gladys',
    telefono_whatsapp: '+56987654321',
    rol: 'cocinera',
    ubicacion: { latitude: -33.3980, longitude: -70.6720 }, // 150m from Metro Dorsal
    direccion_referencia: 'Pasaje Las Gardenias 1420, Conchalí',
    creado_en: new Date().toISOString(),
  },
  {
    id: 'cocinera-2',
    nombre: 'Tía Juanita',
    telefono_whatsapp: '+56999887766',
    rol: 'cocinera',
    ubicacion: { latitude: -33.4010, longitude: -70.6750 }, // 300m southwest
    direccion_referencia: 'Av. Diego Silva 940, Conchalí',
    creado_en: new Date().toISOString(),
  },
  {
    id: 'cocinera-3',
    nombre: 'Don Pedro',
    telefono_whatsapp: '+56955554444',
    rol: 'cocinera',
    ubicacion: { latitude: -33.3920, longitude: -70.6800 }, // ~1km away
    direccion_referencia: 'Barrio Monterrey, Conchalí',
    creado_en: new Date().toISOString(),
  },
  {
    id: 'vecino-default',
    nombre: 'Juan Pablo',
    telefono_whatsapp: '+56911112222',
    rol: 'vecino',
    ubicacion: { latitude: -33.3989, longitude: -70.6738 }, // At Metro Dorsal
    direccion_referencia: 'Metro Dorsal',
    creado_en: new Date().toISOString(),
  }
];

const MOCK_PUBLICACIONES: Publicacion[] = [
  {
    id: 'pub-1',
    cocinera_id: 'cocinera-1',
    titulo: 'Cazuela de Vacuno Casera',
    descripcion: 'Cazuela calientita con choclo, zapallo y harto cariño. Incluye ensalada de tomate y cebolla.',
    precio: 4500,
    porciones_totales: 12,
    porciones_disponibles: 5,
    imagen_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600',
    ubicacion: { latitude: -33.3980, longitude: -70.6720 },
    estado: 'activa',
    creado_en: new Date().toISOString(),
    expira_en: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pub-2',
    cocinera_id: 'cocinera-2',
    titulo: 'Humitas Frescas con Ensalada Chilena',
    descripcion: 'Recién hechas, dulces o saladas a elección. Servidas con tomate fresco y albahaca.',
    precio: 2500,
    porciones_totales: 20,
    porciones_disponibles: 14,
    imagen_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=600',
    ubicacion: { latitude: -33.4010, longitude: -70.6750 },
    estado: 'activa',
    creado_en: new Date().toISOString(),
    expira_en: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pub-3',
    cocinera_id: 'cocinera-3',
    titulo: 'Porotos con Rienda y Longaniza',
    descripcion: 'Receta tradicional chilena. Plato contundente ideal para el frío del invierno.',
    precio: 3800,
    porciones_totales: 15,
    porciones_disponibles: 0, // Out of stock for testing
    imagen_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
    ubicacion: { latitude: -33.3920, longitude: -70.6800 },
    estado: 'agotada',
    creado_en: new Date().toISOString(),
    expira_en: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Expired
  }
];

// Helper to load or initialize LocalStorage
const getStorageData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const setStorageData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial setup
export const initMockDb = () => {
  getStorageData<Usuario[]>(KEYS.USUARIOS, MOCK_USUARIOS);
  getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);
  getStorageData<InteraccionReserva[]>(KEYS.INTERACCIONES, []);
};

export const mockDb = {
  // --- usuarios ---
  getUsuario: async (id: string): Promise<Usuario | null> => {
    initMockDb();
    const users = getStorageData<Usuario[]>(KEYS.USUARIOS, MOCK_USUARIOS);
    return users.find(u => u.id === id) || null;
  },

  guardarUsuario: async (usuario: Omit<Usuario, 'creado_en'>): Promise<Usuario> => {
    initMockDb();
    const users = getStorageData<Usuario[]>(KEYS.USUARIOS, MOCK_USUARIOS);
    const existingIndex = users.findIndex(u => u.id === usuario.id || u.telefono_whatsapp === usuario.telefono_whatsapp);
    
    const newUser: Usuario = {
      ...usuario,
      id: usuario.id || `user-${Math.random().toString(36).substr(2, 9)}`,
      creado_en: new Date().toISOString()
    };

    if (existingIndex > -1) {
      users[existingIndex] = { ...users[existingIndex], ...newUser };
    } else {
      users.push(newUser);
    }

    setStorageData(KEYS.USUARIOS, users);
    return newUser;
  },

  // --- publicaciones ---
  obtenerColacionesCercanas: async (
    userLat: number,
    userLng: number,
    radioMetros = 1500
  ): Promise<ColacionCercana[]> => {
    initMockDb();
    const pubs = getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);
    const users = getStorageData<Usuario[]>(KEYS.USUARIOS, MOCK_USUARIOS);

    // Filters matching the Postgres RPC: active, stock > 0, within radius
    const filtered = pubs.filter(p => {
      // Auto-expire check
      const isExpired = new Date(p.expira_en).getTime() < Date.now();
      const isActive = p.estado === 'activa' && !isExpired && p.porciones_disponibles > 0;
      if (!isActive) return false;

      // Distance check
      const dist = calculateDistance(userLat, userLng, p.ubicacion.latitude, p.ubicacion.longitude);
      return dist <= radioMetros;
    });

    // Map to result layout (join cocinera information)
    const results: ColacionCercana[] = filtered.map(p => {
      const cocinera = users.find(u => u.id === p.cocinera_id) || {
        nombre: 'Cocinera Anónima',
        telefono_whatsapp: '+56999999999'
      };

      const dist = calculateDistance(userLat, userLng, p.ubicacion.latitude, p.ubicacion.longitude);

      return {
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        precio: p.precio,
        porciones_disponibles: p.porciones_disponibles,
        porciones_totales: p.porciones_totales,
        imagen_url: p.imagen_url,
        nombre_cocinera: cocinera.nombre,
        telefono_whatsapp: cocinera.telefono_whatsapp,
        distancia_metros: dist,
        ubicacion: p.ubicacion
      };
    });

    // Sort by proximity (shortest distance first)
    return results.sort((a, b) => a.distancia_metros - b.distancia_metros);
  },

  crearPublicacion: async (
    cocineraId: string,
    titulo: string,
    descripcion: string,
    precio: number,
    porcionesTotales: number,
    imagenUrl: string,
    ubicacion: { latitude: number; longitude: number }
  ): Promise<Publicacion> => {
    initMockDb();
    const pubs = getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);

    const newPub: Publicacion = {
      id: `pub-${Math.random().toString(36).substr(2, 9)}`,
      cocinera_id: cocineraId,
      titulo,
      descripcion,
      precio,
      porciones_totales: porcionesTotales,
      porciones_disponibles: porcionesTotales,
      imagen_url: imagenUrl,
      ubicacion,
      estado: 'activa',
      creado_en: new Date().toISOString(),
      expira_en: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours expiry
    };

    pubs.unshift(newPub); // Put at front
    setStorageData(KEYS.PUBLICACIONES, pubs);
    return newPub;
  },

  obtenerMisPublicaciones: async (cocineraId: string): Promise<Publicacion[]> => {
    initMockDb();
    const pubs = getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);
    return pubs.filter(p => p.cocinera_id === cocineraId);
  },

  cambiarEstadoPublicacion: async (id: string, estado: 'activa' | 'agotada' | 'expirada'): Promise<Publicacion | null> => {
    initMockDb();
    const pubs = getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);
    const idx = pubs.findIndex(p => p.id === id);
    if (idx === -1) return null;

    pubs[idx].estado = estado;
    if (estado === 'agotada') {
      pubs[idx].porciones_disponibles = 0;
    }
    setStorageData(KEYS.PUBLICACIONES, pubs);
    return pubs[idx];
  },

  // --- interacciones_reserva ---
  reservarPorcion: async (
    publicacionId: string,
    vecinoId: string | null
  ): Promise<{ success: boolean; interaccionId?: string }> => {
    initMockDb();
    const pubs = getStorageData<Publicacion[]>(KEYS.PUBLICACIONES, MOCK_PUBLICACIONES);
    const interacciones = getStorageData<InteraccionReserva[]>(KEYS.INTERACCIONES, []);

    const pubIdx = pubs.findIndex(p => p.id === publicacionId);
    if (pubIdx === -1) return { success: false };

    const pub = pubs[pubIdx];
    if (pub.porciones_disponibles <= 0 || pub.estado !== 'activa') {
      return { success: false };
    }

    // Decrement stock
    pub.porciones_disponibles -= 1;
    if (pub.porciones_disponibles === 0) {
      pub.estado = 'agotada';
    }

    // Register reservation
    const interaccion: InteraccionReserva = {
      id: `int-${Math.random().toString(36).substr(2, 9)}`,
      publicacion_id: publicacionId,
      vecino_id: vecinoId,
      porciones_pedidas: 1,
      creado_en: new Date().toISOString(),
      solicitado_aporte: false,
    };

    interacciones.push(interaccion);
    setStorageData(KEYS.PUBLICACIONES, pubs);
    setStorageData(KEYS.INTERACCIONES, interacciones);

    return { success: true, interaccionId: interaccion.id };
  },

  registrarAporteSolicitado: async (interaccionId: string): Promise<void> => {
    initMockDb();
    const interacciones = getStorageData<InteraccionReserva[]>(KEYS.INTERACCIONES, []);
    const idx = interacciones.findIndex(i => i.id === interaccionId);
    if (idx > -1) {
      interacciones[idx].solicitado_aporte = true;
      setStorageData(KEYS.INTERACCIONES, interacciones);
    }
  },

  obtenerReservasPendientesAporte: async (vecinoId: string | null): Promise<InteraccionReserva[]> => {
    initMockDb();
    const interacciones = getStorageData<InteraccionReserva[]>(KEYS.INTERACCIONES, []);
    // Filter interactions that have not been asked for tips, or are just generic reservations
    return interacciones.filter(i => i.vecino_id === vecinoId && !i.solicitado_aporte);
  }
};
