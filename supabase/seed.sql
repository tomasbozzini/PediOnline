-- ============================================================
-- Seed: tenant "pizzeria-demo" con los datos de demo.html
-- ============================================================

-- 1. Tenant
insert into tenants (id, slug, nombre, tagline, whatsapp, badges, colores) values (
  'a0000000-0000-0000-0000-000000000001',
  'pizzeria-demo',
  'Pizzería',
  'pizza al molde · horno de barro · masa artesanal',
  '1133907596',
  '["🕗 19:30–23:30", "🛵 Delivery", "📍 Zona centro"]',
  '{
    "bg":          "#FAF2E6",
    "primary":     "#C0432C",
    "primaryDark": "#8F2C1C",
    "secondary":   "#7E2B2B",
    "accent":      "#E0A02E",
    "accentDark":  "#B97F1E",
    "text":        "#3B2A20",
    "textMuted":   "#8A7D68",
    "border":      "#ECDCC4",
    "surface":     "#FFFFFF"
  }'
);

-- 2. Categorías
insert into categorias (id, tenant_id, slug, nombre, emoji, sub, mitad_y_mitad, orden) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'pizzas',    'Pizzas',    '🍕', 'Al molde, 8 porciones, salen con horno de barro',   true,  0),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'empanadas', 'Empanadas', '🥟', 'Horneadas, masa casera · precio por unidad',         false, 1),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'faina',     'Fainá',     '🫓', 'De garbanzo, finita y dorada',                       false, 2),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'bebidas',   'Bebidas',   '🥤', 'Bien frías',                                         false, 3);

-- 3. Productos

-- Pizzas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000001', 'muzza', 'Muzzarella',          'Salsa de tomate, muzzarella, aceitunas verdes y orégano.',                    14000, '🍕', null, 0),
  ('b0000000-0000-0000-0000-000000000001', 'napo',  'Napolitana',          'Muzzarella, rodajas de tomate fresco, ajo y perejil.',                        16500, '🍕', null, 1),
  ('b0000000-0000-0000-0000-000000000001', 'fuga',  'Fugazzeta',           'Doble muzzarella y montaña de cebolla. La de siempre.',                       17000, '🍕', null, 2),
  ('b0000000-0000-0000-0000-000000000001', 'cala',  'Calabresa',           'Muzzarella y longaniza calabresa en rodajas.',                                17500, '🍕', null, 3),
  ('b0000000-0000-0000-0000-000000000001', '4q',    'Cuatro Quesos',       'Muzzarella, roquefort, provolone y parmesano.',                               19000, '🍕', null, 4),
  ('b0000000-0000-0000-0000-000000000001', 'esp',   'Especial de la casa', 'Jamón, morrones asados, huevo duro y aceitunas.',                             18500, '🍕', null, 5);

-- Empanadas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000002', 'emp-carne', 'Carne cortada a cuchillo', 'Con huevo, aceituna y el toque de comino de la nona.',                1600, '🥟', null, 0),
  ('b0000000-0000-0000-0000-000000000002', 'emp-jyq',   'Jamón y queso',            'Bien rellenas, queso que se estira.',                                 1600, '🥟', null, 1),
  ('b0000000-0000-0000-0000-000000000002', 'emp-pollo', 'Pollo',                    'Pollo desmenuzado con verdeo y morrón.',                              1600, '🥟', null, 2),
  ('b0000000-0000-0000-0000-000000000002', 'emp-doc',   'Docena surtida',           'Elegimos las mejores de cada gusto. Avisanos preferencias en notas.', 18000, '🥟', null, 3);

-- Fainá
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000003', 'faina-por', 'Porción de fainá', 'El clásico caballo para tu porción de muzza.', 2500, '🫓', null, 0),
  ('b0000000-0000-0000-0000-000000000003', 'faina-ent', 'Fainá entera',     '8 porciones recién salidas del horno.',         8000, '🫓', null, 1);

