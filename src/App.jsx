import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Carta from './pages/Carta'
import Pedir from './pages/Pedir'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<Landing />} />
      <Route path="/:slug/carta" element={<Carta />} />
      <Route path="/:slug/pedir" element={<Pedir />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
