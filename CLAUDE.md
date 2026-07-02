# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**PediOnline** — a multi-tenant WhatsApp ordering app for gastronomy businesses (pizzerías, etc.). A single React SPA serves many businesses ("tenants"); each one is identified by a URL slug and its menu, branding, and theme are loaded at runtime from Supabase. On checkout the order is **persisted** to Supabase (atomic per-tenant order number) and then a pre-formatted Spanish WhatsApp message — prefixed with `Pedido #NNN` — is opened via `wa.me`. Each business also has a PIN-gated admin panel to manage incoming orders and stock in real time.

Built with **React 19 + Vite 6 + React Router 7**, data in **Supabase** (Postgres, incl. Realtime + RPC functions). Icons via **lucide-react**. Plain JavaScript, no TypeScript. Styling is plain CSS with custom properties driven per-tenant (the admin panel uses inline styles instead).

> `demo.html` is the **legacy** single-file prototype (the original "Lo de Tano" page). It predates the React app and is kept for reference only — it is not part of the build and should not be the target of new work.

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

There is no test suite and no linter configured.

## Environment

Two env vars (Vite-exposed, so `VITE_` prefix) — see `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — the **anon** (public) key only. Read access is safe because RLS allows public `select` on all tables (see schema). No service-role key lives in the frontend.

`.env` is git-ignored and holds the real values.

## Architecture

### Routing (`src/main.jsx`, `src/App.jsx`)

`BrowserRouter` wraps `<App>`, which defines slug-based routes:

- `/:slug` → `Landing` — splash card with two CTAs (Pedir online / Estoy en el local).
- `/:slug/carta` → `Carta` — in-venue menu (currently a "próximamente" placeholder).
- `/:slug/pedir` → `Pedir` — the main ordering screen.
- `/admin/:slug` → `AdminPanel` — PIN-gated back office (orders + stock). **Note the slug comes _last_ here**, unlike the customer routes.
- `*` → `NotFound`.

The tenant is **the URL slug** — there are no subdomains or global config. `vercel.json` and `public/_redirects` rewrite all paths to `index.html` so client-side routing works on Vercel/Netlify.

### Data loading (`src/hooks/useTenant.js`)

`useTenant(slug)` is the single data entry point. Given a slug it:

1. Fetches the tenant row (`tenants` where `slug = …`, `.single()`).
2. Applies its theme via `applyTheme(tenant.colores, tenant.estilos)` (`src/lib/theme.js`), which writes CSS custom properties onto `document.documentElement`.
3. Fetches categories with nested products in one query (`categorias` with `productos(*)`, ordered by `orden`), then sorts each category's products by `orden`.

Returns `{ tenant, categorias, loading, error }`. Used by `Landing`, `Carta`, and `Pedir`.

### Theming (`src/lib/theme.js`)

Two tenant JSONB columns map to CSS variables, letting two businesses on the same template still feel distinct:

- `colores` → `--color-bg`, `--color-primary`, `--color-primary-dark`, `--color-secondary`, `--color-accent`, `--color-accent-dark`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-surface`.
- `estilos` → `--font-display`, `--font-body`, `--radio`, `--sombra`.

Keys a tenant omits are **removed** from the root style (not left stale) so they fall back to the `:root` defaults in `src/index.css` when navigating between tenants.

### Templates (`src/templates/`)

A tenant picks a page design via `tenants.template`. `getTemplate(name)` (`src/templates/index.js`) resolves a name to a component, defaulting to `clasico`:

- `clasico` (`ClasicoTemplate.jsx`) — header with "mantel" ribbon, photo-card grid, sticky `CategoryNav`, floating `CartBar`.
- `moderno` (`ModernoTemplate.jsx` + `moderno.css`) — hero header, list-style menu, pill-shaped floating cart. Has its own inline tab nav and half-and-half component (`ModernoMM`).
- `trattoria` (`trattoria/TrattoriaTemplate.jsx` + `trattoria.css`) — **a self-contained "storefront"**, not just a menu skin. See below.