-- Bebidas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000004', 'gaseosa', 'Gaseosa 1.5L',       'Coca-Cola, Sprite o Fanta. Aclaranos cuál en notas.', 4500, '🥤', null, 0),
  ('b0000000-0000-0000-0000-000000000004', 'agua',    'Agua mineral 1.5L',  'Con o sin gas.',                                      3000, '💧', null, 1),
  ('b0000000-0000-0000-0000-000000000004', 'birra',   'Cerveza 1L',         'Rubia bien helada, retornable no.',                    5500, '🍺', null, 2),
  ('b0000000-0000-0000-0000-000000000004', 'moscato', 'Moscato 750ml',      'Porque pizza sin moscato es solo queso con pan.',      6500, '🍷', null, 3);


-- ============================================================
-- Seed: tenant "la-sirena" — La Sirena Pizzería (Tandil)
-- Catálogo placeholder (misma estructura que pizzeria-demo);
-- los productos y precios reales se reemplazan después en Supabase.
-- ============================================================

-- Columnas de logo (idempotente: por si la base ya estaba creada sin ellas)
alter table tenants add column if not exists logo_url   text;
alter table tenants add column if not exists logo_emoji text;

-- 1. Tenant
insert into tenants (id, slug, nombre, tagline, whatsapp, logo_emoji, badges, colores) values (
  'a0000000-0000-0000-0000-000000000002',
  'la-sirena',
  'La Sirena Pizzería',
  'Pizza Argentina al Molde · Tandil',
  '5492494602113',
  '🧜‍♀️',
  '["🕗 20:00–00:00 hs", "📍 Pinto 890, Tandil"]',
  '{
    "bg":          "#F4F6F1",
    "primary":     "#2F5E3A",
    "primaryDark": "#1A3D1F",
    "secondary":   "#003C1A",
    "accent":      "#C06423",
    "accentDark":  "#904B1A",
    "text":        "#23311F",
    "textMuted":   "#7C8B79",
    "border":      "#DCE6DA",
    "surface":     "#FFFFFF"
  }'
);

-- 2. Categorías
insert into categorias (id, tenant_id, slug, nombre, emoji, sub, mitad_y_mitad, orden) values
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'pizzas',    'Pizzas',    '🍕', 'Al molde, 8 porciones, salen con horno de barro',   true,  0),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'empanadas', 'Empanadas', '🥟', 'Horneadas, masa casera · precio por unidad',         false, 1),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'faina',     'Fainá',     '🫓', 'De garbanzo, finita y dorada',                       false, 2),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'bebidas',   'Bebidas',   '🥤', 'Bien frías',                                         false, 3);

-- 3. Productos (placeholder)

-- Pizzas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000005', 'muzza', 'Muzzarella',          'Salsa de tomate, muzzarella, aceitunas verdes y orégano.',                    14000, '🍕', null, 0),
  ('b0000000-0000-0000-0000-000000000005', 'napo',  'Napolitana',          'Muzzarella, rodajas de tomate fresco, ajo y perejil.',                        16500, '🍕', null, 1),
  ('b0000000-0000-0000-0000-000000000005', 'fuga',  'Fugazzeta',           'Doble muzzarella y montaña de cebolla. La de siempre.',                       17000, '🍕', null, 2),
  ('b0000000-0000-0000-0000-000000000005', 'cala',  'Calabresa',           'Muzzarella y longaniza calabresa en rodajas.',                                17500, '🍕', null, 3),
  ('b0000000-0000-0000-0000-000000000005', '4q',    'Cuatro Quesos',       'Muzzarella, roquefort, provolone y parmesano.',                               19000, '🍕', null, 4),
  ('b0000000-0000-0000-0000-000000000005', 'esp',   'Especial de la casa', 'Jamón, morrones asados, huevo duro y aceitunas.',                             18500, '🍕', null, 5);

