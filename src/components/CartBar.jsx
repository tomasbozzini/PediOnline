import { fmt } from '../hooks/useCart'

export default function CartBar({ totalCant, totalPrecio, onVerPedido }) {
  return (
    <div className={`barra-carrito${totalCant > 0 ? ' visible' : ''}`}>
      <div className="barra-inner">
        <span className="barra-resumen">
          {totalCant} {totalCant === 1 ? 'ítem' : 'ítems'} · {fmt(totalPrecio)}
        </span>
        <button className="btn-pedir" type="button" onClick={onVerPedido}>
          Ver pedido
        </button>
      </div>
    </div>
  )
}
