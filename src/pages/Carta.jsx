import { useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'

export default function Carta() {
  const { slug } = useParams()
  const { tenant, loading, error } = useTenant(slug)

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Cargando...</p>
  if (error || !tenant) return <p style={{ textAlign: 'center', padding: '4rem' }}>Comercio no encontrado.</p>

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: "'Zilla Slab', serif", color: 'var(--color-primary)' }}>{tenant.nombre}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Carta — próximamente</p>
    </div>
  )
}
