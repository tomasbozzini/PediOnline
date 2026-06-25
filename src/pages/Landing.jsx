import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { useTenant } from '../hooks/useTenant'

export default function Landing() {
  const { slug } = useParams()
  const { tenant, loading, error } = useTenant(slug)

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Cargando...</p>
  if (error || !tenant) return <NotFoundMsg />

  const inicial = (tenant.nombre || '?').trim().charAt(0).toUpperCase()

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.25rem',
      background: 'var(--color-bg)',
    }}>
      <main style={{
        width: '100%',
        maxWidth: '370px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        padding: '2.5rem 1.75rem',
        boxShadow: '0 24px 60px -32px rgba(0, 0, 0, .35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 6px 18px -8px var(--color-primary-dark)',
        }}>
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : tenant.logo_emoji ? (
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{tenant.logo_emoji}</span>
          ) : (
            <span style={{
              fontFamily: "'Zilla Slab', serif",
              fontWeight: 700,
              fontSize: '1.9rem',
              lineHeight: 1,
              color: 'var(--color-surface)',
            }}>
              {inicial}
            </span>
          )}
        </div>

        {/* Título + tagline */}
        <h1 style={{
          fontFamily: "'Zilla Slab', serif",
          fontSize: '2rem',
          lineHeight: 1.1,
          color: 'var(--color-primary)',
          marginTop: '1.1rem',
        }}>
          {tenant.nombre}
        </h1>
        {tenant.tagline && (
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: '.95rem',
            lineHeight: 1.45,
            marginTop: '.5rem',
          }}>
            {tenant.tagline}
          </p>
        )}

        {/* Acciones */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          width: '100%',
          marginTop: '2rem',
        }}>
          <Accion
            to={`/${slug}/pedir`}
            icon={<ShoppingBag size={20} strokeWidth={2.4} />}
            label="Pedir online"
            microcopy="Delivery o retiro, armás tu pedido acá"
            variant="primary"
          />
          <Accion
            to={`/${slug}/carta`}
            icon={<UtensilsCrossed size={20} strokeWidth={2.4} />}
            label="Estoy en el local"
            microcopy="¿Escaneaste el QR de tu mesa? Mirá la carta"
            variant="secondary"
          />
        </div>
      </main>
    </div>
  )
}

function Accion({ to, icon, label, microcopy, variant }) {
  const isPrimary = variant === 'primary'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
      <Link
        to={to}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '.6rem',
          padding: '.95rem 1rem',
          borderRadius: '14px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1.05rem',
          background: isPrimary ? 'var(--color-secondary)' : 'var(--color-surface)',
          color: isPrimary ? 'var(--color-bg)' : 'var(--color-primary)',
          border: isPrimary ? '2px solid var(--color-secondary)' : '2px solid var(--color-primary)',
          boxShadow: isPrimary ? '0 10px 24px -14px var(--color-secondary)' : 'none',
        }}
      >
        {icon}
        {label}
      </Link>
      <span style={{
        fontSize: '.8rem',
        color: 'var(--color-text-muted)',
        lineHeight: 1.35,
      }}>
        {microcopy}
      </span>
    </div>
  )
}

function NotFoundMsg() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Comercio no encontrado.</p>
    </div>
  )
}
