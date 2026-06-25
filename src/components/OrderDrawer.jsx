import { useState, useRef } from 'react'
import { fmt } from '../hooks/useCart'
import Cant from './Cant'

const WSP_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.58-.35M12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.84 9.84 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.88-9.9 9.88m8.42-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.42" />
  </svg>
)

export default function OrderDrawer({
  abierto,
  onCerrar,
  carritoOrdenado,
  getProducto,
  cambiarCant,
  totalPrecio,
  totalCant,
  entrega,
  setEntrega,
  whatsapp,
  generarMensaje,
}) {
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [pago, setPago] = useState('Efectivo')
  const [notas, setNotas] = useState('')
  const [errorNombre, setErrorNombre] = useState(false)
  const [errorDireccion, setErrorDireccion] = useState(false)
  const nombreRef = useRef(null)
  const direccionRef = useRef(null)

  const handleEnviar = () => {
    if (totalCant === 0) return

    if (!nombre.trim()) {
      setErrorNombre(true)
      nombreRef.current?.focus()
      return
    }
    if (entrega === 'Delivery' && !direccion.trim()) {
      setErrorDireccion(true)
      direccionRef.current?.focus()
      return
    }

    const mensaje = generarMensaje({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      pago,
      notas: notas.trim(),
    })

    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <>
      <div
        className={`overlay${abierto ? ' abierto' : ''}`}
        onClick={onCerrar}
      />
      <div
        className={`drawer${abierto ? ' abierto' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Tu pedido"
      >
        <div className="drawer-mantel"><div className="mantel" aria-hidden="true"></div></div>
        <div className="drawer-head">
          <h3>Tu pedido</h3>
          <button className="cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="drawer-scroll">
          {/* Lista de ítems */}
          <div>
            {carritoOrdenado.map(([id, c]) => {
              const p = getProducto(id)
              if (!p) return null
              return (
                <div key={id} className="item-pedido">
                  <div className="item-info">
                    <div className="n">{p.nombre}</div>
                    <div className="p">{fmt(p.precio * c)}</div>
                  </div>
                  <div className="stepper">
                    <button className="menos" aria-label="Quitar" onClick={() => cambiarCant(id, -1)}>−</button>
                    <Cant value={c} />
                    <button className="mas" aria-label="Agregar" onClick={() => cambiarCant(id, 1)}>+</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formulario */}
          <div className="form">
            <div className="campo">
              <label htmlFor="inpNombre">Tu nombre</label>
              <input
                id="inpNombre"
                ref={nombreRef}
                type="text"
                placeholder="Ej: Juan"
                autoComplete="name"
                value={nombre}
                onChange={e => { setNombre(e.target.value); setErrorNombre(false) }}
                style={errorNombre ? { borderColor: 'var(--color-primary)' } : undefined}
              />
            </div>

            <div className="campo">
              <label>Entrega</label>
              <div className="toggle">
                <button
                  type="button"
                  className={entrega === 'Delivery' ? 'activo' : ''}
                  onClick={() => setEntrega('Delivery')}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  className={entrega === 'Retiro' ? 'activo' : ''}
                  onClick={() => setEntrega('Retiro')}
                >
                  Retiro en local
                </button>
              </div>
            </div>

            <div className={`campo${entrega !== 'Delivery' ? ' oculto' : ''}`}>
              <label htmlFor="inpDireccion">Dirección</label>
              <input
                id="inpDireccion"
                ref={direccionRef}
                type="text"
                placeholder="Calle y número"
                autoComplete="street-address"
                value={direccion}
                onChange={e => { setDireccion(e.target.value); setErrorDireccion(false) }}
                style={errorDireccion ? { borderColor: 'var(--color-primary)' } : undefined}
              />
            </div>

            <div className="campo">
              <label htmlFor="selPago">Forma de pago</label>
              <select id="selPago" value={pago} onChange={e => setPago(e.target.value)}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta (al recibir)</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="inpNotas">Notas (opcional)</label>
              <textarea
                id="inpNotas"
                placeholder="Ej: sin aceitunas, tocar timbre B"
                value={notas}
                onChange={e => setNotas(e.target.value)}
              />
            </div>
          </div>

          {/* Total */}
          <div className="total-fila">
            <span className="t">Total</span>
            <span className="m">{fmt(totalPrecio)}</span>
          </div>

          {/* Botón WhatsApp */}
          <button className="btn-wsp" type="button" onClick={handleEnviar}>
            {WSP_ICON}
            Enviar pedido por WhatsApp
          </button>
          <p className="aviso">Se abre WhatsApp con tu pedido cargado, solo tenés que tocar enviar.</p>
        </div>
      </div>
    </>
  )
}
