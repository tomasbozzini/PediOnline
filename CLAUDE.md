# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single-file static HTML app (`demo.html`) — a WhatsApp ordering page for a pizzeria called "Lo de Tano". No build system, no dependencies, no server. Open directly in a browser.

## Architecture

Everything lives in `demo.html` in three clearly separated blocks:

1. **CSS** (`<style>`) — uses CSS custom properties defined in `:root` with pizza-themed Spanish names:
   - `--marfil` (cream background), `--terracota` (primary/header red), `--albahaca` (green accent), `--mostaza` (gold/CTA), `--cacao` (dark titles), `--texto2` (secondary text), `--borde` (subtle borders), `--blanco` (card backgrounds)
   - Responsive grid at 540px breakpoint; sticky tab nav; fixed bottom cart bar.

2. **HTML** — static shell only; the menu grid and tab bar are injected at runtime by JS.

3. **JavaScript** (`<script>`) — three zones, explicitly marked with comments:
   - `CONFIG` — business name and WhatsApp number (the only two fields to change for rebranding).
   - `CATALOGO` — array of category objects, each with a `productos` array. Fields: `id`, `nombre`, `emoji`, `desc`, `precio` (ARS integer), `img` (null or image URL). A product with `mitadYMitad: true` renders a half-and-half pizza builder card instead of a regular product card.
   - **Cart engine** — marked "no tocar para rebrandear". Manages two state objects: `carrito` (`id → quantity`) for catalog items and `itemsCustom` (array of half-and-half combos). Renders cards and the order drawer, and builds the WhatsApp `wa.me` URL with a pre-formatted Spanish message.

## Key behaviors

- `renderMenu()` builds the tab bar and product grid from `CATALOGO` on page load.
- `cambiarCant(id, delta)` is the single mutation point for `carrito` state; always calls `actualizarUI()` after.
- `agregarMM(idA, idB)` adds a half-and-half combo to `itemsCustom`; the combo ID is order-independent (`mm:a+b`), and the price is the higher of the two pizza prices.
- `actualizarUI()` is the central reconciler — updates counts, totals, and visibility for all UI elements.
- The floating cart bar (`#barraCarrito`) shows/hides via the `.visible` class based on total quantity.
- The order drawer closes automatically when the cart empties.
- The WhatsApp send button validates name (always) and address (only when delivery is selected), highlighting the field with a `--terracota` border on failure.
- Delivery/pickup toggle controls visibility of `#campoDireccion` via `.oculto`.

## To rebrand for a different business

1. Update `CONFIG.nombre` and `CONFIG.telefono` (international format, no `+`, e.g. `5492494123456`).
2. Replace the `CATALOGO` array with the new menu.
3. To use real photos: set `img: "path/to/image.jpg"` on a product — the card `<img>` is already wired up.
