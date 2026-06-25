import { useEffect, useRef, useState } from 'react'

export default function CategoryNav({ categorias, activeIndex, onTabClick }) {
  const navRef = useRef(null)
  const [pegada, setPegada] = useState(false)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleScroll = () => {
      setPegada(nav.getBoundingClientRect().top <= 1)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll la tab activa a la vista
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const tabs = nav.querySelectorAll('.tab')
    const tab = tabs[activeIndex]
    if (!tab) return

    const tL = tab.offsetLeft
    const tR = tL + tab.offsetWidth
    const cL = nav.scrollLeft
    const cR = cL + nav.clientWidth

    if (tL < cL + 8) nav.scrollTo({ left: tL - 8, behavior: 'smooth' })
    else if (tR > cR - 8) nav.scrollTo({ left: tR - nav.clientWidth + 8, behavior: 'smooth' })
  }, [activeIndex])

  return (
    <nav ref={navRef} className={pegada ? 'pegada' : ''} aria-label="Categorías">
      <div className="tabs">
        {categorias.map((cat, i) => (
          <button
            key={cat.slug}
            className={`tab${i === activeIndex ? ' activa' : ''}`}
            onClick={() => onTabClick(cat.slug, i)}
          >
            {cat.nombre}
          </button>
        ))}
      </div>
    </nav>
  )
}
