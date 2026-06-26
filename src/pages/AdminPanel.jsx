import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingBag, Package, LogOut, Check, X, Truck, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'
import { useAdmin } from '../hooks/useAdmin'
import { fmt } from '../hooks/useCart'

// --- helpers ---------------------------------------------------------------

// Beep corto con Web Audio API (sin assets ni dependencias)
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
    setTimeout(() => ctx.close(), 400)
  } catch {
    /* el navegador puede bloquear audio sin interacción previa: ignorar */
  }
}

function hace(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'hace ' + Math.max(s, 0) + ' segundos'
  const m = Math.floor(s / 60)
  if (m < 60) return 'hace ' + m + (m === 1 ? ' minuto' : ' minutos')
  const h = Math.floor(m / 60)
  if (h < 24) return 'hace ' + h + (h === 1 ? ' hora' : ' horas')
  const d = Math.floor(h / 24)
  return 'hace ' + d + (d === 1 ? ' día' : ' días')
}

const padOrden = n => '#' + String(n).padStart(3, '0')

const PANEL_CSS = `
@keyframes admPulse {
  0%, 100% { box-shadow: 0 0 0 0 transparent; }
  50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 30%, transparent); }
}
.adm-card.pulse { animation: admPulse 1s ease-in-out 3; border-color: var(--color-primary) !important; }
.adm-navbtn:hover { background: #eef0f3; }
.adm-navbtn.activo { background: var(--color-primary); color: #fff; }
`

// --- estilos inline reutilizables -----------------------------------------

const S = {
  shell: { minHeight: '100dvh', display: 'flex', background: '#f4f5f7', color: '#1f2430', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #e3e6ea', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '.4rem', position: 'sticky', top: 0, height: '100dvh' },
  main: { flex: 1, padding: '2rem 2.5rem', maxWidth: 980 },
  navbtn: { display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%', padding: '.6rem .75rem', border: 'none', borderRadius: 10, background: 'transparent', color: 'inherit', fontSize: '.95rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' },
  card: { background: '#fff', border: '1px solid #e3e6ea', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1rem' },
  badge: (bg, fg) => ({ display: 'inline-block', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, background: bg, color: fg }),
  btn: (bg, fg, outline) => ({ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.5rem .9rem', borderRadius: 9, fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', background: outline ? '#fff' : bg, color: outline ? bg : fg, border: outline ? `1.5px solid ${bg}` : '1.5px solid ' + bg }),
}

function EstadoBadge({ estado }) {
  if (estado === 'confirmado') return <span style={S.badge('#dcfce7', '#15803d')}>Confirmado</span>
  if (estado === 'entregado') return <span style={S.badge('#dbeafe', '#1d4ed8')}>Entregado</span>
  if (estado === 'cancelado') return <span style={S.badge('#e5e7eb', '#6b7280')}>Cancelado</span>
  return <span style={S.badge('#fef3c7', '#b45309')}>Pendiente</span>
}

const ESTADOS_FILTRO = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'confirmado', label: 'Confirmados' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
]

// --- componente principal --------------------------------------------------

export default function AdminPanel() {
  const { slug } = useParams()
  const [tenant, setTenant] = useState(null)
  const [tLoading, setTLoading] = useState(true)
  const [tError, setTError] = useState(null)
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [vista, setVista] = useState('pedidos')
  const [, setTick] = useState(0)

  const admin = useAdmin(authed && tenant ? tenant.id : null)

  // Cargar el tenant (para PIN + branding)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setTLoading(true)
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()
      if (cancelled) return
      if (error || !data) { setTError('Comercio no encontrado'); setTLoading(false); return }
      applyTheme(data.colores, data.estilos)
      setTenant(data)
      setTLoading(false)
      if (sessionStorage.getItem('admin_pin_' + slug)) setAuthed(true)
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  // Beep + auto-limpieza del pulso cuando entra un pedido nuevo
  // (limpiarNuevo es estable, así que el efecto solo corre al cambiar el id)
  const { nuevoPedidoId, limpiarNuevo } = admin
  useEffect(() => {
    if (!nuevoPedidoId) return
    beep()
    const t = setTimeout(() => limpiarNuevo(), 4000)
    return () => clearTimeout(t)
  }, [nuevoPedidoId, limpiarNuevo])

  // Re-render periódico para refrescar los "hace X minutos"
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(i)
  }, [])

  const entrar = () => {
    if (!tenant) return
    if (pin === String(tenant.pin_admin)) {
      sessionStorage.setItem('admin_pin_' + slug, '1')
      setAuthed(true)
      setPinError('')
    } else {
      setPinError('PIN incorrecto')
    }
  }

  const salir = () => {
    sessionStorage.removeItem('admin_pin_' + slug)
    setAuthed(false)
    setPin('')
  }

  if (tLoading) return <Centro>Cargando…</Centro>
  if (tError) return <Centro>{tError}</Centro>

  if (!authed) {
    return (
      <Centro>
        <div style={{ background: '#fff', border: '1px solid #e3e6ea', borderRadius: 16, padding: '2.25rem 2rem', width: 320, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary)' }}>{tenant.nombre}</div>
          <div style={{ color: '#6b7280', fontSize: '.9rem', margin: '.35rem 0 1.5rem' }}>Panel del local</div>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError('') }}
            onKeyDown={e => { if (e.key === 'Enter') entrar() }}
            style={{ width: '100%', padding: '.7rem .9rem', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '.3em', border: '1.5px solid #d1d5db', borderRadius: 10, marginBottom: '.75rem' }}
          />
          <button onClick={entrar} style={{ ...S.btn('var(--color-primary)', '#fff'), width: '100%', justifyContent: 'center', padding: '.7rem' }}>
            Entrar
          </button>
          {pinError && <div style={{ color: '#d62828', fontSize: '.85rem', marginTop: '.75rem', fontWeight: 600 }}>{pinError}</div>}
        </div>
      </Centro>
    )
  }

  const pendientes = admin.pedidos.filter(p => p.estado === 'pendiente').length

  return (
    <div style={S.shell}>
      <style>{PANEL_CSS}</style>

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden' }}>
            {tenant.logo_url
              ? <img src={tenant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (tenant.logo_emoji || (tenant.nombre || '?').charAt(0).toUpperCase())}
          </div>
          <div style={{ fontWeight: 800, lineHeight: 1.1 }}>{tenant.nombre}</div>
        </div>

        <button className={`adm-navbtn${vista === 'pedidos' ? ' activo' : ''}`} style={S.navbtn} onClick={() => setVista('pedidos')}>
          <ShoppingBag size={18} /> Pedidos
          {pendientes > 0 && <span style={{ ...S.badge('#fef3c7', '#b45309'), marginLeft: 'auto' }}>{pendientes}</span>}
        </button>
        <button className={`adm-navbtn${vista === 'stock' ? ' activo' : ''}`} style={S.navbtn} onClick={() => setVista('stock')}>
          <Package size={18} /> Stock
        </button>

        <button className="adm-navbtn" style={{ ...S.navbtn, marginTop: 'auto', color: '#6b7280' }} onClick={salir}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {admin.loading ? (
          <p>Cargando…</p>
        ) : vista === 'pedidos' ? (
          <PedidosView admin={admin} />
        ) : (
          <StockView admin={admin} />
        )}
      </main>
    </div>
  )
}

