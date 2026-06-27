-- ============================================================
-- Esquema multi-tenant: PediOnline
-- ============================================================

-- Tabla de comercios (tenants)
create table tenants (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  nombre     text not null,
  tagline    text,
  whatsapp   text not null,            -- formato internacional sin "+", ej: 5492494123456
  logo_url   text,                     -- url del logo; si está presente se muestra como imagen en el círculo
  logo_emoji text,                     -- emoji placeholder para el logo cuando no hay logo_url, ej: "🧜‍♀️"
  badges     jsonb default '[]'::jsonb, -- array de strings, ej: ["🕗 19:30–23:30", "🛵 Delivery"]
  colores    jsonb default '{}'::jsonb, -- claves: bg, primary, primaryDark, secondary, accent, accentDark, text, textMuted, border, surface
  template   text default 'clasico',    -- qué diseño de página usar: 'clasico' | 'moderno'
  estilos    jsonb default '{}'::jsonb, -- tokens de estilo: fontDisplay, fontBody, radio, sombra
  created_at timestamptz default now()
);

-- Tabla de categorías
create table categorias (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  slug          text not null,
  nombre        text not null,
  emoji         text,
  sub           text,                   -- descripción corta debajo del título de sección
  mitad_y_mitad boolean default false,
  orden         int not null default 0
);

-- Índice para consultar categorías de un tenant ordenadas
create index idx_categorias_tenant on categorias(tenant_id, orden);

-- Tabla de productos
create table productos (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references categorias(id) on delete cascade,
  slug          text not null,           -- id corto usado en el carrito, ej: "muzza"
  nombre        text not null,
  descripcion   text,
  precio        numeric not null,
  emoji         text,
  img_url       text,                    -- null = placeholder rayado
  orden         int not null default 0
);

-- Índice para consultar productos de una categoría ordenados
create index idx_productos_categoria on productos(categoria_id, orden);

-- RLS: acceso público de solo lectura
alter table tenants enable row level security;
alter table categorias enable row level security;
alter table productos enable row level security;

create policy "Tenants público" on tenants for select using (true);
create policy "Categorías público" on categorias for select using (true);
create policy "Productos público" on productos for select using (true);


-- ============================================================
-- Stock, persistencia de pedidos y panel admin (incremental)
-- ============================================================

-- Stock en productos (null = sin límite, 0 = sin stock, N = unidades disponibles)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock integer DEFAULT NULL;

-- PIN simple para acceso al panel admin
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pin_admin text DEFAULT '1234';

-- Columnas de theming por tenant (en DBs creadas antes de sumarlas al CREATE TABLE)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS template text DEFAULT 'clasico';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS estilos jsonb DEFAULT '{}'::jsonb;

-- Contador de órdenes por tenant (para número de orden atómico y por tenant)
CREATE TABLE IF NOT EXISTS tenant_order_counters (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  ultimo_numero integer NOT NULL DEFAULT 0
);
INSERT INTO tenant_order_counters (tenant_id)
SELECT id FROM tenants ON CONFLICT DO NOTHING;

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_orden integer NOT NULL,
  nombre_cliente text NOT NULL,
  telefono text,
  entrega text NOT NULL,
  direccion text,
  pago text,
  notas text,
  estado text NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'confirmado' | 'entregado' | 'cancelado'
  total numeric NOT NULL DEFAULT 0,
  mensaje_whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, numero_orden)
);

-- Teléfono del cliente (en DBs donde la tabla pedidos ya existía sin la columna)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefono text;

-- Tabla de ítems del pedido
CREATE TABLE IF NOT EXISTS pedidos_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  es_custom boolean NOT NULL DEFAULT false -- true para combos mitad/mitad
);

-- RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pedidos_insert" ON pedidos;
DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_update" ON pedidos;
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT USING (true);
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE USING (true);

ALTER TABLE pedidos_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "items_insert" ON pedidos_items;
DROP POLICY IF EXISTS "items_select" ON pedidos_items;
CREATE POLICY "items_insert" ON pedidos_items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_select" ON pedidos_items FOR SELECT USING (true);

ALTER TABLE tenant_order_counters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "counters_select" ON tenant_order_counters;
CREATE POLICY "counters_select" ON tenant_order_counters FOR SELECT USING (true);

-- Realtime (idempotente: no falla si la tabla ya está en la publicación)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE productos;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Función crear_pedido: número de orden atómico por tenant
-- Se elimina la firma anterior (sin p_telefono) antes de recrearla
DROP FUNCTION IF EXISTS crear_pedido(uuid, text, text, text, text, text, numeric, text, jsonb);

