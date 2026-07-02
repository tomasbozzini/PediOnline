import ClasicoTemplate from './clasico/ClasicoTemplate'
import ModernoTemplate from './moderno/ModernoTemplate'
import TrattoriaTemplate from './trattoria/TrattoriaTemplate'

// Registro de diseños disponibles. El tenant elige uno con tenants.template.
const TEMPLATES = {
  clasico: ClasicoTemplate,
  moderno: ModernoTemplate,
  trattoria: TrattoriaTemplate,
}

// Templates "storefront": manejan todo el flujo internamente (carta + carrito +
// checkout + confirmación) y NO usan el OrderDrawer que renderiza Pedir.
const STOREFRONT = new Set(['trattoria'])

export function getTemplate(nombre) {
  return TEMPLATES[nombre] || TEMPLATES.clasico
}

export function esStorefront(nombre) {
  return STOREFRONT.has(nombre)
}
