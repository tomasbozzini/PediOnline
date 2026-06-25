import { useState } from 'react'
import { fmt } from '../../hooks/useCart'
import Cant from '../../components/Cant'
import './moderno.css'

// Diseño moderno: hero header, menú en lista, carrito flotante tipo píldora.
export default function ModernoTemplate({ tenant, categorias, cart, activeTab, onTabClick, onVerPedido }) {
  const inicial = (tenant.nombre || '?').trim().charAt(0).toUpperCase()

  return (
    <>
      <div className="page mod">
        <header className="mod-hero">
          <div className="mod-logo">
            {tenant.logo_emoji ? tenant.logo_emoji : inicial}
          </div>
          <h1 className="mod-titulo">{tenant.nombre}</h1>
          {tenant.tagline && <p className="mod-tagline">{tenant.tagline}</p>}
          {tenant.badges && tenant.badges.length > 0 && (
            <div className="mod-badges">
              {tenant.badges.map((b, i) => <span key={i} className="mod-badge">{b}</span>)}
            </div>
          )}
        </header>

        <nav className="mod-nav" aria-label="Categorías">
          {categorias.map((cat, i) => (
            <button
              key={cat.slug}
              className={`mod-tab${i === activeTab ? ' activa' : ''}`}
              onClick={() => onTabClick(cat.slug, i)}
            >
              {cat.nombre}
            </button>
          ))}
        </nav>

        <main className="mod-main">
          {categorias.map(cat => (
            <section key={cat.slug} id={'sec-' + cat.slug} className="mod-sec">
              <div className="mod-sec-head">
                <span className="mod-sec-title">{cat.nombre}</span>
                {cat.sub && <span className="mod-sec-sub">{cat.sub}</span>}
              </div>

              {cat.mitad_y_mitad && (
                <ModernoMM productos={cat.productos} onAgregar={cart.agregarMM} />
              )}

              {cat.productos.map(p => (
                <div key={p.slug} className="mod-row">
                  <div className="mod-row-info">
                    <div className="mod-row-nombre">{p.nombre}</div>
                    {p.descripcion && <div className="mod-row-desc">{p.descripcion}</div>}
                  </div>
                  <div className="mod-row-side">
                    <span className="mod-precio">{fmt(p.precio)}</span>
                    <div className="mod-stepper">
                      <button className="menos" aria-label={`Quitar ${p.nombre}`} onClick={() => cart.cambiarCant(p.slug, -1)}>−</button>
                      <Cant value={cart.carrito[p.slug] || 0} />
                      <button className="mas" aria-label={`Agregar ${p.nombre}`} onClick={() => cart.cambiarCant(p.slug, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </main>

        <footer className="mod-footer">Pedidos únicamente por WhatsApp</footer>
      </div>

      <div className={`mod-cartpill${cart.totalCant > 0 ? ' visible' : ''}`}>
        <span className="mod-cartpill-resumen">
          {cart.totalCant} {cart.totalCant === 1 ? 'ítem' : 'ítems'} · {fmt(cart.totalPrecio)}
        </span>
        <button className="mod-cartpill-btn" type="button" onClick={onVerPedido}>
          Ver pedido
        </button>
      </div>
    </>
  )
}

function ModernoMM({ productos, onAgregar }) {
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
    <div className="mod-mm">
      <div className="mod-mm-titulo">Armá tu mitad y mitad</div>
      <div className="mod-mm-sub">Elegí dos gustos. Se cobra el de mayor precio.</div>
      <div className="mod-mm-selects">
        <div>
          <label>Primera mitad</label>
          <select value={selA} onChange={e => setSelA(e.target.value)}>
            {productos.map(p => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label>Segunda mitad</label>
          <select value={selB} onChange={e => setSelB(e.target.value)}>
            {productos.map(p => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="mod-mm-pie">
        <span className="mod-mm-precio">Precio: <b>{fmt(precio)}</b></span>
        <button className={`mod-mm-btn${feedback ? ' agregada' : ''}`} type="button" onClick={handleAgregar}>
          {feedback ? '✓ Agregada' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}
