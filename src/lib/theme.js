// Colores -> variables CSS (cada tenant define su paleta en tenants.colores)
const COLOR_MAP = {
  bg:          '--color-bg',
  primary:     '--color-primary',
  primaryDark: '--color-primary-dark',
  secondary:   '--color-secondary',
  accent:      '--color-accent',
  accentDark:  '--color-accent-dark',
  text:        '--color-text',
  textMuted:   '--color-text-muted',
  border:      '--color-border',
  surface:     '--color-surface',
}

// Tokens de estilo -> variables CSS (tenants.estilos). Permiten que dos locales
// con el mismo template igual se sientan distintos (tipografía, redondeos, sombras).
const ESTILO_MAP = {
  fontDisplay: '--font-display',  // títulos, ej: "'Playfair Display', serif"
  fontBody:    '--font-body',     // texto, ej: "'Inter', sans-serif"
  radio:       '--radio',         // redondeo base de cards/botones, ej: "20px"
  sombra:      '--sombra',        // sombra de las cards, ej: "0 20px 50px -30px rgba(0,0,0,.4)"
}

function applyMap(obj, map) {
  const root = document.documentElement.style
  const data = obj || {}
  for (const [key, cssVar] of Object.entries(map)) {
    // Si el tenant no define la clave, se limpia para que vuelva al default
    // del :root (evita que el valor de otro local quede "pegado" al navegar).
    if (data[key]) root.setProperty(cssVar, data[key])
    else root.removeProperty(cssVar)
  }
}

export function applyTheme(colores, estilos) {
  applyMap(colores, COLOR_MAP)
  applyMap(estilos, ESTILO_MAP)
}