CREATE OR REPLACE FUNCTION crear_pedido(
  p_tenant_id uuid,
  p_nombre_cliente text,
  p_telefono text,
  p_entrega text,
  p_direccion text,
  p_pago text,
  p_notas text,
  p_total numeric,
  p_mensaje_whatsapp text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_numero_orden integer;
  v_pedido_id uuid;
BEGIN
  -- Garantiza la fila del contador aunque el tenant se haya creado luego del schema inicial
  INSERT INTO tenant_order_counters (tenant_id) VALUES (p_tenant_id) ON CONFLICT DO NOTHING;

  UPDATE tenant_order_counters
  SET ultimo_numero = ultimo_numero + 1
  WHERE tenant_id = p_tenant_id
  RETURNING ultimo_numero INTO v_numero_orden;

  INSERT INTO pedidos (tenant_id, numero_orden, nombre_cliente, telefono, entrega, direccion, pago, notas, total, mensaje_whatsapp)
  VALUES (p_tenant_id, v_numero_orden, p_nombre_cliente, p_telefono, p_entrega, p_direccion, p_pago, p_notas, p_total, p_mensaje_whatsapp)
  RETURNING id INTO v_pedido_id;

  INSERT INTO pedidos_items (pedido_id, producto_id, nombre, cantidad, precio_unitario, es_custom)
  SELECT
    v_pedido_id,
    CASE WHEN (item->>'producto_id') IS NOT NULL THEN (item->>'producto_id')::uuid ELSE NULL END,
    item->>'nombre',
    (item->>'cantidad')::integer,
    (item->>'precio_unitario')::numeric,
    COALESCE((item->>'es_custom')::boolean, false)
  FROM jsonb_array_elements(p_items) AS item;

  RETURN jsonb_build_object('id', v_pedido_id, 'numero_orden', v_numero_orden);
END;
$$;

-- Función set_stock: permite al panel reponer/editar stock sin abrir toda la
-- tabla productos a UPDATE anónimo (la anon key es pública). SECURITY DEFINER
-- limita la escritura exclusivamente a la columna stock.
CREATE OR REPLACE FUNCTION set_stock(p_producto_id uuid, p_stock integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE productos SET stock = p_stock WHERE id = p_producto_id;
END;
$$;

-- Función descontar_stock: atómica, falla silenciosamente si no hay stock suficiente
-- (legado: hoy la confirmación usa confirmar_pedido, que es todo-o-nada)
CREATE OR REPLACE FUNCTION descontar_stock(p_producto_id uuid, p_cantidad integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE productos
  SET stock = stock - p_cantidad
  WHERE id = p_producto_id
    AND stock IS NOT NULL
    AND stock >= p_cantidad;
  RETURN FOUND;
END;
$$;

-- Función confirmar_pedido: confirma un pedido de forma ATÓMICA (todo-o-nada).
-- Bloquea el pedido y los productos involucrados, verifica que haya stock para
-- TODOS los ítems de catálogo, y recién ahí descuenta y pasa a 'confirmado'.
-- Si a algún producto (con stock != null) no le alcanza, NO modifica nada y
-- devuelve la lista de faltantes para que el panel avise cuál se quedó sin stock.
--   ok=true                       -> confirmado y stock descontado
--   ok=false, error='sin_stock'   -> faltantes:[{producto_id,nombre,disponible,requerido}]
--   ok=false, error='estado_invalido' -> el pedido ya no estaba pendiente
CREATE OR REPLACE FUNCTION confirmar_pedido(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_estado    text;
  v_faltantes jsonb;
BEGIN
  -- Bloquear el pedido y validar que siga pendiente (evita doble confirmación)
  SELECT estado INTO v_estado FROM pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF v_estado IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_existe');
  END IF;
  IF v_estado <> 'pendiente' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'estado_invalido', 'estado', v_estado);
  END IF;

  -- Bloquear las filas de productos involucradas (serializa confirmaciones
  -- concurrentes que compitan por el mismo stock). ORDER BY id baja deadlocks.
  PERFORM 1
  FROM productos
  WHERE id IN (
    SELECT DISTINCT producto_id FROM pedidos_items
    WHERE pedido_id = p_pedido_id AND es_custom = false AND producto_id IS NOT NULL
  )
  ORDER BY id
  FOR UPDATE;

  -- Detectar faltantes: producto con stock acotado y menor a lo requerido
  SELECT jsonb_agg(jsonb_build_object(
           'producto_id', p.id,
           'nombre',      p.nombre,
           'disponible',  p.stock,
           'requerido',   n.req))
  INTO v_faltantes
  FROM (
    SELECT producto_id, SUM(cantidad)::int AS req
    FROM pedidos_items
    WHERE pedido_id = p_pedido_id AND es_custom = false AND producto_id IS NOT NULL
    GROUP BY producto_id
  ) n
  JOIN productos p ON p.id = n.producto_id
  WHERE p.stock IS NOT NULL AND p.stock < n.req;

  IF v_faltantes IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sin_stock', 'faltantes', v_faltantes);
  END IF;

  -- Hay stock para todo: descontar (solo donde el stock está acotado)
  UPDATE productos p
  SET stock = p.stock - n.req
  FROM (
    SELECT producto_id, SUM(cantidad)::int AS req
    FROM pedidos_items
    WHERE pedido_id = p_pedido_id AND es_custom = false AND producto_id IS NOT NULL
    GROUP BY producto_id
  ) n
  WHERE p.id = n.producto_id AND p.stock IS NOT NULL;

  UPDATE pedidos SET estado = 'confirmado' WHERE id = p_pedido_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