`clasico` and `moderno` receive `{ tenant, categorias, cart, activeTab, onTabClick, onVerPedido }` from `Pedir`, render category sections with `id="sec-<categoria.slug>"` (used for scroll-spy), and delegate checkout to `Pedir`'s `OrderDrawer`.

**Storefront templates** are different: `esStorefront(name)` (in `src/templates/index.js`, backed by a `STOREFRONT` set) marks a template as owning the *entire* flow. When it returns true, `Pedir` does **not** render `OrderDrawer` — the template manages its own multi-screen navigation and checkout internally. `trattoria` uses only `{ tenant, categorias, cart }` and holds a `vista` state machine (`home → detalle → carrito → datos → confirmado`, plus a half-and-half modal). Its palette and fonts (Bodoni Moda + Hanken Grotesk) are **fixed in `trattoria.css`** (scoped under `.tr`), independent of `tenant.colores` — the brand looks the same for every tenant that picks it; `tenant.colores` still applies to `:root` and drives the (separate) admin panel. On checkout it calls `cart.guardarYEnviar` (persist + order number) exactly like `OrderDrawer`, opens `wa.me`, then `cart.vaciar()` and shows the confirmado screen with the real order number.

To add a template: create the component, register it in `src/templates/index.js`, and add its name to `STOREFRONT` if it manages its own checkout.

### Cart engine (`src/hooks/useCart.js`)

`useCart(categorias, persistKey?)` owns all order state. **Treat this as the no-touch-for-rebranding core.**

- Builds a flat `slug → producto` index and a global `slug → orden` map from the categories.
- State: `carrito` (`{ slug → cantidad }`) for catalog items, `itemsCustom` (`{ "mm:a+b" → {nombre, precio, emoji} }`) for half-and-half combos, and `entrega` (`"Delivery"` | `"Retiro"`).
- **Persistence**: if `persistKey` is passed (`Pedir` passes `pediOnline:cart:<slug>`), `carrito` + `itemsCustom` are lazily rehydrated from and mirrored to `localStorage` under that key. Omitting the key keeps the old no-persistence behavior. `vaciar()` clears both maps (used after a successful order).
- `cambiarCant(id, delta)` is the single mutation point for `carrito`; quantity clamps at 0 and deletes the key when it hits 0.
- `agregarMM(idA, idB)` registers a half-and-half combo: the id is order-independent (slugs sorted → `mm:a+b`), the price is the higher of the two halves, then it calls `cambiarCant(id, 1)`.
- `carritoOrdenado` sorts items by catalog position (`rangoItem`); combos sit at `min(posA, posB) + 0.5`.
- `getProducto(id)` resolves either a catalog item or a custom combo.
- `generarMensaje({ nombre, telefono, direccion, pago, notas })` builds the Spanish WhatsApp text. `fmt(n)` formats ARS (`$` + `es-AR` locale) and is exported for components.
- `guardarYEnviar({ nombre, telefono, direccion, pago, notas, tenant })` persists the order: it flattens `carritoOrdenado` into `pedidos_items` rows (`producto_id` = the catalog uuid, or `null` + `es_custom: true` for half-and-half combos), then calls the `crear_pedido` RPC and returns `{ numero_orden, error }`. **Stock is not touched here** — it is only decremented when the venue confirms the order in the admin panel.

### Order flow (cart → WhatsApp)

1. `Pedir` (`src/pages/Pedir.jsx`) calls `useTenant(slug)` + `useCart(categorias)`, picks the template, and renders it plus `<OrderDrawer>`. State flows by props — there is **no global store/context** for the cart.
2. Product cards call `cart.cambiarCant(slug, ±1)`; the half-and-half card calls `cart.agregarMM(a, b)`.
3. `CartBar` / the moderno pill show count + total and call `onVerPedido` → opens `OrderDrawer`. `Pedir` auto-closes the drawer when `totalCant` hits 0. `activeTab` is kept in sync with scroll (scroll-spy over the `sec-<slug>` sections).
4. `OrderDrawer` (`src/components/OrderDrawer.jsx`) lists items with steppers and a form: name, phone, Delivery/Retiro toggle (`entrega`), address (only shown for Delivery), payment, notes.
5. On send: validates name + phone (always) and address (only for Delivery), highlighting the failing field with `var(--color-primary)`. Then it `await`s `guardarYEnviar(...)` to persist the order (button shows "Enviando…", disabled while in flight). On success it prepends `Pedido #NNN` to `generarMensaje(...)` and opens `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(msg)}` in a new tab; on failure it surfaces an inline error and does **not** open WhatsApp.

