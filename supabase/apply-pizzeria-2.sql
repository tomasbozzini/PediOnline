-- ============================================================
-- APLICAR pizzeria-2 (template trattoria) sobre una base existente.
-- Idempotente: se puede correr varias veces sin romper nada.
-- Uso: Supabase Dashboard -> SQL Editor -> pegar TODO -> Run.
-- ============================================================

-- 1) Columnas faltantes ----------------------------------------------------
alter table tenants   add column if not exists template  text  default 'clasico';
alter table tenants   add column if not exists estilos   jsonb default '{}'::jsonb;
alter table tenants   add column if not exists pin_admin text  default '1234';
alter table productos add column if not exists stock     integer default null;

-- 2) Funciones del panel admin (por si nunca se crearon en esta base) -------
create or replace function set_stock(p_producto_id uuid, p_stock integer)
returns void language plpgsql security definer as $func$
begin
  update productos set stock = p_stock where id = p_producto_id;
end;
$func$;

create or replace function confirmar_pedido(p_pedido_id uuid)
returns jsonb language plpgsql security definer as $func$
declare
  v_estado    text;
  v_faltantes jsonb;
begin
  select estado into v_estado from pedidos where id = p_pedido_id for update;
  if v_estado is null then
    return jsonb_build_object('ok', false, 'error', 'no_existe');
  end if;
  if v_estado <> 'pendiente' then
    return jsonb_build_object('ok', false, 'error', 'estado_invalido', 'estado', v_estado);
  end if;

  perform 1
  from productos
  where id in (
    select distinct producto_id from pedidos_items
    where pedido_id = p_pedido_id and es_custom = false and producto_id is not null
  )
  order by id
  for update;

  select jsonb_agg(jsonb_build_object(
           'producto_id', p.id,
           'nombre',      p.nombre,
           'disponible',  p.stock,
           'requerido',   n.req))
  into v_faltantes
  from (
    select producto_id, sum(cantidad)::int as req
    from pedidos_items
    where pedido_id = p_pedido_id and es_custom = false and producto_id is not null
    group by producto_id
  ) n
  join productos p on p.id = n.producto_id
  where p.stock is not null and p.stock < n.req;

  if v_faltantes is not null then
    return jsonb_build_object('ok', false, 'error', 'sin_stock', 'faltantes', v_faltantes);
  end if;

  update productos p
  set stock = p.stock - n.req
  from (
    select producto_id, sum(cantidad)::int as req
    from pedidos_items
    where pedido_id = p_pedido_id and es_custom = false and producto_id is not null
    group by producto_id
  ) n
  where p.id = n.producto_id and p.stock is not null;

  update pedidos set estado = 'confirmado' where id = p_pedido_id;
  return jsonb_build_object('ok', true);
end;
$func$;

-- 3) Tenant pizzeria-2 + menu (template trattoria) -------------------------
insert into tenants (id, slug, nombre, tagline, whatsapp, logo_emoji, badges, template, pin_admin, colores) values (
  'a0000000-0000-0000-0000-000000000003',
  'pizzeria-2',
  'Pizzería 2',
  'Masa artesanal, salsa natural y el horno prendido todas las noches.',
  '5492494551234',
  '🍕',
  '["🕗 19:30-23:30 hs", "📍 Av. del Valle 1200", "🛵 Envío gratis en el centro"]',
  'trattoria',
  '2222',
  '{"bg":"#FBF4E4","primary":"#B23A26","primaryDark":"#8A2C1C","secondary":"#566B34","accent":"#C89331","accentDark":"#9A6F1F","text":"#2A211A","textMuted":"#7A6F5C","border":"#EADCC0","surface":"#FFFFFF"}'
)
on conflict (id) do nothing;

insert into categorias (id, tenant_id, slug, nombre, emoji, sub, mitad_y_mitad, orden) values
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'pizzas',    'Las clásicas', '🍕', 'Al molde, 8 porciones, del horno de barro', true,  0),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'empanadas', 'Empanadas',    '🥟', 'Horneadas, masa casera - por unidad',       false, 1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'faina',     'Fainá',        '🫓', 'De garbanzo, finita y dorada',              false, 2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'bebidas',   'Bebidas',      '🥤', 'Bien frías',                                false, 3)
on conflict (id) do nothing;

insert into productos (categoria_id, slug, nombre, descripcion, precio, emoji, img_url, stock, orden) values
  ('b0000000-0000-0000-0000-000000000009', 'muzza', 'Muzzarella',     'Salsa de tomate, muzzarella, aceitunas verdes y orégano.', 14000, '🍕', null, 20,   0),
  ('b0000000-0000-0000-0000-000000000009', 'napo',  'Napolitana',     'Muzzarella, rodajas de tomate fresco, ajo y perejil.',     16500, '🍕', null, 15,   1),
  ('b0000000-0000-0000-0000-000000000009', 'fuga',  'Fugazzeta',      'Doble muzzarella y montaña de cebolla. La de siempre.',    17000, '🍕', null, null, 2),
  ('b0000000-0000-0000-0000-000000000009', 'cala',  'Calabresa',      'Muzzarella y longaniza calabresa en rodajas.',             17500, '🍕', null, 8,    3),
  ('b0000000-0000-0000-0000-000000000009', '4q',    'Cuatro Quesos',  'Muzzarella, roquefort, provolone y parmesano.',            19000, '🍕', null, 6,    4),
  ('b0000000-0000-0000-0000-000000000009', 'trufa', 'Trufa & hongos', 'Crema de trufa, portobellos y muzzarella. De autor.',      22000, '🍕', null, 4,    5),
  ('b0000000-0000-0000-0000-000000000010', 'emp-carne', 'Carne a cuchillo', 'Con huevo, aceituna y el toque de comino de la nona.', 1600, '🥟', null, null, 0),
  ('b0000000-0000-0000-0000-000000000010', 'emp-jyq',   'Jamón y queso',    'Bien rellenas, queso que se estira.',                 1600, '🥟', null, null, 1),
  ('b0000000-0000-0000-0000-000000000010', 'emp-pollo', 'Pollo',            'Pollo desmenuzado con verdeo y morrón.',              1600, '🥟', null, null, 2),
  ('b0000000-0000-0000-0000-000000000011', 'faina-por', 'Porción de fainá', 'El clásico caballo para tu porción de muzza.', 2500, '🫓', null, 30, 0),
  ('b0000000-0000-0000-0000-000000000011', 'faina-ent', 'Fainá entera',     '8 porciones recién salidas del horno.',        8000, '🫓', null, 10, 1),
  ('b0000000-0000-0000-0000-000000000012', 'gaseosa', 'Gaseosa 1.5L',      'Coca-Cola, Sprite o Fanta. Aclaranos cuál en notas.', 4500, '🥤', null, null, 0),
  ('b0000000-0000-0000-0000-000000000012', 'agua',    'Agua mineral 1.5L', 'Con o sin gas.',                                      3000, '💧', null, null, 1),
  ('b0000000-0000-0000-0000-000000000012', 'birra',   'Cerveza 1L',        'Rubia bien helada.',                                  5500, '🍺', null, 24,   2);

