import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import LunchPage   from './pages/LunchPage.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import CheckInPage from './pages/CheckInPage.jsx'
import { getMe } from './lib/api.js'

export default function App() {
  const [paypalClientId, setPaypalClientId] = useState('sb')
  const [paypalEnv,      setPaypalEnv]      = useState('sandbox')

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me.paypalClientId) setPaypalClientId(me.paypalClientId)
        if (me.paypalEnv)      setPaypalEnv(me.paypalEnv)
      })
      .catch(() => {})
  }, [])

  return (
    <PayPalScriptProvider options={{
      'client-id': paypalClientId,
      currency:    'EUR',
      intent:      'capture',
      components:  'buttons',
      ...(paypalEnv === 'sandbox' ? { 'buyer-country': 'NL' } : {}),
    }}>
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