-- Empanadas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000006', 'emp-carne', 'Carne cortada a cuchillo', 'Con huevo, aceituna y el toque de comino de la nona.',                1600, '🥟', null, 0),
  ('b0000000-0000-0000-0000-000000000006', 'emp-jyq',   'Jamón y queso',            'Bien rellenas, queso que se estira.',                                 1600, '🥟', null, 1),
  ('b0000000-0000-0000-0000-000000000006', 'emp-pollo', 'Pollo',                    'Pollo desmenuzado con verdeo y morrón.',                              1600, '🥟', null, 2),
  ('b0000000-0000-0000-0000-000000000006', 'emp-doc',   'Docena surtida',           'Elegimos las mejores de cada gusto. Avisanos preferencias en notas.', 18000, '🥟', null, 3);

-- Fainá
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000007', 'faina-por', 'Porción de fainá', 'El clásico caballo para tu porción de muzza.', 2500, '🫓', null, 0),
  ('b0000000-0000-0000-0000-000000000007', 'faina-ent', 'Fainá entera',     '8 porciones recién salidas del horno.',         8000, '🫓', null, 1);

-- Bebidas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, orden) values
  ('b0000000-0000-0000-0000-000000000008', 'gaseosa', 'Gaseosa 1.5L',       'Coca-Cola, Sprite o Fanta. Aclaranos cuál en notas.', 4500, '🥤', null, 0),
  ('b0000000-0000-0000-0000-000000000008', 'agua',    'Agua mineral 1.5L',  'Con o sin gas.',                                      3000, '💧', null, 1),
  ('b0000000-0000-0000-0000-000000000008', 'birra',   'Cerveza 1L',         'Rubia bien helada, retornable no.',                    5500, '🍺', null, 2),
  ('b0000000-0000-0000-0000-000000000008', 'moscato', 'Moscato 750ml',      'Porque pizza sin moscato es solo queso con pan.',      6500, '🍷', null, 3);


-- ============================================================
-- Diseño por tenant: template + tokens de estilo
-- (idempotente: agrega columnas si faltan y asigna el diseño)
-- ============================================================
alter table tenants add column if not exists template text default 'clasico';
alter table tenants add column if not exists estilos  jsonb default '{}'::jsonb;

-- Pizzería: diseño clásico (grilla de cards con foto)
update tenants
set template = 'clasico'
where slug = 'pizzeria-demo';

-- La Sirena: diseño moderno (menú en lista) con tipografía elegante
update tenants
set template = 'moderno',
    estilos = '{"fontDisplay": "''Playfair Display'', serif", "fontBody": "''Inter'', sans-serif"}'::jsonb
where slug = 'la-sirena';


-- ============================================================
-- Seed: tenant "pizzeria-2" — demo storefront "trattoria"
-- Diseño de una página (hero narrativo + franjas + checkout WhatsApp).
-- La paleta del template trattoria es fija; colores acá se usan sobre
-- todo para el panel admin (que toma --color-primary del tenant).
-- ============================================================

-- Asegura las columnas necesarias (idempotente, por si se corre suelto sobre
-- una base vieja a la que nunca se le aplicaron las partes incrementales)
alter table tenants   add column if not exists template  text  default 'clasico';
alter table tenants   add column if not exists estilos   jsonb default '{}'::jsonb;
alter table tenants   add column if not exists pin_admin text  default '1234';
alter table productos add column if not exists stock     integer default null;

-- 1. Tenant
insert into tenants (id, slug, nombre, tagline, whatsapp, logo_emoji, badges, template, pin_admin, colores) values (
  'a0000000-0000-0000-0000-000000000003',
  'pizzeria-2',
  'Pizzería 2',
  'Masa artesanal, salsa natural y el horno prendido todas las noches.',
  '5492494551234',
  '🍕',
  '["🕗 19:30–23:30 hs", "📍 Av. del Valle 1200", "🛵 Envío gratis en el centro"]',
  'trattoria',
  '2222',
  '{
    "bg":          "#FBF4E4",
    "primary":     "#B23A26",
    "primaryDark": "#8A2C1C",
    "secondary":   "#566B34",
    "accent":      "#C89331",
    "accentDark":  "#9A6F1F",
    "text":        "#2A211A",
    "textMuted":   "#7A6F5C",
    "border":      "#EADCC0",
    "surface":     "#FFFFFF"
  }'
);

