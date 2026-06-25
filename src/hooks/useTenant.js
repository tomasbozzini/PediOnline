import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { applyTheme } from '../lib/theme'

export function useTenant(slug) {
  const [tenant, setTenant] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

      // 2. Aplicar theming
      if (t.colores) applyTheme(t.colores)

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

  return { tenant, categorias, loading, error }
}
