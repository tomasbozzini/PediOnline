import { useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const fmt = n => "$" + n.toLocaleString("es-AR")

export { fmt }

export function useCart(categorias) {
  const [carrito, setCarrito] = useState({})       // id -> cantidad
  const [itemsCustom, setItemsCustom] = useState({}) // id armado -> {nombre, precio, emoji}
  const [entrega, setEntrega] = useState("Delivery")

  // Índice plano de todos los productos (con stock) y su orden global
  const { productoPorSlug, ordenProducto } = useMemo(() => {
    const indice = {}
    const orden = {}
    let ord = 0
    categorias.forEach(cat =>
      cat.productos.forEach(p => {
        indice[p.slug] = p
        orden[p.slug] = ord++
      })
    )
    return { productoPorSlug: indice, ordenProducto: orden }
  }, [categorias])

  // Resuelve un id del carrito, sea de catálogo o armado
  const getProducto = useCallback((id) => {
    return productoPorSlug[id] || itemsCustom[id]
  }, [productoPorSlug, itemsCustom])

  // Rango para ordenar el pedido por posición en el catálogo
  const rangoItem = useCallback((id) => {
    if (id in ordenProducto) return ordenProducto[id]
    if (id.startsWith("mm:")) {
      const [x, y] = id.slice(3).split("+")
      return Math.min(ordenProducto[x] ?? Infinity, ordenProducto[y] ?? Infinity) + 0.5
    }
    return Infinity
  }, [ordenProducto])

  // Cambiar cantidad de un ítem.
  // Respeta el stock del producto de catálogo (stock null/undefined = sin límite;
  // los combos mitad/mitad viven en itemsCustom y no tienen stock).
  // Devuelve { ok, mensaje } para que la UI pueda dar feedback al topar el stock.
  const cambiarCant = useCallback((id, delta) => {
    const producto = productoPorSlug[id]
    if (delta > 0 && producto && producto.stock != null) {
      const actual = carrito[id] || 0
      if (actual + delta > producto.stock) {
        return { ok: false, mensaje: `Quedan ${producto.stock} disponibles` }
      }
    }

    setCarrito(prev => {
      const next = { ...prev }
      next[id] = Math.max(0, (prev[id] || 0) + delta)
      if (next[id] === 0) delete next[id]
      return next
    })

    return { ok: true }
  }, [carrito, productoPorSlug])

  // Agregar mitad y mitad
  const agregarMM = useCallback((idA, idB) => {
    const [x, y] = [idA, idB].sort()
    const id = `mm:${x}+${y}`

    setItemsCustom(prev => {
      if (prev[id]) return prev
      const a = productoPorSlug[x], b = productoPorSlug[y]
      const nombre = x === y
        ? `${a.nombre} (mitad y mitad)`
        : `Mitad ${a.nombre} / Mitad ${b.nombre}`
      return {
        ...prev,
        [id]: {
          nombre,
          precio: Math.max(a.precio, b.precio),
          emoji: "🍕"
        }
      }
    })

    cambiarCant(id, 1)
  }, [productoPorSlug, cambiarCant])

  // Totales
  const { cant: totalCant, total: totalPrecio } = useMemo(() => {
    let cant = 0, total = 0
    for (const [id, c] of Object.entries(carrito)) {
      cant += c
      const p = productoPorSlug[id] || itemsCustom[id]
      if (p) total += c * p.precio
    }
    return { cant, total }
  }, [carrito, productoPorSlug, itemsCustom])

  // Carrito ordenado por posición en el catálogo
  const carritoOrdenado = useMemo(() => {
    return Object.entries(carrito).sort((a, b) => rangoItem(a[0]) - rangoItem(b[0]))
  }, [carrito, rangoItem])

  // Generar mensaje de WhatsApp
  const generarMensaje = useCallback(({ nombre, telefono, direccion, pago, notas }) => {
    let mensaje = "¡Hola! Quiero hacer un pedido:\n\n"
    mensaje += `Nombre: ${nombre}\n`
    if (telefono) mensaje += `Tel: ${telefono}\n`
    mensaje += `${entrega === "Delivery" ? "Delivery — " + direccion : "Retiro en local"}\n\n`
    for (const [id, c] of carritoOrdenado) {
      const p = productoPorSlug[id] || itemsCustom[id]
      if (p) mensaje += `• ${c}x ${p.nombre} — ${fmt(p.precio * c)}\n`
    }
    mensaje += `\nTotal: ${fmt(totalPrecio)}\n`
    mensaje += `Pago: ${pago}\n`
    if (notas) mensaje += `Notas: ${notas}\n`
    mensaje += `\n¿Me confirman tiempo de entrega? ¡Gracias!`
    return mensaje
  }, [carritoOrdenado, entrega, productoPorSlug, itemsCustom, totalPrecio])

  // Persistir el pedido en Supabase (RPC atómica) y devolver el número de orden.
  // El stock NO se descuenta acá: se descuenta recién cuando el local confirma.
  const guardarYEnviar = useCallback(async ({ nombre, telefono, direccion, pago, notas, tenant }) => {
    const items = []
    for (const [id, c] of carritoOrdenado) {
      const catalog = productoPorSlug[id]
      const p = catalog || itemsCustom[id]
      if (!p) continue
      items.push({
        producto_id: catalog ? catalog.id : null, // uuid real, o null si es combo
        nombre: p.nombre,
        cantidad: c,
        precio_unitario: p.precio,
        es_custom: !catalog,
      })
    }

    const mensaje = generarMensaje({ nombre, telefono, direccion, pago, notas })

    const { data, error } = await supabase.rpc('crear_pedido', {
      p_tenant_id: tenant.id,
      p_nombre_cliente: nombre,
      p_telefono: telefono || null,
      p_entrega: entrega,
      p_direccion: direccion || null,
      p_pago: pago,
      p_notas: notas || null,
      p_total: totalPrecio,
      p_mensaje_whatsapp: mensaje,
      p_items: items,
    })

    if (error) return { numero_orden: null, error }
    return { numero_orden: data?.numero_orden ?? null, error: null }
  }, [carritoOrdenado, productoPorSlug, itemsCustom, generarMensaje, entrega, totalPrecio])

  return {
    carrito,
    itemsCustom,
    entrega,
    setEntrega,
    cambiarCant,
    agregarMM,
    getProducto,
    totalCant,
    totalPrecio,
    carritoOrdenado,
    generarMensaje,
    guardarYEnviar,
    fmt,
  }
}
