import CategoryNav from '../../components/CategoryNav'
import ProductCard from '../../components/ProductCard'
import MitadYMitadCard from '../../components/MitadYMitadCard'
import CartBar from '../../components/CartBar'

// Diseño clásico: header con cinta de mantel, grilla de cards con foto.
export default function ClasicoTemplate({ tenant, categorias, cart, activeTab, onTabClick, onVerPedido }) {
  return (
    <>
      <div className="page">
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
          onTabClick={onTabClick}
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
                  <MitadYMitadCard productos={cat.productos} onAgregar={cart.agregarMM} />
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
      </div>

      <CartBar
        totalCant={cart.totalCant}
        totalPrecio={cart.totalPrecio}
        onVerPedido={onVerPedido}
      />
    </>
  )
}
