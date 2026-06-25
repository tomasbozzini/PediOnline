import { useEffect, useRef, useState } from 'react'

// Muestra una cantidad y le da un "salto" (clase .bump) cada vez que cambia,
// sin animar en el primer render.
export default function Cant({ value }) {
  const [bump, setBump] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setBump(true)
    const t = setTimeout(() => setBump(false), 320)
    return () => clearTimeout(t)
  }, [value])

  return <span className={`cant${bump ? ' bump' : ''}`}>{value}</span>
}
