import { useState, useCallback, useMemo } from 'react'

const fmt = n => "$" + n.toLocaleString("es-AR")

export { fmt }

export function useCart(categorias) {
  const [carrito, setCarrito] = useState({})       // id -> cantidad
  const [itemsCustom, setItemsCustom] = useState({}) // id armado -> {nombre, precio, emoji}
  const [entrega, setEntrega] = useState("Delivery")

  // Índice plano de todos los productos y su orden global
  const { indiceProductos, ordenProducto } = useMemo(() => {
    const indice = {}
    const orden = {}
    let ord = 0
    categorias.forEach(cat =>
      cat.productos.forEach(p => {
        indice[p.slug] = p
        orden[p.slug] = ord++
      })
    )
    return { indiceProductos: indice, ordenProducto: orden }
  }, [categorias])

  // Resuelve un id del carrito, sea de catálogo o armado
  const getProducto = useCallback((id) => {
    return indiceProductos[id] || itemsCustom[id]
  }, [indiceProductos, itemsCustom])

  // Rango para ordenar el pedido por posición en el catálogo
  const rangoItem = useCallback((id) => {
    if (id in ordenProducto) return ordenProducto[id]
    if (id.startsWith("mm:")) {
      const [x, y] = id.slice(3).split("+")
      return Math.min(ordenProducto[x] ?? Infinity, ordenProducto[y] ?? Infinity) + 0.5
    }
    return Infinity
  }, [ordenProducto])

  // Cambiar cantidad de un ítem
  const cambiarCant = useCallback((id, delta) => {
    setCarrito(prev => {
      const next = { ...prev }
      next[id] = Math.max(0, (next[id] || 0) + delta)
      if (next[id] === 0) delete next[id]
      return next
    })
  }, [])

  // Agregar mitad y mitad
  const agregarMM = useCallback((idA, idB) => {
    const [x, y] = [idA, idB].sort()
    const id = `mm:${x}+${y}`

    setItemsCustom(prev => {
      if (prev[id]) return prev
      const a = indiceProductos[x], b = indiceProductos[y]
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
  }, [indiceProductos, cambiarCant])

  // Totales
  const { cant: totalCant, total: totalPrecio } = useMemo(() => {
    let cant = 0, total = 0
    for (const [id, c] of Object.entries(carrito)) {
      cant += c
      const p = indiceProductos[id] || itemsCustom[id]
      if (p) total += c * p.precio
    }
    return { cant, total }
  }, [carrito, indiceProductos, itemsCustom])

  // Carrito ordenado por posición en el catálogo
  const carritoOrdenado = useMemo(() => {
    return Object.entries(carrito).sort((a, b) => rangoItem(a[0]) - rangoItem(b[0]))
  }, [carrito, rangoItem])

  // Generar mensaje de WhatsApp
  const generarMensaje = useCallback(({ nombre, direccion, pago, notas }) => {
    let mensaje = "¡Hola! Quiero hacer un pedido:\n\n"
    mensaje += `Nombre: ${nombre}\n`
    mensaje += `${entrega === "Delivery" ? "Delivery — " + direccion : "Retiro en local"}\n\n`
    for (const [id, c] of carritoOrdenado) {
      const p = indiceProductos[id] || itemsCustom[id]
      if (p) mensaje += `• ${c}x ${p.nombre} — ${fmt(p.precio * c)}\n`
    }
    mensaje += `\nTotal: ${fmt(totalPrecio)}\n`
    mensaje += `Pago: ${pago}\n`
    if (notas) mensaje += `Notas: ${notas}\n`
    mensaje += `\n¿Me confirman tiempo de entrega? ¡Gracias!`
    return mensaje
  }, [carritoOrdenado, entrega, indiceProductos, itemsCustom, totalPrecio])

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
    fmt,
  }
}
