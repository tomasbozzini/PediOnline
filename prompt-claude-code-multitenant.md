# Prompt para Claude Code — Sistema multi-tenant de pedidos por WhatsApp

## Contexto

Tengo un archivo `pizzeria-template.html` (adjunto, en la misma carpeta) que es
una página estática 100% funcional para UN solo comercio: muestra un catálogo
por categorías, permite armar el pedido (con un caso especial de "mitad y mitad"
para pizzas), calcula el total con un carrito, y al confirmar genera un mensaje
de WhatsApp prearmado (`wa.me/...?text=...`).

Quiero convertir esto en un **sistema multi-tenant**: una sola aplicación
(React + Vite + Supabase) que sirva esta misma experiencia para MUCHOS
comercios distintos (pizzerías, hamburgueserías, cafés), donde cada comercio
tiene su propia identidad visual (colores, nombre, tagline, catálogo) cargada
dinámicamente desde la base de datos según la URL.

**Importante: usar `pizzeria-template.html` como la fuente de verdad del
diseño y del comportamiento.** Toda la lógica de carrito, el sistema de
"mitad y mitad", el drawer de pedido, el formato del mensaje de WhatsApp, el
sticky nav con tab activa según scroll, y los detalles de accesibilidad
(focus-visible, aria-labels, prefers-reduced-motion, safe-area-inset) deben
preservarse — solo migrados a componentes React.

## Stack

- React + Vite
- React Router (rutas dinámicas con `:slug`)
- Supabase (cliente JS) para tenants, categorías y productos
- CSS con variables custom (mismo sistema de theming del HTML, pero los
  valores se cargan dinámicamente por tenant en vez de estar hardcodeados)
- Deploy pensado para Netlify (incluir `_redirects` para que las rutas de la
  SPA no den 404 al refrescar)

## Modelo de datos (Supabase)

### Tabla `tenants`
- `id` (uuid, pk)
- `slug` (text, unique) — ej: `"pizzeria-demo"`, `"foster"`, `"requeterico"`
- `nombre` (text) — ej: "Pizzería"
- `tagline` (text) — ej: "pizza al molde · horno de barro · masa artesanal"
- `whatsapp` (text) — número en formato internacional sin "+", ej `"5492494123456"`
- `badges` (jsonb, array de strings) — los datos del header, ej:
  `["🕗 19:30–23:30", "🛵 Delivery", "📍 Zona centro"]`
- `colores` (jsonb) — ver mapeo de la sección "Theming dinámico"
- `created_at` (timestamp)

### Tabla `categorias`
- `id` (uuid, pk)
- `tenant_id` (uuid, fk -> tenants.id)
- `slug` (text) — ej: `"pizzas"`, `"empanadas"` (usado para anclas/ids de sección)
- `nombre` (text) — ej: "Pizzas"
- `emoji` (text)
- `sub` (text) — descripción corta debajo del título de la sección
- `mitad_y_mitad` (boolean, default false)
- `orden` (int)

### Tabla `productos`
- `id` (uuid, pk)
- `categoria_id` (uuid, fk -> categorias.id)
- `slug` (text) — id corto usado en el carrito, ej: `"muzza"`, `"napo"`
- `nombre` (text)
- `descripcion` (text)
- `precio` (numeric)
- `emoji` (text)
- `img_url` (text, nullable)
- `orden` (int)

## Theming dinámico

El HTML define estos `:root` CSS custom properties con nombres temáticos.
Renombrarlas a nombres genéricos para que cualquier tenant pueda definir su
propia paleta:

| Variable original (HTML) | Variable nueva (genérica) | Uso                              |
|---------------------------|----------------------------|-----------------------------------|
| `--marfil`                | `--color-bg`               | fondo general                    |
| `--terracota`              | `--color-primary`          | header, precios destacados, mm   |
| `--terracota-osc`          | `--color-primary-dark`     | sombras del primario              |
| `--albahaca`               | `--color-secondary`        | tabs activas, barra de carrito    |
| `--mostaza`                | `--color-accent`           | etiqueta de precio, CTA "ver pedido" |
| `--mostaza-osc`             | `--color-accent-dark`      | sombra del accent                 |
| `--cacao`                  | `--color-text`             | texto principal/títulos           |
| `--texto2`                 | `--color-text-muted`       | texto secundario                  |
| `--borde`                  | `--color-border`           | bordes suaves                     |
| `--blanco`                 | `--color-surface`          | cards                              |

El verde de WhatsApp (`#25D366` / `#1da851`) se queda **fijo**, no es parte
del theming (es la marca de WhatsApp).

`tenants.colores` en Supabase guarda un jsonb con esas 10 claves
(`bg`, `primary`, `primaryDark`, `secondary`, `accent`, `accentDark`, `text`,
`textMuted`, `border`, `surface`). Al cargar un tenant, aplicar cada valor con
`document.documentElement.style.setProperty('--color-xxx', valor)`.

Para el seed inicial, usar como tenant `"pizzeria-demo"` los mismos valores de
colores que ya están en `pizzeria-template.html`.

## Estructura de carpetas sugerida

