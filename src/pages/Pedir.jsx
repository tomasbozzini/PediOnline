import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import { useCart } from '../hooks/useCart'
import CategoryNav from '../components/CategoryNav'
import ProductCard from '../components/ProductCard'
import MitadYMitadCard from '../components/MitadYMitadCard'
import CartBar from '../components/CartBar'
import OrderDrawer from '../components/OrderDrawer'

export default function Pedir() {
  const { slug } = useParams()
  const { tenant, categorias, loading, error } = useTenant(slug)
  const cart = useCart(categorias)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  // Cerrar drawer si el carrito se vacía
  useEffect(() => {
    if (cart.totalCant === 0) setDrawerAbierto(false)
  }, [cart.totalCant])

  // Sincronizar tab activa con scroll
  useEffect(() => {
    if (categorias.length === 0) return

    const handleScroll = () => {
      const lim = window.innerHeight / 3
      let ai = 0
      categorias.forEach((cat, i) => {
        const el = document.getElementById('sec-' + cat.slug)
        if (el && el.getBoundingClientRect().top <= lim) ai = i
      })
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        ai = categorias.length - 1
      }
      setActiveTab(ai)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [categorias])

  const handleTabClick = useCallback((catSlug, index) => {
    document.getElementById('sec-' + catSlug)?.scrollIntoView({ block: 'start' })
    setActiveTab(index)
  }, [])

  const abrirDrawer = useCallback(() => {
    if (cart.totalCant > 0) setDrawerAbierto(true)
  }, [cart.totalCant])

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Cargando...</p>
  if (error || !tenant) return <p style={{ textAlign: 'center', padding: '4rem' }}>Comercio no encontrado.</p>

  return (
    <>
      <div className="mantel" aria-hidden="true" />

      <header>
        <div className="logo">{tenant.nombre}</div>
        {tenant.tagline && <p className="tagline">{tenant.tagline}</p>}
        {tenant.badges && tenant.badges.length > 0 && (
          <div className="datos">
            {tenant.badges.map((b, i) => <span key={i}>{b}</span>)}
          </div>
        )}
      </header>

      <div className="mantel" aria-hidden="true" />

      <CategoryNav
        categorias={categorias}
        activeIndex={activeTab}
        onTabClick={handleTabClick}
      />

      <main>
        {categorias.map(cat => (
          <section key={cat.slug} id={'sec-' + cat.slug}>
            <div className="sec-head">
              <h2>{cat.nombre}</h2>
              {cat.sub && <span className="sec-sub">{cat.sub}</span>}
            </div>
            <div className="grilla">
              {cat.mitad_y_mitad && (
                <MitadYMitadCard
                  productos={cat.productos}
                  onAgregar={cart.agregarMM}
                />
              )}
              {cat.productos.map(p => (
                <ProductCard
                  key={p.slug}
                  producto={p}
                  cantidad={cart.carrito[p.slug] || 0}
                  onCambiar={cart.cambiarCant}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer>Pedidos únicamente por WhatsApp</footer>

      <CartBar
        totalCant={cart.totalCant}
        totalPrecio={cart.totalPrecio}
        onVerPedido={abrirDrawer}
      />

      <OrderDrawer
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        carritoOrdenado={cart.carritoOrdenado}
        getProducto={cart.getProducto}
        cambiarCant={cart.cambiarCant}
        totalPrecio={cart.totalPrecio}
        totalCant={cart.totalCant}
        entrega={cart.entrega}
        setEntrega={cart.setEntrega}
        whatsapp={tenant.whatsapp}
        generarMensaje={cart.generarMensaje}
      />
    </>
  )
}
