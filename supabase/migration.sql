-- migration.sql
-- Habilitar extensión de geolocalización
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum de roles y estados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('cocinera', 'vecino');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publication_status') THEN
        CREATE TYPE publication_status AS ENUM ('activa', 'agotada', 'expirada');
    END IF;
END $$;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono_whatsapp TEXT NOT NULL, -- Formato internacional (+569XXXXXXXX)
    rol user_role NOT NULL DEFAULT 'vecino',
    ubicacion GEOGRAPHY(Point, 4326),
    direccion_referencia TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Publicaciones (Menú del día)
CREATE TABLE IF NOT EXISTS publicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cocinera_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio INT NOT NULL, -- CLP
    porciones_totales INT NOT NULL,
    porciones_disponibles INT NOT NULL,
    imagen_url TEXT NOT NULL,
    ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
    estado publication_status DEFAULT 'activa',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expira_en TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '8 hours')
);

-- Indice espacial para búsquedas ultrarrápidas por cercanía
CREATE INDEX IF NOT EXISTS idx_publicaciones_ubicacion ON publicaciones USING GIST (ubicacion);

-- Tabla de Interacciones / Métricas de Reserva
CREATE TABLE IF NOT EXISTS interacciones_reserva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publicacion_id UUID REFERENCES publicaciones(id) ON DELETE CASCADE,
    vecino_id UUID REFERENCES usuarios(id),
    porciones_pedidas INT DEFAULT 1,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    solicitado_aporte BOOLEAN DEFAULT FALSE
);

-- Función de Consulta por Cercanía (Supabase RPC)
CREATE OR REPLACE FUNCTION obtener_colaciones_cercanas(
    user_lat FLOAT,
    user_lng FLOAT,
    radio_metros FLOAT DEFAULT 1500
)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    precio INT,
    porciones_disponibles INT,
    imagen_url TEXT,
    nombre_cocinera TEXT,
    telefono_whatsapp TEXT,
    distancia_metros FLOAT
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.titulo,
        p.precio,
        p.porciones_disponibles,
        p.imagen_url,
        u.nombre AS nombre_cocinera,
        u.telefono_whatsapp,
        ST_Distance(p.ubicacion, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distancia_metros
    FROM publicaciones p
    JOIN usuarios u ON p.cocinera_id = u.id
    WHERE p.estado = 'activa'
      AND p.porciones_disponibles > 0
      AND ST_DWithin(p.ubicacion, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radio_metros)
    ORDER BY distancia_metros ASC;
END;
$$;