-- 2. Categorías
insert into categorias (id, tenant_id, slug, nombre, emoji, sub, mitad_y_mitad, orden) values
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'pizzas',    'Las clásicas', '🍕', 'Al molde, 8 porciones, del horno de barro',  true,  0),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'empanadas', 'Empanadas',    '🥟', 'Horneadas, masa casera · por unidad',        false, 1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'faina',     'Fainá',        '🫓', 'De garbanzo, finita y dorada',               false, 2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'bebidas',   'Bebidas',      '🥤', 'Bien frías',                                 false, 3);

-- 3. Productos (con stock para lucir el panel: algunos acotados, otros sin límite)

-- Pizzas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, stock, orden) values
  ('b0000000-0000-0000-0000-000000000009', 'muzza', 'Muzzarella',          'Salsa de tomate, muzzarella, aceitunas verdes y orégano.', 14000, '🍕', null, 20,   0),
  ('b0000000-0000-0000-0000-000000000009', 'napo',  'Napolitana',          'Muzzarella, rodajas de tomate fresco, ajo y perejil.',     16500, '🍕', null, 15,   1),
  ('b0000000-0000-0000-0000-000000000009', 'fuga',  'Fugazzeta',           'Doble muzzarella y montaña de cebolla. La de siempre.',    17000, '🍕', null, null, 2),
  ('b0000000-0000-0000-0000-000000000009', 'cala',  'Calabresa',           'Muzzarella y longaniza calabresa en rodajas.',             17500, '🍕', null, 8,    3),
  ('b0000000-0000-0000-0000-000000000009', '4q',    'Cuatro Quesos',       'Muzzarella, roquefort, provolone y parmesano.',            19000, '🍕', null, 6,    4),
  ('b0000000-0000-0000-0000-000000000009', 'trufa', 'Trufa & hongos',      'Crema de trufa, portobellos y muzzarella. De autor.',      22000, '🍕', null, 4,    5);

-- Empanadas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, stock, orden) values
  ('b0000000-0000-0000-0000-000000000010', 'emp-carne', 'Carne a cuchillo', 'Con huevo, aceituna y el toque de comino de la nona.', 1600, '🥟', null, null, 0),
  ('b0000000-0000-0000-0000-000000000010', 'emp-jyq',   'Jamón y queso',    'Bien rellenas, queso que se estira.',                 1600, '🥟', null, null, 1),
  ('b0000000-0000-0000-0000-000000000010', 'emp-pollo', 'Pollo',            'Pollo desmenuzado con verdeo y morrón.',              1600, '🥟', null, null, 2);

-- Fainá
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, stock, orden) values
  ('b0000000-0000-0000-0000-000000000011', 'faina-por', 'Porción de fainá', 'El clásico caballo para tu porción de muzza.', 2500, '🫓', null, 30, 0),
  ('b0000000-0000-0000-0000-000000000011', 'faina-ent', 'Fainá entera',     '8 porciones recién salidas del horno.',        8000, '🫓', null, 10, 1);

-- Bebidas
insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, stock, orden) values
  ('b0000000-0000-0000-0000-000000000012', 'gaseosa', 'Gaseosa 1.5L',      'Coca-Cola, Sprite o Fanta. Aclaranos cuál en notas.', 4500, '🥤', null, null, 0),
  ('b0000000-0000-0000-0000-000000000012', 'agua',    'Agua mineral 1.5L', 'Con o sin gas.',                                      3000, '💧', null, null, 1),
  ('b0000000-0000-0000-0000-000000000012', 'birra',   'Cerveza 1L',        'Rubia bien helada.',                                  5500, '🍺', null, 24,   2);
