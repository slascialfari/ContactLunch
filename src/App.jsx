import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import LunchPage from './pages/LunchPage.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import CheckInPage from './pages/CheckInPage.jsx'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb'

export default function App() {
  return (
    <PayPalScriptProvider
      options={{
        'client-id': PAYPAL_CLIENT_ID,
        currency: 'EUR',
        intent: 'capture',
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/lunch" element={<LunchPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="*" element={<Navigate to="/lunch" replace />} />
        </Routes>
      </BrowserRouter>
    </PayPalScriptProvider>
  )
}
