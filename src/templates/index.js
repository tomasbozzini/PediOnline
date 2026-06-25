import ClasicoTemplate from './clasico/ClasicoTemplate'
import ModernoTemplate from './moderno/ModernoTemplate'

// Registro de diseños disponibles. El tenant elige uno con tenants.template.
const TEMPLATES = {
  clasico: ClasicoTemplate,
  moderno: ModernoTemplate,
}

export function getTemplate(nombre) {
  return TEMPLATES[nombre] || TEMPLATES.clasico
}