// --- vista Pedidos ---------------------------------------------------------

function PedidosView({ admin }) {
  const [filtro, setFiltro] = useState('pendiente')

  const counts = { pendiente: 0, confirmado: 0, entregado: 0, cancelado: 0 }
  admin.pedidos.forEach(p => { if (p.estado in counts) counts[p.estado]++ })
  const visibles = admin.pedidos.filter(p => p.estado === filtro)

  return (
    <>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Pedidos</h1>

      {/* Filtro por estado */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {ESTADOS_FILTRO.map(e => {
          const activo = filtro === e.key
          return (
            <button
              key={e.key}
              onClick={() => setFiltro(e.key)}
              style={{ padding: '.45rem .9rem', borderRadius: 999, border: '1.5px solid', borderColor: activo ? 'var(--color-primary)' : '#d1d5db', background: activo ? 'var(--color-primary)' : '#fff', color: activo ? '#fff' : '#374151', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}
            >
              {e.label} ({counts[e.key]})
            </button>
          )
        })}
      </div>

      {visibles.length === 0 && <p style={{ color: '#6b7280' }}>No hay pedidos en esta categoría.</p>}

      {visibles.map(p => {
        const items = p.pedidos_items || []
        return (
          <div key={p.id} className={`adm-card${p.id === admin.nuevoPedidoId ? ' pulse' : ''}`} style={S.card}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{padOrden(p.numero_orden)}</span>
              <span style={{ fontWeight: 700 }}>{p.nombre_cliente}</span>
              <EstadoBadge estado={p.estado} />
              <span style={{ marginLeft: 'auto', color: '#9099a5', fontSize: '.82rem' }}>{hace(p.created_at)}</span>
            </div>

            {p.telefono && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', margin: '.45rem 0 0' }}>
                <Phone size={14} color="var(--color-primary)" />
                <a href={'tel:' + p.telefono} style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '.9rem', textDecoration: 'none' }}>{p.telefono}</a>
              </div>
            )}

            <div style={{ color: '#6b7280', fontSize: '.85rem', margin: '.35rem 0 .75rem' }}>
              {p.entrega}{p.entrega === 'Delivery' && p.direccion ? ` · ${p.direccion}` : ''}{p.pago ? ` · ${p.pago}` : ''}
            </div>

            <div style={{ borderTop: '1px solid #eef0f3', paddingTop: '.6rem' }}>
              {items.map(it => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', padding: '.15rem 0' }}>
                  <span>x{it.cantidad} {it.nombre}</span>
                  <span style={{ color: '#6b7280' }}>{fmt(it.precio_unitario * it.cantidad)}</span>
                </div>
              ))}
              {p.notas && <div style={{ fontSize: '.82rem', color: '#9099a5', marginTop: '.4rem' }}>Notas: {p.notas}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginTop: '.85rem' }}>
              <strong style={{ fontSize: '1.05rem' }}>Total {fmt(p.total)}</strong>

              {p.estado === 'pendiente' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
                  <button style={S.btn('#16a34a', '#fff')} onClick={() => admin.confirmarPedido(p.id, items)}>
                    <Check size={16} /> Confirmar
                  </button>
                  <button style={S.btn('#dc2626', '#fff', true)} onClick={() => admin.cancelarPedido(p.id)}>
                    <X size={16} /> Cancelar
                  </button>
                </div>
              )}

              {p.estado === 'confirmado' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
                  <button style={S.btn('#1d4ed8', '#fff')} onClick={() => admin.entregarPedido(p.id)}>
                    <Truck size={16} /> Entregado
                  </button>
                  <button style={S.btn('#dc2626', '#fff', true)} onClick={() => admin.cancelarPedido(p.id)}>
                    <X size={16} /> Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

// --- vista Stock -----------------------------------------------------------

function StockView({ admin }) {
  return (
    <>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Stock</h1>
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#f9fafb', color: '#6b7280' }}>
              <th style={{ padding: '.7rem 1rem' }}>Producto</th>
              <th style={{ padding: '.7rem 1rem' }}>Categoría</th>
              <th style={{ padding: '.7rem 1rem' }}>Estado</th>
              <th style={{ padding: '.7rem 1rem', width: 220 }}>Reponer stock</th>
            </tr>
          </thead>
          <tbody>
            {admin.productos.map(pr => (
              <StockRow key={pr.id} producto={pr} onGuardar={admin.actualizarStock} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function StockRow({ producto, onGuardar }) {
  const [valor, setValor] = useState(producto.stock ?? '')
  const [guardado, setGuardado] = useState(false)
  const [errGuardar, setErrGuardar] = useState(false)
  const stock = producto.stock

  // sincronizar si el stock cambia desde afuera (p. ej. tras confirmar un pedido)
  useEffect(() => { setValor(producto.stock ?? '') }, [producto.stock])

  const guardar = async () => {
    if (String(valor) === String(producto.stock ?? '')) return
    const { error } = await onGuardar(producto.id, valor)
    if (error) { setErrGuardar(true); return }
    setErrGuardar(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1200)
  }

  let estado
  if (stock === null || stock === undefined) estado = <span style={{ color: '#9099a5' }}>Sin límite</span>
  else if (stock === 0) estado = <span style={S.badge('#fee2e2', '#b91c1c')}>Sin stock</span>
  else if (stock <= 3) estado = <span style={S.badge('#ffedd5', '#c2410c')}>Stock bajo</span>
  else estado = <span style={{ color: '#15803d', fontWeight: 600 }}>{stock} u.</span>

  return (
    <tr style={{ borderTop: '1px solid #eef0f3' }}>
      <td style={{ padding: '.6rem 1rem', fontWeight: 600 }}>{producto.nombre}</td>
      <td style={{ padding: '.6rem 1rem', color: '#6b7280' }}>{producto.categorias?.nombre || '—'}</td>
      <td style={{ padding: '.6rem 1rem' }}>{estado}</td>
      <td style={{ padding: '.6rem 1rem' }}>
        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            placeholder="∞"
            value={valor}
            onChange={e => setValor(e.target.value)}
            onBlur={guardar}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
            style={{ width: 90, padding: '.4rem .5rem', border: '1.5px solid #d1d5db', borderRadius: 8 }}
          />
          <button style={S.btn('var(--color-primary)', '#fff')} onClick={guardar}>
            {guardado ? '✓' : 'Guardar'}
          </button>
        </div>
        {errGuardar && <div style={{ color: '#d62828', fontSize: '.72rem', fontWeight: 600, marginTop: '.25rem' }}>No se pudo guardar (falta correr set_stock)</div>}
      </td>
    </tr>
  )
}

// --- util ------------------------------------------------------------------

function Centro({ children }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7', fontFamily: 'system-ui, sans-serif', color: '#1f2430', padding: '2rem' }}>
      {children}
    </div>
  )
}