```
src/
  lib/
    supabase.js        // cliente supabase
    theme.js           // aplicar colores del tenant como CSS vars
  hooks/
    useTenant.js        // carga tenant + categorias + productos por slug
    useCart.js          // toda la lógica de carrito portada del HTML
  components/
    ProductCard.jsx
    MitadYMitadCard.jsx
    CategoryNav.jsx      // sticky nav con tab activa por scroll
    CartBar.jsx           // barra fija inferior
    OrderDrawer.jsx        // drawer con form + botón WhatsApp
  pages/
    Landing.jsx           // /:slug -> 2 botones
    Carta.jsx             // /:slug/carta -> menú de consulta (sin carrito)
    Pedir.jsx             // /:slug/pedir -> experiencia completa del HTML
    NotFound.jsx          // tenant no encontrado
  App.jsx                 // definición de rutas
```

## Rutas y páginas

### `/:slug` — Landing
Pantalla simple con: logo/nombre del tenant, tagline, y dos botones grandes:
- **"Estoy en el local"** → navega a `/:slug/carta`
- **"Pedir online"** → navega a `/:slug/pedir`

Si el `slug` no existe en `tenants`, mostrar página de "comercio no encontrado".

### `/:slug/carta` — Carta de consulta
Mismo layout de categorías + grilla de productos que `Pedir`, pero:
- Sin steppers de cantidad
- Sin card de "armá tu mitad y mitad"
- Sin barra de carrito ni drawer
Es solo para mirar precios y descripciones (alguien que ya está en el local y
va a pedir al mozo).

### `/:slug/pedir` — Pedido online
Port completo de la experiencia interactiva de `pizzeria-template.html`:
header con tagline y badges, nav sticky con tabs por categoría, grillas de
producto con steppers, card de "mitad y mitad" si la categoría la tiene
habilitada, barra de carrito fija, y drawer con formulario (nombre, delivery
vs retiro, dirección condicional, forma de pago, notas) + botón "Enviar pedido
por WhatsApp" que abre `wa.me/{tenants.whatsapp}?text=...` con el mismo
formato de mensaje que el HTML.

## Lógica a portar 1:1 desde el HTML (a `useCart`)

- `carrito` (estado: id -> cantidad) y `itemsCustom` (ítems armados, ej.
  mitad y mitad) → `useState`
- `getProducto(id)` — resuelve producto de catálogo o de `itemsCustom`
- `rangoItem(id)` y `carritoOrdenado()` — el pedido se muestra ordenado según
  la posición del producto en el catálogo, no por orden de agregado. Los
  ítems "mitad y mitad" (`mm:{idA}+{idB}`, con `idA < idB` ordenados
  alfabéticamente) se ubican junto a las pizzas que los componen
  (`Math.min(ordenA, ordenB) + 0.5`)
- `cambiarCant(id, delta)` y `totales()`
- `agregarMM(idA, idB)` — crea el ítem combinado si no existe, calculando el
  nombre (`"Mitad X / Mitad Y"` o `"X (mitad y mitad)"` si `idA === idB`) y el
  precio (`Math.max(precioA, precioB)`)
- Generación del mensaje de WhatsApp: mismo formato de texto, mismas
  validaciones (nombre obligatorio, dirección obligatoria solo si
  `entrega === "Delivery"`)

## Cosas a preservar del HTML (UX / accesibilidad)

- Nav sticky con sombra (`.pegada`) al hacer scroll, y tab activa que sigue la
  sección visible (usar scroll listener o IntersectionObserver)
- `focus-visible` con outline en `--color-secondary`
- `aria-label` en todos los botones de stepper ("Agregar X", "Quitar X")
- `prefers-reduced-motion: reduce` desactiva transiciones/animaciones
- `env(safe-area-inset-bottom)` en la barra de carrito y en el aviso del
  drawer (para iPhones con notch)
- Placeholder de foto a rayas + texto `foto · {nombre}` cuando `img_url` es
  null; si hay `img_url`, mostrar `<img>` con `object-fit: cover`
- Tipografías: `Mulish` (texto general) y `Zilla Slab` (títulos/logo) — se
  mantienen fijas por ahora, no son parte del theming en esta primera versión

## Seed inicial

Cargar en Supabase un tenant `"pizzeria-demo"` con exactamente los datos que
ya están hardcodeados en `pizzeria-template.html` (nombre, tagline, badges,
colores, categorías "Pizzas" con `mitad_y_mitad: true`, "Empanadas", "Fainá",
"Bebidas", y todos sus productos con los mismos precios/descripciones/emojis).
Esto permite probar que la migración produce un resultado visualmente
idéntico al HTML original antes de agregar tenants nuevos.

## Cómo trabajar

Ir fase por fase, mostrándome el resultado de cada una antes de avanzar a la
siguiente:

1. Setup del proyecto (Vite + React Router + cliente Supabase + variables de
   entorno) y definición del esquema SQL de las 3 tablas
2. Seed de `"pizzeria-demo"` con los datos del HTML
3. Sistema de theming dinámico (`useTenant` + aplicar CSS vars)
4. Página `Pedir` — portar toda la lógica del HTML (la parte más grande)
5. Página `Carta` (reutilizando componentes de `Pedir` sin carrito)
6. Página `Landing` con los 2 botones
7. Manejo de tenant no encontrado + `_redirects` para Netlify

No avances a la fase siguiente sin que yo confirme que la anterior está OK.
