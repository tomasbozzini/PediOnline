import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Carta from './pages/Carta'
import Pedir from './pages/Pedir'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/:slug" element={<Landing />} />
      <Route path="/:slug/carta" element={<Carta />} />
      <Route path="/:slug/pedir" element={<Pedir />} />
      <Route path="/admin/:slug" element={<AdminPanel />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
