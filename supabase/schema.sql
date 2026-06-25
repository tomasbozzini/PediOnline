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
