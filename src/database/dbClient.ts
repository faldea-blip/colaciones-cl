// src/database/dbClient.ts
import { isSupabaseConfigured, supabase } from './supabase';
import { mockDb } from './mockDb';
import type { Usuario, Publicacion, ColacionCercana } from './mockDb';
import { blobToBase64 } from '../utils/imageCompressor';

// Determine if we are running in real Supabase mode or Demo (mock) mode
export const IS_DEMO_MODE = !isSupabaseConfigured;

console.log(
  IS_DEMO_MODE 
    ? '📌 colaciones.cl: Corriendo en MODO DEMO (Base de datos local simulada)' 
    : '🚀 colaciones.cl: Corriendo en MODO PRODUCTIVO (Supabase conectado)'
);

export const dbClient = {
  // --- usuarios ---
  getUsuario: async (id: string): Promise<Usuario | null> => {
    if (IS_DEMO_MODE) {
      return mockDb.getUsuario(id);
    }

    const { data, error } = await supabase!
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Error fetching user from Supabase:', error.message);
      return null;
    }

    // Map point to coords
    let ubicacion = null;
    if (data.ubicacion) {
      // PostGIS points are returned differently or can be parsed
      // We assume simple format or standard parsing depending on PostGIS representation
      // Supabase PostGIS returns GeoJSON format: { type: "Point", coordinates: [lng, lat] }
      const geo = data.ubicacion as any;
      if (geo.coordinates) {
        ubicacion = {
          latitude: geo.coordinates[1],
          longitude: geo.coordinates[0]
        };
      }
    }

    return {
      ...data,
      ubicacion
    } as Usuario;
  },

  guardarUsuario: async (usuario: Omit<Usuario, 'creado_en'>): Promise<Usuario> => {
    if (IS_DEMO_MODE) {
      return mockDb.guardarUsuario(usuario);
    }

    // Convert coordinates to PostGIS Point syntax: POINT(lng lat)
    const postgisPoint = usuario.ubicacion
      ? `POINT(${usuario.ubicacion.longitude} ${usuario.ubicacion.latitude})`
      : null;

    const dbPayload = {
      id: usuario.id || undefined,
      nombre: usuario.nombre,
      telefono_whatsapp: usuario.telefono_whatsapp,
      rol: usuario.rol,
      ubicacion: postgisPoint,
      direccion_referencia: usuario.direccion_referencia
    };

    const { data, error } = await supabase!
      .from('usuarios')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    let coords = null;
    if (data.ubicacion) {
      const geo = data.ubicacion as any;
      if (geo.coordinates) {
        coords = {
          latitude: geo.coordinates[1],
          longitude: geo.coordinates[0]
        };
      }
    }

    return {
      ...data,
      ubicacion: coords
    } as Usuario;
  },

  // --- publicaciones ---
  obtenerColacionesCercanas: async (
    userLat: number,
    userLng: number,
    radioMetros = 1500
  ): Promise<ColacionCercana[]> => {
    if (IS_DEMO_MODE) {
      return mockDb.obtenerColacionesCercanas(userLat, userLng, radioMetros);
    }

    // Call Supabase RPC function 'obtener_colaciones_cercanas'
    const { data, error } = await supabase!.rpc('obtener_colaciones_cercanas', {
      user_lat: userLat,
      user_lng: userLng,
      radio_metros: radioMetros
    });

    if (error) {
      console.error('Error invoking obtener_colaciones_cercanas RPC:', error.message);
      return [];
    }

    // Supabase RPC returns coordinates inside distance table or we append them.
    // The spec function returns: id, titulo, precio, porciones_disponibles, imagen_url, nombre_cocinera, telefono_whatsapp, distancia_metros.
    return (data || []) as ColacionCercana[];
  },

  crearPublicacion: async (
    cocineraId: string,
    titulo: string,
    descripcion: string,
    precio: number,
    porcionesTotales: number,
    imagenFile: File | Blob,
    ubicacion: { latitude: number; longitude: number }
  ): Promise<Publicacion> => {
    if (IS_DEMO_MODE) {
      // Compress to base64 for storage inside localStorage db
      const base64Img = await blobToBase64(imagenFile);
      return mockDb.crearPublicacion(
        cocineraId,
        titulo,
        descripcion,
        precio,
        porcionesTotales,
        base64Img,
        ubicacion
      );
    }

    // Real Supabase storage upload
    const fileExt = 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${cocineraId}/${fileName}`;

    const { error: uploadError } = await supabase!.storage
      .from('colaciones')
      .upload(filePath, imagenFile, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message);
      throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase!.storage
      .from('colaciones')
      .getPublicUrl(filePath);

    // Save publication in database with POINT geography
    const postgisPoint = `POINT(${ubicacion.longitude} ${ubicacion.latitude})`;

    const { data, error } = await supabase!
      .from('publicaciones')
      .insert({
        cocinera_id: cocineraId,
        titulo,
        descripcion,
        precio,
        porciones_totales: porcionesTotales,
        porciones_disponibles: porcionesTotales,
        imagen_url: publicUrl,
        ubicacion: postgisPoint,
        estado: 'activa',
        expira_en: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours expiry
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Publicacion;
  },

  obtenerMisPublicaciones: async (cocineraId: string): Promise<Publicacion[]> => {
    if (IS_DEMO_MODE) {
      return mockDb.obtenerMisPublicaciones(cocineraId);
    }

    const { data, error } = await supabase!
      .from('publicaciones')
      .select('*')
      .eq('cocinera_id', cocineraId)
      .order('creado_en', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as Publicacion[];
  },

  cambiarEstadoPublicacion: async (id: string, estado: 'activa' | 'agotada' | 'expirada'): Promise<Publicacion | null> => {
    if (IS_DEMO_MODE) {
      return mockDb.cambiarEstadoPublicacion(id, estado);
    }

    const updatePayload: any = { estado };
    if (estado === 'agotada') {
      updatePayload.porciones_disponibles = 0;
    }

    const { data, error } = await supabase!
      .from('publicaciones')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Publicacion;
  },

  // --- interacciones_reserva ---
  reservarPorcion: async (
    publicacionId: string,
    vecinoId: string | null
  ): Promise<{ success: boolean; interaccionId?: string }> => {
    if (IS_DEMO_MODE) {
      return mockDb.reservarPorcion(publicacionId, vecinoId);
    }

    // 1. Decrement stock
    // Since Supabase doesn't support transactional atomic decrement directly without a custom RPC or trigger,
    // we can do a quick check-and-update or run a dedicated RPC. Let's do it safely:
    // We fetch the current available portions
    const { data: pubData, error: fetchError } = await supabase!
      .from('publicaciones')
      .select('porciones_disponibles, estado')
      .eq('id', publicacionId)
      .single();

    if (fetchError || !pubData) return { success: false };
    if (pubData.porciones_disponibles <= 0 || pubData.estado !== 'activa') return { success: false };

    const newPortions = pubData.porciones_disponibles - 1;
    const newEstado = newPortions === 0 ? 'agotada' : 'activa';

    const { error: updateError } = await supabase!
      .from('publicaciones')
      .update({
        porciones_disponibles: newPortions,
        estado: newEstado
      })
      .eq('id', publicacionId);

    if (updateError) return { success: false };

    // 2. Insert interaction
    const { data: interData, error: interError } = await supabase!
      .from('interacciones_reserva')
      .insert({
        publicacion_id: publicacionId,
        vecino_id: vecinoId || undefined,
        porciones_pedidas: 1,
        solicitado_aporte: false
      })
      .select()
      .single();

    if (interError) {
      // Ignore reserve log error since stock is already decremented
      return { success: true };
    }

    return { success: true, interaccionId: interData.id };
  },

  registrarAporteSolicitado: async (interaccionId: string): Promise<void> => {
    if (IS_DEMO_MODE) {
      return mockDb.registrarAporteSolicitado(interaccionId);
    }

    await supabase!
      .from('interacciones_reserva')
      .update({ solicitado_aporte: true })
      .eq('id', interaccionId);
  },

  obtenerReservasPendientesAporte: async (vecinoId: string | null): Promise<any[]> => {
    if (IS_DEMO_MODE) {
      return mockDb.obtenerReservasPendientesAporte(vecinoId);
    }

    if (!vecinoId) return [];

    const { data, error } = await supabase!
      .from('interacciones_reserva')
      .select('id, publicacion_id, porciones_pedidas, creado_en')
      .eq('vecino_id', vecinoId)
      .eq('solicitado_aporte', false);

    if (error) {
      console.warn('Error checking pending tip interactions:', error.message);
      return [];
    }

    return data || [];
  }
};
