import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTenant } from '../hooks/useTenant'
import { useCart } from '../hooks/useCart'
import { getTemplate } from '../templates'
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

  // Sincronizar tab activa con scroll (los templates usan id="sec-<slug>")
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

  // Elegir el diseño según el dato del tenant
  const Template = getTemplate(tenant.template)

  return (
    <>
      <Template
        tenant={tenant}
        categorias={categorias}
        cart={cart}
        activeTab={activeTab}
        onTabClick={handleTabClick}
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
        tenant={tenant}
        guardarYEnviar={cart.guardarYEnviar}
      />
    </>
  )
}
