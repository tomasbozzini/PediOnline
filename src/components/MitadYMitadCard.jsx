import { useState, useMemo } from 'react'
import { fmt } from '../hooks/useCart'

export default function MitadYMitadCard({ productos, onAgregar }) {
  const [selA, setSelA] = useState(productos[0]?.slug || '')
  const [selB, setSelB] = useState(productos[1]?.slug || productos[0]?.slug || '')
  const [feedback, setFeedback] = useState(false)

  const precioA = productos.find(p => p.slug === selA)?.precio || 0
  const precioB = productos.find(p => p.slug === selB)?.precio || 0
  const precio = Math.max(precioA, precioB)

  const handleAgregar = () => {
    onAgregar(selA, selB)
    setFeedback(true)
    setTimeout(() => setFeedback(false), 1200)
  }

  return (
    <article className="card-mm">
      <div className="mm-titulo">Armá tu mitad y mitad</div>
      <div className="mm-sub">Elegí dos gustos. Se cobra el de mayor precio.</div>
      <div className="mm-selects">
        <div className="mm-mitad">
          <label>Primera mitad</label>
          <select value={selA} onChange={e => setSelA(e.target.value)}>
            {productos.map(p => (
              <option key={p.slug} value={p.slug}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="mm-mitad">
          <label>Segunda mitad</label>
          <select value={selB} onChange={e => setSelB(e.target.value)}>
            {productos.map(p => (
              <option key={p.slug} value={p.slug}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mm-pie">
        <span className="mm-precio">Precio: <b className="mm-monto">{fmt(precio)}</b></span>
        <button className={`mm-agregar${feedback ? ' agregada' : ''}`} type="button" onClick={handleAgregar}>
          {feedback ? "✓ Agregada" : "Agregar"}
        </button>
      </div>
    </article>
  )
}
