import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LunchPage from './pages/LunchPage.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import CheckInPage from './pages/CheckInPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/lunch"   element={<LunchPage />} />
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="*"        element={<Navigate to="/lunch" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
