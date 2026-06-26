import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PEDIDO_SELECT = '*, pedidos_items(*)'

export function useAdmin(tenantId) {
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nuevoPedidoId, setNuevoPedidoId] = useState(null)

  // Trae todos los productos del tenant (con el nombre de su categoría).
  // productos no tiene tenant_id, así que se filtra por el join con categorias.
  const fetchProductos = useCallback(async () => {
    if (!tenantId) return null
    const { data, error: err } = await supabase
      .from('productos')
      .select('*, categorias!inner(nombre, tenant_id)')
      .eq('categorias.tenant_id', tenantId)
      .order('orden')
    if (err) return null
    return data || []
  }, [tenantId])

  // Carga inicial: pedidos (con items) + productos
  useEffect(() => {
    if (!tenantId) { setLoading(false); return }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [{ data: peds, error: pErr }, prods] = await Promise.all([
        supabase
          .from('pedidos')
          .select(PEDIDO_SELECT)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false }),
        fetchProductos(),
      ])

      if (cancelled) return
      if (pErr) { setError(pErr.message); setLoading(false); return }

      setPedidos(peds || [])
      setProductos(prods || [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [tenantId, fetchProductos])

  // Realtime: pedidos del tenant (alta de pedidos nuevos + cambios de estado)
  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel('pedidos-' + tenantId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos', filter: 'tenant_id=eq.' + tenantId },
        async (payload) => {
          const { data } = await supabase
            .from('pedidos').select(PEDIDO_SELECT).eq('id', payload.new.id).single()
          if (!data) return
          setPedidos(prev => prev.some(p => p.id === data.id) ? prev : [data, ...prev])
          setNuevoPedidoId(data.id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: 'tenant_id=eq.' + tenantId },
        (payload) => {
          setPedidos(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  const limpiarNuevo = useCallback(() => setNuevoPedidoId(null), [])

  // Confirmar: descuenta stock de cada ítem de catálogo (no de los combos) y
  // pasa el pedido a 'confirmado'. Refresca productos para reflejar el stock.
  const confirmarPedido = useCallback(async (pedidoId, items) => {
    for (const it of (items || [])) {
      if (!it.es_custom && it.producto_id) {
        await supabase.rpc('descontar_stock', {
          p_producto_id: it.producto_id,
          p_cantidad: it.cantidad,
        })
      }
    }

    const { error: err } = await supabase
      .from('pedidos').update({ estado: 'confirmado' }).eq('id', pedidoId)

    if (!err) {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: 'confirmado' } : p))
      const prods = await fetchProductos()
      if (prods) setProductos(prods)
    }
    return { error: err }
  }, [fetchProductos])

  const cancelarPedido = useCallback(async (pedidoId) => {
    const { error: err } = await supabase
      .from('pedidos').update({ estado: 'cancelado' }).eq('id', pedidoId)
    if (!err) {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: 'cancelado' } : p))
    }
    return { error: err }
  }, [])

  // Marcar como entregado (luego de que el local lo despachó)
  const entregarPedido = useCallback(async (pedidoId) => {
    const { error: err } = await supabase
      .from('pedidos').update({ estado: 'entregado' }).eq('id', pedidoId)
    if (!err) {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: 'entregado' } : p))
    }
    return { error: err }
  }, [])

  // Reponer/editar stock manualmente. Vacío => null (sin límite).
  const actualizarStock = useCallback(async (productoId, nuevoStock) => {
    const valor =
      nuevoStock === '' || nuevoStock === null || nuevoStock === undefined
        ? null
        : Math.max(0, Math.trunc(Number(nuevoStock)))

    // RPC SECURITY DEFINER: productos no tiene policy de UPDATE para el rol anónimo
    const { error: err } = await supabase
      .rpc('set_stock', { p_producto_id: productoId, p_stock: valor })

    if (!err) {
      setProductos(prev => prev.map(p => p.id === productoId ? { ...p, stock: valor } : p))
    }
    return { error: err }
  }, [])

  return {
    pedidos,
    productos,
    loading,
    error,
    nuevoPedidoId,
    limpiarNuevo,
    confirmarPedido,
    cancelarPedido,
    entregarPedido,
    actualizarStock,
  }
}
