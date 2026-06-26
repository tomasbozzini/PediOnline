# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**PediOnline** — a multi-tenant WhatsApp ordering app for gastronomy businesses (pizzerías, etc.). A single React SPA serves many businesses ("tenants"); each one is identified by a URL slug and its menu, branding, and theme are loaded at runtime from Supabase. The order is never persisted: the app builds a pre-formatted Spanish WhatsApp message and opens `wa.me`.

Built with **React 19 + Vite 6 + React Router 7**, data in **Supabase** (Postgres). Plain JavaScript, no TypeScript. Styling is plain CSS with custom properties driven per-tenant.

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

Both templates receive the same props from `Pedir`: `{ tenant, categorias, cart, activeTab, onTabClick, onVerPedido }`, and both render category sections with `id="sec-<categoria.slug>"` (used for scroll-spy).

To add a template: create the component and register it in `src/templates/index.js`.

### Cart engine (`src/hooks/useCart.js`)

`useCart(categorias)` owns all order state. **Treat this as the no-touch-for-rebranding core.**

- Builds a flat `slug → producto` index and a global `slug → orden` map from the categories.
- State: `carrito` (`{ slug → cantidad }`) for catalog items, `itemsCustom` (`{ "mm:a+b" → {nombre, precio, emoji} }`) for half-and-half combos, and `entrega` (`"Delivery"` | `"Retiro"`).
- `cambiarCant(id, delta)` is the single mutation point for `carrito`; quantity clamps at 0 and deletes the key when it hits 0.
- `agregarMM(idA, idB)` registers a half-and-half combo: the id is order-independent (slugs sorted → `mm:a+b`), the price is the higher of the two halves, then it calls `cambiarCant(id, 1)`.
- `carritoOrdenado` sorts items by catalog position (`rangoItem`); combos sit at `min(posA, posB) + 0.5`.
- `getProducto(id)` resolves either a catalog item or a custom combo.
- `generarMensaje({ nombre, direccion, pago, notas })` builds the Spanish WhatsApp text. `fmt(n)` formats ARS (`$` + `es-AR` locale) and is exported for components.

### Order flow (cart → WhatsApp)

1. `Pedir` (`src/pages/Pedir.jsx`) calls `useTenant(slug)` + `useCart(categorias)`, picks the template, and renders it plus `<OrderDrawer>`. State flows by props — there is **no global store/context** for the cart.
2. Product cards call `cart.cambiarCant(slug, ±1)`; the half-and-half card calls `cart.agregarMM(a, b)`.
3. `CartBar` / the moderno pill show count + total and call `onVerPedido` → opens `OrderDrawer`. `Pedir` auto-closes the drawer when `totalCant` hits 0. `activeTab` is kept in sync with scroll (scroll-spy over the `sec-<slug>` sections).
4. `OrderDrawer` (`src/components/OrderDrawer.jsx`) lists items with steppers and a form: name, Delivery/Retiro toggle (`entrega`), address (only shown for Delivery), payment, notes.
5. On send: validates name (always) and address (only for Delivery), highlighting the failing field with `var(--color-primary)`. Then `generarMensaje(...)` builds the text and it opens `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(msg)}` in a new tab.

### Components (`src/components/`)

- `ProductCard` — photo card (uses `img_url`, else a striped placeholder) with price tag + stepper.
- `MitadYMitadCard` — half-and-half builder (two selects, charges the higher price).
- `CategoryNav` — horizontal sticky tab bar with scroll-spy and auto-scroll of the active tab.
- `CartBar` — fixed bottom summary bar, shown via `.visible` when `totalCant > 0`.
- `Cant` — quantity badge that "bumps" (`.bump`) on change, skipping the first render.
- `OrderDrawer` — the order drawer + form + WhatsApp send button.

## Supabase

Schema and seed live in `supabase/`. There are **no incremental migrations** and **no generated types** — `schema.sql` is the source of truth, edited by hand.

### Tables (`supabase/schema.sql`)

- **`tenants`** — `id` (uuid pk), `slug` (unique), `nombre`, `tagline`, `whatsapp` (international, no `+`, e.g. `5492494123456`), `logo_url`, `logo_emoji`, `badges` (jsonb array of strings), `colores` (jsonb), `template` (text, default `'clasico'`), `estilos` (jsonb), `created_at`.
- **`categorias`** — `id`, `tenant_id` → `tenants` (cascade), `slug`, `nombre`, `emoji`, `sub`, `mitad_y_mitad` (bool), `orden`. Index on `(tenant_id, orden)`.
- **`productos`** — `id`, `categoria_id` → `categorias` (cascade), `slug` (short id used as the cart key, e.g. `"muzza"`), `nombre`, `descripcion`, `precio` (numeric, ARS), `emoji`, `img_url` (null = placeholder), `orden`. Index on `(categoria_id, orden)`.

A product's tenant is **indirect**: producto → categoria → tenant.

### RLS

All three tables have RLS enabled with a public read policy (`for select using (true)`). There are **no write policies** — data is loaded via seed/dashboard with the service role. Tenant data isolation in the app relies on query filters (`slug` / `tenant_id`), **not** on per-tenant RLS.

### Seed (`supabase/seed.sql`)

Seeds one tenant, `pizzeria-demo` ("Pizzería"), reproducing the old `demo.html` menu (pizzas with half-and-half, empanadas, fainá, bebidas). Open it at `/pizzeria-demo`.

## Adding a new tenant (business)

Insert rows in Supabase — no code changes needed:

1. A `tenants` row: unique `slug`, `nombre`, `whatsapp` (intl, no `+`), optional `tagline`/`logo_url`/`logo_emoji`/`badges`, a `colores` palette, `template` (`'clasico'` | `'moderno'`), and optional `estilos` tokens.
2. `categorias` rows for that `tenant_id` (set `mitad_y_mitad: true` on the category that should show the half-and-half builder; set `orden`).
3. `productos` rows for each `categoria_id` (`slug`, `precio`, `orden`; set `img_url` for real photos).

The business is then live at `/<slug>`.
