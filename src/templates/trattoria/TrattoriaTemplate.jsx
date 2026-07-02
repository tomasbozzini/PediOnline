import { useState, useEffect, useMemo } from 'react'
import { fmt } from '../../hooks/useCart'
import './trattoria.css'

// ============================================================
// Template "trattoria" — storefront de una página (mobile-first).
// Maneja todo el flujo internamente con estado de vista:
//   home → detalle → home → carrito → datos → (WhatsApp) → confirmado
// Reutiliza el cart (useCart) y guardarYEnviar del pipeline existente.
// ============================================================

const scrollA = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function TrattoriaTemplate({ tenant, categorias, cart }) {
  const [vista, setVista] = useState('home')   // home | detalle | carrito | datos | confirmado
  const [productoActivo, setProductoActivo] = useState(null)  // slug
  const [mmAbierto, setMmAbierto] = useState(false)
  const [nota, setNota] = useState('')
  const [numeroOrden, setNumeroOrden] = useState(null)

  // Mapa slug -> nombre de categoría (para el badge del detalle)
  const catDeProducto = useMemo(() => {
    const m = {}
    categorias.forEach(c => (c.productos || []).forEach(p => { m[p.slug] = c.nombre }))
    return m
  }, [categorias])

  // Categoría de pizzas (para armador mitad y mitad + especiales)
  const pizzasCat = useMemo(
    () => categorias.find(c => c.mitad_y_mitad) || categorias[0],
    [categorias]
  )
  const especiales = useMemo(
    () => [...(pizzasCat?.productos || [])].sort((a, b) => b.precio - a.precio).slice(0, 2),
    [pizzasCat]
  )

  // Scroll al tope al cambiar de pantalla
  useEffect(() => { window.scrollTo(0, 0) }, [vista])

  const abrirDetalle = (slug) => { setProductoActivo(slug); setVista('detalle') }

  if (vista === 'detalle' && productoActivo) {
    return (
      <div className="tr">
        <div className="tr-shell">
          <Detalle
            producto={cart.getProducto(productoActivo)}
            categoria={catDeProducto[productoActivo]}
            cart={cart}
            slug={productoActivo}
            onVolver={() => setVista('home')}
          />
        </div>
      </div>
    )
  }

  if (vista === 'carrito') {
    return (
      <div className="tr">
        <div className="tr-shell">
          <Carrito
            cart={cart}
            nota={nota}
            setNota={setNota}
            onVolver={() => setVista('home')}
            onContinuar={() => setVista('datos')}
          />
        </div>
      </div>
    )
  }

  if (vista === 'datos') {
    return (
      <div className="tr">
        <div className="tr-shell">
          <Datos
            cart={cart}
            tenant={tenant}
            nota={nota}
            onVolver={() => setVista('carrito')}
            onConfirmado={(num) => { setNumeroOrden(num); setNota(''); setVista('confirmado') }}
          />
        </div>
      </div>
    )
  }

  if (vista === 'confirmado') {
    return (
      <div className="tr">
        <div className="tr-shell">
          <Confirmado numero={numeroOrden} onInicio={() => setVista('home')} />
        </div>
      </div>
    )
  }

  // ---------------- HOME ----------------
  return (
    <div className="tr">
      <div className="tr-shell">
        {/* NAV translúcida */}
        <nav className="tr-nav">
          <span className="tr-nav-logo">{tenant.nombre}</span>
          <button className="tr-nav-menu" aria-label="Menú" onClick={() => scrollA('tr-menu')}>☰</button>
        </nav>

        {/* HERO */}
        <header
          className="tr-hero"
          style={tenant.logo_url ? { backgroundImage: `url(${tenant.logo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div className="tr-hero-inner">
            <span className="tr-eyebrow">Desde 1998 · Horno de barro</span>
            <h1 className="tr-hero-title">La pizza de siempre, como en casa</h1>
            <p className="tr-hero-sub">
              {tenant.tagline || 'Masa artesanal, salsa de tomate natural y el horno prendido todas las noches.'}
            </p>
            <div className="tr-hero-cta">
              <button className="tr-btn tr-btn-olive tr-btn-block" onClick={() => scrollA('tr-menu')}>Ver el menú ↓</button>
              <button className="tr-btn tr-btn-ghost tr-btn-block" onClick={() => scrollA('tr-historia')}>Nuestra historia</button>
            </div>
          </div>
        </header>

        {/* FILA DE CONFIANZA */}
        <div className="tr-trust">
          <div className="tr-trust-item">
            <div className="tr-trust-num">★ 4.9</div>
            <span className="tr-trust-lbl">+2.000 reseñas</span>
          </div>
          <div className="tr-trust-item">
            <div className="tr-trust-num">30'</div>
            <span className="tr-trust-lbl">promedio</span>
          </div>
          <div className="tr-trust-item">
            <div className="tr-trust-num">🛵</div>
            <span className="tr-trust-lbl">envío gratis</span>
          </div>
        </div>

        {/* HISTORIA */}
        <section className="tr-block tr-block-historia" id="tr-historia">
          <span className="tr-eyebrow" style={{ color: 'var(--tomato)' }}>Nuestra historia</span>
          <p>
            Hace más de 25 años que amasamos con la receta de la nonna. Cada pizza pasa por
            nuestro horno de barro, esa es la diferencia que se siente en el primer bocado.
          </p>
        </section>

        {/* MENÚ — franjas por categoría */}
        <div id="tr-menu">
          {categorias.map((cat, idx) => (
            <div key={cat.slug}>
              <section className="tr-block" id={'sec-' + cat.slug}>
                <div className="tr-sec-head">
                  <div>
                    <h2 className="tr-sec-title">{cat.nombre}</h2>
                    {cat.sub && <div className="tr-sec-sub">{cat.sub}</div>}
                  </div>
                </div>
                <div className="tr-grid">
                  {cat.mitad_y_mitad && (
                    <button className="tr-mm-card" onClick={() => setMmAbierto(true)}>
                      <span className="tr-mm-emoji">🍕</span>
                      <span className="tr-mm-txt">
                        <b>Mitad y mitad</b>
                        <span>Combiná dos gustos en una pizza</span>
                      </span>
                      <span className="tr-mm-go">Armar</span>
                    </button>
                  )}
                  {cat.productos.map(p => (
                    <ProductoCard key={p.slug} producto={p} cart={cart} onAbrir={() => abrirDetalle(p.slug)} />
                  ))}
                </div>
              </section>

              {/* Banda oscura "especiales" después de las pizzas */}
              {cat.slug === pizzasCat?.slug && especiales.length > 0 && (
                <section className="tr-band">
                  <div className="tr-sec-head">
                    <div>
                      <span className="tr-eyebrow">De autor</span>
                      <h2 className="tr-sec-title">Las especiales</h2>
                    </div>
                  </div>
                  <div className="tr-band-grid">
                    {especiales.map(p => (
                      <div key={p.slug} className="tr-band-card">
                        <div
                          className="tr-band-img"
                          style={p.img_url ? { backgroundImage: `url(${p.img_url})` } : undefined}
                        >
                          <button
                            className="tr-band-add"
                            aria-label={'Agregar ' + p.nombre}
                            disabled={p.stock === 0}
                            onClick={() => cart.cambiarCant(p.slug, 1)}
                          >+</button>
                        </div>
                        <div className="tr-band-body">
                          <div className="tr-band-name">{p.nombre}</div>
                          <span className="tr-band-price">{fmt(p.precio)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ))}
        </div>

        {/* CONTACTO */}
        <section className="tr-contacto">
          <span className="tr-eyebrow" style={{ color: 'var(--tomato)' }}>Encontranos</span>
          <div style={{ marginTop: '.75rem' }}>
            {(tenant.badges || []).map((b, i) => (
              <div key={i} className="tr-contacto-row">{b}</div>
            ))}
            {tenant.whatsapp && (
              <div className="tr-contacto-row"><span>📞</span> +{tenant.whatsapp}</div>
            )}
          </div>
        </section>

        {/* CTA flotante */}
        <div className="tr-fab">
          {cart.totalCant > 0 ? (
            <button className="tr-btn tr-btn-wa tr-btn-block" onClick={() => setVista('carrito')}>
              Ver mi pedido · {cart.totalCant} · {fmt(cart.totalPrecio)} ➤
            </button>
          ) : (
            <button className="tr-btn tr-btn-wa tr-btn-block" onClick={() => scrollA('tr-menu')}>
              Pedir por WhatsApp ➤
            </button>
          )}
        </div>

        {mmAbierto && (
          <MMModal productos={pizzasCat?.productos || []} cart={cart} onCerrar={() => setMmAbierto(false)} />
        )}
      </div>
    </div>
  )
}

// ---------------- Card de producto (home) ----------------
function ProductoCard({ producto, cart, onAbrir }) {
  const cantidad = cart.carrito[producto.slug] || 0
  const agotado = producto.stock === 0
  return (
    <button className="tr-card" onClick={onAbrir}>
      <div
        className="tr-card-img"
        style={producto.img_url ? { backgroundImage: `url(${producto.img_url})` } : undefined}
      >
        <button
          className="tr-card-add"
          aria-label={'Agregar ' + producto.nombre}
          disabled={agotado}
          onClick={(e) => { e.stopPropagation(); cart.cambiarCant(producto.slug, 1) }}
        >+</button>
      </div>
      <div className="tr-card-body">
        <span className="tr-card-name">{producto.nombre}</span>
        <span className="tr-card-price">{fmt(producto.precio)}</span>
        {agotado
          ? <span className="tr-agotado">Agotado</span>
          : cantidad > 0 && <span className="tr-card-qty">{cantidad} en el pedido</span>}
      </div>
    </button>
  )
}

// ---------------- Detalle de producto ----------------
function Detalle({ producto, categoria, cart, slug, onVolver }) {
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState('')

  if (!producto) {
    return (
      <div className="tr-screen">
        <div className="tr-topbar">
          <button className="tr-back" aria-label="Volver" onClick={onVolver}>←</button>
          <h2>Producto no disponible</h2>
        </div>
      </div>
    )
  }

  const enCarrito = cart.carrito[slug] || 0
  const stock = producto.stock
  const topeAlcanzado = stock != null && enCarrito + qty >= stock

  const anadir = () => {
    const r = cart.cambiarCant(slug, qty)
    if (!r.ok) { setMsg(r.mensaje || 'Sin stock suficiente'); return }
    onVolver()
  }

  return (
    <div className="tr-screen">
      <div
        className="tr-detalle-hero"
        style={producto.img_url ? { backgroundImage: `url(${producto.img_url})` } : undefined}
      >
        <button className="tr-detalle-circ back" aria-label="Volver" onClick={onVolver}>←</button>
        <button className="tr-detalle-circ fav" aria-label="Favorito">♡</button>
      </div>
      <div className="tr-detalle-body">
        {categoria && <span className="tr-badge">{categoria}</span>}
        <h1 className="tr-detalle-name">{producto.nombre}</h1>
        <div className="tr-detalle-meta">★ 4.9 · 30–40 min · recién horneada</div>
        {producto.descripcion && <p className="tr-detalle-desc">{producto.descripcion}</p>}
        {stock === 0 && <p className="tr-error-msg" style={{ marginTop: '1rem' }}>Sin stock por ahora</p>}
        {msg && <p className="tr-error-msg" style={{ marginTop: '1rem' }}>{msg}</p>}
      </div>

      <div className="tr-actionbar">
        <div className="tr-stepper">
          <button aria-label="Menos" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span className="val">{qty}</span>
          <button aria-label="Más" disabled={topeAlcanzado} onClick={() => setQty(q => q + 1)}>+</button>
        </div>
        <button className="tr-btn tr-btn-olive" style={{ flex: 1 }} disabled={stock === 0} onClick={anadir}>
          Añadir · {fmt(producto.precio * qty)}
        </button>
      </div>
    </div>
  )
}

// ---------------- Carrito ----------------
function Carrito({ cart, nota, setNota, onVolver, onContinuar }) {
  const vacio = cart.carritoOrdenado.length === 0
  return (
    <div className="tr-screen">
      <div className="tr-topbar">
        <button className="tr-back" aria-label="Volver" onClick={onVolver}>←</button>
        <h2>Tu pedido</h2>
      </div>

      {vacio ? (
        <div className="tr-cart-empty">Tu pedido está vacío.<br />Sumá algo rico del menú 🍕</div>
      ) : (
        <>
          <div className="tr-cart-list">
            {cart.carritoOrdenado.map(([id, c]) => {
              const p = cart.getProducto(id)
              if (!p) return null
              return (
                <div key={id} className="tr-cart-item">
                  <div
                    className="tr-cart-thumb"
                    style={p.img_url ? { backgroundImage: `url(${p.img_url})` } : undefined}
                  />
                  <div className="tr-cart-info">
                    <div className="tr-cart-name">{p.nombre}</div>
                    <div className="tr-cart-sub">{fmt(p.precio * c)}</div>
                    <div className="tr-stepper" style={{ marginTop: '.4rem', width: 'fit-content' }}>
                      <button aria-label="Menos" onClick={() => cart.cambiarCant(id, -1)}>−</button>
                      <span className="val">{c}</span>
                      <button aria-label="Más" onClick={() => cart.cambiarCant(id, 1)}>+</button>
                    </div>
                  </div>
                  <button className="tr-cart-remove" aria-label="Quitar" onClick={() => cart.cambiarCant(id, -c)}>✕</button>
                </div>
              )
            })}
          </div>

          <textarea
            className="tr-cart-note"
            placeholder="✎ Agregar nota para la cocina…"
            value={nota}
            onChange={e => setNota(e.target.value)}
          />

          <div className="tr-summary">
            <div className="tr-sum-row"><span>Subtotal</span><span>{fmt(cart.totalPrecio)}</span></div>
            <div className="tr-sum-row"><span>Envío</span><span className="tr-sum-free">Gratis</span></div>
            <div className="tr-sum-total">
              <span className="lbl">Total</span>
              <span className="val">{fmt(cart.totalPrecio)}</span>
            </div>
            <button className="tr-btn tr-btn-olive tr-btn-block" onClick={onContinuar}>Continuar →</button>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------- Datos / checkout ----------------
function Datos({ cart, tenant, nota, onVolver, onConfirmado }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [pago, setPago] = useState('Efectivo')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  const entrega = cart.entrega

  const armarMensaje = (num) => {
    const n = String(num).padStart(3, '0')
    const lineas = cart.carritoOrdenado.map(([id, c]) => {
      const p = cart.getProducto(id)
      return `• ${c}x ${p.nombre} — ${fmt(c * p.precio)}`
    }).join('\n')
    let msg = `¡Hola! Quiero hacer un pedido 🍕 (Pedido #${n})\n\n`
    msg += `${lineas}\n\n`
    msg += `Total: ${fmt(cart.totalPrecio)}\n`
    msg += entrega === 'Delivery' ? `📍 ${direccion}\n` : `🛵 Retiro en el local\n`
    msg += `${pago} · ${entrega}\n`
    msg += `👤 ${nombre}${telefono ? ` · ${telefono}` : ''}`
    if (nota) msg += `\n📝 ${nota}`
    return msg
  }

  const enviar = async () => {
    if (enviando) return
    const errs = {}
    if (!nombre.trim()) errs.nombre = true
    if (!telefono.trim()) errs.telefono = true
    if (entrega === 'Delivery' && !direccion.trim()) errs.direccion = true
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setErrorEnvio('')
    setEnviando(true)

    // 1. Persistir el pedido y obtener el número de orden atómico
    const { numero_orden, error } = await cart.guardarYEnviar({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      pago,
      notas: nota.trim(),
      tenant,
    })

    if (error || !numero_orden) {
      setEnviando(false)
      setErrorEnvio('No se pudo registrar el pedido. Probá de nuevo.')
      return
    }

    // 2. Abrir WhatsApp con el mensaje armado (antes de vaciar el carrito)
    const msg = armarMensaje(numero_orden)
    window.open(`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')

    // 3. Vaciar el carrito y mostrar la confirmación
    cart.vaciar()
    setEnviando(false)
    onConfirmado(numero_orden)
  }

  return (
    <div className="tr-screen">
      <div className="tr-topbar">
        <button className="tr-back" aria-label="Volver" onClick={onVolver}>←</button>
        <h2>Tus datos</h2>
      </div>

      <div className="tr-form">
        <div className="tr-segmented">
          <button className={entrega === 'Delivery' ? 'activo' : ''} onClick={() => cart.setEntrega('Delivery')}>Delivery</button>
          <button className={entrega === 'Retiro' ? 'activo' : ''} onClick={() => cart.setEntrega('Retiro')}>Retiro</button>
        </div>

        <div className="tr-field">
          <label>Nombre</label>
          <input className={errores.nombre ? 'error' : ''} value={nombre} placeholder="Ej: Juan"
            onChange={e => { setNombre(e.target.value); setErrores(x => ({ ...x, nombre: false })) }} />
        </div>

        <div className="tr-field">
          <label>Teléfono</label>
          <input className={errores.telefono ? 'error' : ''} type="tel" value={telefono} placeholder="Ej: 2494 12-3456"
            onChange={e => { setTelefono(e.target.value); setErrores(x => ({ ...x, telefono: false })) }} />
        </div>

        {entrega === 'Delivery' && (
          <div className="tr-field">
            <label>Dirección</label>
            <input className={errores.direccion ? 'error' : ''} value={direccion} placeholder="Calle y número"
              onChange={e => { setDireccion(e.target.value); setErrores(x => ({ ...x, direccion: false })) }} />
          </div>
        )}

        <div className="tr-field">
          <label>Forma de pago</label>
          <div className="tr-pagos">
            {['Efectivo', 'Transferencia', 'Tarjeta'].map(op => (
              <button key={op} className={`tr-pago${pago === op ? ' activo' : ''}`} onClick={() => setPago(op)}>{op}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="tr-summary">
        <div className="tr-sum-total">
          <span className="lbl">Total</span>
          <span className="val">{fmt(cart.totalPrecio)}</span>
        </div>
        <button className="tr-btn tr-btn-wa tr-btn-block" disabled={enviando} onClick={enviar}>
          {enviando ? 'Enviando…' : 'Enviar por WhatsApp ➤'}
        </button>
        {errorEnvio && <p className="tr-error-msg">{errorEnvio}</p>}
      </div>
    </div>
  )
}

// ---------------- Confirmado ----------------
function Confirmado({ numero, onInicio }) {
  const num = numero != null ? String(numero).padStart(3, '0') : '—'
  return (
    <div className="tr-confirm">
      <div className="tr-check">✓</div>
      <h1>¡Pedido enviado!</h1>
      <div className="tr-confirm-num">Pedido #{num}</div>

      <div className="tr-timeline">
        <div className="tr-tl-step tr-tl-done">
          <div className="tr-tl-dot">✓</div>
          <div className="tr-tl-txt">Recibido</div>
        </div>
        <div className="tr-tl-step tr-tl-active">
          <div className="tr-tl-dot">●</div>
          <div className="tr-tl-txt">En preparación</div>
        </div>
        <div className="tr-tl-step tr-tl-pending">
          <div className="tr-tl-dot">○</div>
          <div className="tr-tl-txt">En camino</div>
        </div>
      </div>

      <button className="tr-btn tr-btn-olive tr-btn-block" style={{ maxWidth: 260 }} onClick={onInicio}>
        Volver al inicio
      </button>
    </div>
  )
}

// ---------------- Modal mitad y mitad ----------------
function MMModal({ productos, cart, onCerrar }) {
  const [a, setA] = useState(productos[0]?.slug || '')
  const [b, setB] = useState(productos[1]?.slug || productos[0]?.slug || '')

  const pa = productos.find(p => p.slug === a)
  const pb = productos.find(p => p.slug === b)
  const precio = pa && pb ? Math.max(pa.precio, pb.precio) : 0

  const agregar = () => {
    if (!a || !b) return
    cart.agregarMM(a, b)
    onCerrar()
  }

  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(42,33,26,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 40 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--paper)', width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', padding: '1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--tomato)' }}>Armá tu mitad y mitad</h2>
        <p style={{ fontSize: '.85rem', color: 'var(--muted)', margin: '.35rem 0 1.1rem' }}>
          Se cobra la de mayor valor.
        </p>

        <div className="tr-field">
          <label>Primera mitad</label>
          <select value={a} onChange={e => setA(e.target.value)} style={selectStyle}>
            {productos.map(p => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="tr-field">
          <label>Segunda mitad</label>
          <select value={b} onChange={e => setB(e.target.value)} style={selectStyle}>
            {productos.map(p => <option key={p.slug} value={p.slug}>{p.nombre}</option>)}
          </select>
        </div>

        <button className="tr-btn tr-btn-olive tr-btn-block" style={{ marginTop: '.75rem' }} onClick={agregar}>
          Agregar · {fmt(precio)}
        </button>
      </div>
    </div>
  )
}

const selectStyle = {
  width: '100%',
  minHeight: 48,
  background: 'var(--white)',
  border: '1.5px solid var(--line3)',
  borderRadius: 12,
  padding: '.7rem .9rem',
  fontFamily: 'inherit',
  fontSize: '1rem',
  color: 'var(--ink)',
}
