export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
        Página no encontrada.
      </p>
    </div>
  )
}
