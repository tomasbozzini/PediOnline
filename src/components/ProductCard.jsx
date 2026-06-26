import { useState } from 'react'
import { fmt } from '../hooks/useCart'
import Cant from './Cant'

export default function ProductCard({ producto, cantidad, onCambiar }) {
  const p = producto
  const [msg, setMsg] = useState('')

  const stock = p.stock
  const sinStock = stock === 0
  const stockBajo = stock != null && stock > 0 && stock <= 3
  const topado = stock != null && cantidad >= stock

  const handleMas = () => {
    const r = onCambiar(p.slug, 1)
    if (r && !r.ok) {
      setMsg(r.mensaje)
      setTimeout(() => setMsg(''), 1800)
    }
  }

  return (
    <article className="card">
      <div className="foto">
        {p.img_url
          ? <img src={p.img_url} alt={p.nombre} style={sinStock ? { filter: 'grayscale(.7) brightness(.85)' } : undefined} />
          : <span className="foto-ph">foto · {p.nombre.toLowerCase()}</span>
        }
        <span className="precio-tag">{fmt(p.precio)}</span>

        {sinStock && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ background: '#d62828', color: '#fff', fontWeight: 800, fontSize: '.85rem', letterSpacing: '.5px', textTransform: 'uppercase', padding: '.3rem 2.2rem', transform: 'rotate(-12deg)', boxShadow: '0 3px 10px rgba(0,0,0,.35)' }}>
              Sin stock
            </span>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="nombre">{p.nombre}</div>
        <div className="desc">{p.descripcion}</div>
        <div className="stepper">
          <button className="menos" aria-label={`Quitar ${p.nombre}`} onClick={() => onCambiar(p.slug, -1)}>−</button>
          <Cant value={cantidad} />
          <button
            className="mas"
            aria-label={`Agregar ${p.nombre}`}
            onClick={handleMas}
            disabled={sinStock || topado}
            style={(sinStock || topado) ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            +
          </button>
          {stockBajo && (
            <span style={{ marginLeft: '.5rem', background: '#f3722c', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 999, whiteSpace: 'nowrap' }}>
              Quedan {stock}
            </span>
          )}
        </div>
        {msg && <div style={{ marginTop: '.4rem', fontSize: '.78rem', color: '#d62828', fontWeight: 600 }}>{msg}</div>}
      </div>
    </article>
  )
}
