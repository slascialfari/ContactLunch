import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import LunchPage from './pages/LunchPage.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import CheckInPage from './pages/CheckInPage.jsx'
import { getMe } from './lib/api.js'

// PayPal client ID and env come from the /me endpoint (set by developer, not owner).
// Falls back to 'sb' (sandbox test mode) so the app renders without crashing.
export default function App() {
  const [paypalClientId, setPaypalClientId] = useState('sb')
  const [paypalEnv, setPaypalEnv] = useState('sandbox')

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.paypalClientId) setPaypalClientId(me.paypalClientId)
        if (me.paypalEnv)      setPaypalEnv(me.paypalEnv)
      })
      .catch(() => {}) // silently ignore if functions unavailable locally
  }, [])

  return (
    <PayPalScriptProvider
      options={{
        'client-id': paypalClientId,
        currency:    'EUR',
        intent:      'capture',
        components:  'buttons',
        ...(paypalEnv === 'sandbox' ? { 'buyer-country': 'US' } : {}),
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/lunch"   element={<LunchPage />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="*"        element={<Navigate to="/lunch" replace />} />
        </Routes>
      </BrowserRouter>
    </PayPalScriptProvider>
  )
}
