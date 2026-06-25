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

export function applyTheme(colores) {
  const root = document.documentElement.style
  for (const [key, cssVar] of Object.entries(COLOR_MAP)) {
    if (colores[key]) {
      root.setProperty(cssVar, colores[key])
    }
  }
}
