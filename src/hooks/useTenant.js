import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'

export function useTenant(slug) {
  const [tenant, setTenant] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const idsRef = useRef(new Set())

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // 1. Cargar tenant
      const { data: t, error: tErr } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (tErr || !t) {
        if (!cancelled) {
          setError(tErr?.message || 'Tenant no encontrado')
          setLoading(false)
        }
        return
      }

      // 2. Aplicar theming (colores + tokens de estilo)
      applyTheme(t.colores, t.estilos)

      // 3. Cargar categorías con productos
      const { data: cats, error: cErr } = await supabase
        .from('categorias')
        .select('*, productos(*)')
        .eq('tenant_id', t.id)
        .order('orden')

      if (cErr) {
        if (!cancelled) {
          setError(cErr.message)
          setLoading(false)
        }
        return
      }

      // Ordenar productos dentro de cada categoría
      const sorted = (cats || []).map(cat => ({
        ...cat,
        productos: (cat.productos || []).sort((a, b) => a.orden - b.orden),
      }))

      if (!cancelled) {
        setTenant(t)
        setCategorias(sorted)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  // Mantener el set de IDs de productos cargados (para filtrar los eventos Realtime)
  useEffect(() => {
    const s = new Set()
    categorias.forEach(c => (c.productos || []).forEach(p => s.add(p.id)))
    idsRef.current = s
  }, [categorias])

  // Realtime: cuando cambia un producto del tenant (p. ej. su stock), refrescarlo
  // en el estado local para que la carta del cliente se actualice en vivo.
  useEffect(() => {
    if (!tenant) return

    const channel = supabase
      .channel('productos-' + tenant.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'productos' },
        (payload) => {
          const nuevo = payload.new
          if (!nuevo || !idsRef.current.has(nuevo.id)) return
          setCategorias(prev => prev.map(cat => ({
            ...cat,
            productos: cat.productos.map(p => p.id === nuevo.id ? { ...p, ...nuevo } : p),
          })))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenant])

  return { tenant, categorias, loading, error }
}