### Admin panel (`src/pages/AdminPanel.jsx`, `src/hooks/useAdmin.js`)

The back office lives at `/admin/:slug` and is a **separate world** from the customer app: it's PIN-gated and styled with **inline styles** (the `S` object + a small injected `<style>`), not the per-tenant CSS variables — only branding colors (`--color-primary`) leak through via `applyTheme`.

- **Auth**: `AdminPanel` loads the tenant for branding + `pin_admin`, then compares a typed PIN against `tenant.pin_admin`. On success it sets `sessionStorage["admin_pin_<slug>"]` so a reload stays logged in. This is **cosmetic gatekeeping only** — the PIN is fetched client-side and the underlying tables are world-readable/writable via RLS; do not treat it as real access control.
- **`useAdmin(tenantId)`** owns all admin data. It loads the tenant's `pedidos` (with nested `pedidos_items`) and `productos` (joined to `categorias` for the category name, since `productos` has no `tenant_id`), and subscribes to **Supabase Realtime** on the `pedidos` table (INSERT → prepend + `nuevoPedidoId` for the beep/pulse; UPDATE → merge state changes). New-order arrival triggers a Web Audio `beep()` and a pulsing card.
- **Order lifecycle**: `pendiente → confirmado → entregado`, or `cancelado` from either active state. Confirming calls the `confirmar_pedido` RPC (see below) — the only path that decrements stock. If stock is insufficient it returns `{ ok:false, motivo:'sin_stock', faltantes }` and the panel opens a modal offering "cancel + notify the customer" (opens `wa.me` to the customer's phone with a pre-written apology, also copied to clipboard as a fallback for mistyped numbers).
- **Stock view**: edits go through the `set_stock` RPC (empty input → `null` = unlimited). Rows show Sin stock / Stock bajo (≤3) / unit count / Sin límite.

### Components (`src/components/`)

- `ProductCard` — photo card (uses `img_url`, else a striped placeholder) with price tag + stepper.
- `MitadYMitadCard` — half-and-half builder (two selects, charges the higher price).
- `CategoryNav` — horizontal sticky tab bar with scroll-spy and auto-scroll of the active tab.
- `CartBar` — fixed bottom summary bar, shown via `.visible` when `totalCant > 0`.
- `Cant` — quantity badge that "bumps" (`.bump`) on change, skipping the first render.
- `OrderDrawer` — the order drawer + form + WhatsApp send button.

## Supabase

Schema and seed live in `supabase/`. There are **no incremental migrations** and **no generated types** — `schema.sql` is the source of truth, edited by hand. Everything after the first RLS block is written **idempotently** (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS`) so re-running the file on an existing DB is safe.

### Tables (`supabase/schema.sql`)

- **`tenants`** — `id` (uuid pk), `slug` (unique), `nombre`, `tagline`, `whatsapp` (international, no `+`, e.g. `5492494123456`), `logo_url`, `logo_emoji`, `badges` (jsonb array of strings), `colores` (jsonb), `template` (text, default `'clasico'`), `estilos` (jsonb), `pin_admin` (text, default `'1234'`), `created_at`.
- **`categorias`** — `id`, `tenant_id` → `tenants` (cascade), `slug`, `nombre`, `emoji`, `sub`, `mitad_y_mitad` (bool), `orden`. Index on `(tenant_id, orden)`.
- **`productos`** — `id`, `categoria_id` → `categorias` (cascade), `slug` (short id used as the cart key, e.g. `"muzza"`), `nombre`, `descripcion`, `precio` (numeric, ARS), `emoji`, `img_url` (null = placeholder), `stock` (integer, **`null` = unlimited**, `0` = out of stock), `orden`. Index on `(categoria_id, orden)`.
- **`pedidos`** — persisted orders. `id`, `tenant_id` → `tenants`, `numero_orden` (int, unique per tenant), `nombre_cliente`, `telefono`, `entrega`, `direccion`, `pago`, `notas`, `estado` (`'pendiente'|'confirmado'|'entregado'|'cancelado'`), `total` (numeric), `mensaje_whatsapp`, `created_at`.
- **`pedidos_items`** — `id`, `pedido_id` → `pedidos` (cascade), `producto_id` → `productos` (**`on delete set null`**, and `null` for half-and-half combos), `nombre`, `cantidad`, `precio_unitario`, `es_custom` (bool — `true` for combos, which are excluded from stock accounting).
- **`tenant_order_counters`** — `tenant_id` (pk) + `ultimo_numero`; the atomic per-tenant order-number source used by `crear_pedido`.

A product's tenant is **indirect**: producto → categoria → tenant.

### RPC functions (all `security definer`)

Because the frontend only holds the public anon key, all writes go through `security definer` functions rather than direct table writes:

- **`crear_pedido(...)`** — bumps `tenant_order_counters` atomically, inserts the `pedidos` row + its `pedidos_items`, returns `{ id, numero_orden }`. Called by `useCart.guardarYEnviar`.
- **`confirmar_pedido(p_pedido_id)`** — **atomic all-or-nothing** confirmation. Locks the order + involved product rows, checks stock for **every** catalog item (combos and `null`-stock items ignored); if any falls short it changes nothing and returns `{ ok:false, error:'sin_stock', faltantes:[...] }`, otherwise decrements stock and flips the order to `confirmado`. Also guards against double-confirmation (`estado_invalido`).
- **`set_stock(p_producto_id, p_stock)`** — the only sanctioned way to edit `productos.stock` from the client (used by the admin panel).
- **`descontar_stock(...)`** — **legacy**, superseded by `confirmar_pedido`; kept but unused.

### RLS

`tenants`, `categorias`, `productos` have RLS with a public **read** policy (`for select using (true)`) and **no write policy** — catalog/branding data is loaded via seed/dashboard, and `productos.stock` is written only through `set_stock` (`security definer` bypasses RLS). `pedidos`, `pedidos_items`, `tenant_order_counters` additionally have permissive `insert`/`update`/`select` policies (`using (true)`) so the anon client can create and (for the panel) update orders. **There is no per-tenant RLS** — isolation relies entirely on app-level query filters (`slug` / `tenant_id`), and the admin PIN is client-side only. `productos` and `pedidos` are added to the `supabase_realtime` publication for the admin panel's live updates.

### Seed (`supabase/seed.sql`)

Seeds three demo tenants (run top-to-bottom; the later blocks re-add columns idempotently before assigning `template`/`estilos`/`stock`/`pin_admin`):

- `pizzeria-demo` ("Pizzería") — `clasico` template, reproduces the old `demo.html` menu. Open at `/pizzeria-demo`.
- `la-sirena` ("La Sirena Pizzería") — `moderno` template with a Playfair/Inter style override.
- `pizzeria-2` ("Pizzería 2") — `trattoria` storefront template, `pin_admin` `2222`, products seeded with mixed `stock` (some capped, some unlimited) to exercise the admin panel. Open at `/pizzeria-2` (or `/pizzeria-2/pedir`); admin at `/admin/pizzeria-2`.

## Adding a new tenant (business)

Insert rows in Supabase — no code changes needed:

1. A `tenants` row: unique `slug`, `nombre`, `whatsapp` (intl, no `+`), optional `tagline`/`logo_url`/`logo_emoji`/`badges`, a `colores` palette, `template` (`'clasico'` | `'moderno'`), optional `estilos` tokens, and a `pin_admin` (defaults to `'1234'` — set a real one). The `tenant_order_counters` row is auto-created by `crear_pedido` on the first order.
2. `categorias` rows for that `tenant_id` (set `mitad_y_mitad: true` on the category that should show the half-and-half builder; set `orden`).
3. `productos` rows for each `categoria_id` (`slug`, `precio`, `orden`; set `img_url` for real photos; leave `stock` null for unlimited, or set a number to track units).

The business is then live at `/<slug>`, and its back office at `/admin/<slug>`.
