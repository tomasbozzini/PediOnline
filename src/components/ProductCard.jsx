import { fmt } from '../hooks/useCart'

export default function ProductCard({ producto, cantidad, onCambiar }) {
  const p = producto
  return (
    <article className="card">
      <div className="foto">
        {p.img_url
          ? <img src={p.img_url} alt={p.nombre} />
          : <span className="foto-ph">foto · {p.nombre.toLowerCase()}</span>
        }
        <span className="precio-tag">{fmt(p.precio)}</span>
      </div>
      <div className="card-body">
        <div className="nombre">{p.nombre}</div>
        <div className="desc">{p.descripcion}</div>
        <div className="stepper">
          <button className="menos" aria-label={`Quitar ${p.nombre}`} onClick={() => onCambiar(p.slug, -1)}>−</button>
          <span className="cant">{cantidad}</span>
          <button className="mas" aria-label={`Agregar ${p.nombre}`} onClick={() => onCambiar(p.slug, 1)}>+</button>
        </div>
      </div>
    </article>
  )
}
