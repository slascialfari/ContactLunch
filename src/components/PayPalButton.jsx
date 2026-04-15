import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { createPayPalOrder, capturePayPalOrder, todayDate } from '../lib/api.js'

// guestDetails: { name, email, dietary }
// menu: { title, items, price }
// onSuccess(orderNumber): called after server confirms capture + Sheets record created
// onError(err): called on any failure
export default function PayPalButton({ menu, guestDetails, onSuccess, onError }) {
  const [{ isPending }] = usePayPalScriptReducer()

  if (isPending) {
    return <div style={styles.loading}>Loading payment…</div>
  }

  return (
    <div style={styles.wrapper}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        // Step 1: server creates the order (amount locked server-side)
        createOrder={async () => {
          try {
            return await createPayPalOrder(menu.price)
          } catch (err) {
            onError(err)
            throw err // PayPal SDK expects this to reject on failure
          }
        }}
        // Step 2: PayPal approved — server captures + records in Sheets
        onApprove={async (data) => {
          try {
            const result = await capturePayPalOrder({
              paypalOrderId: data.orderID,
              date:          todayDate(),
              name:          guestDetails.name,
              email:         guestDetails.email,
              dietary:       guestDetails.dietary || '',
              menuTitle:     menu.title,
              menuItems:     menu.items,
              price:         menu.price,
            })
            onSuccess(result.orderNumber)
          } catch (err) {
            onError(err)
          }
        }}
        onError={onError}
        onCancel={() => {}} // user dismissed popup — no action needed
      />
    </div>
  )
}

const styles = {
  wrapper: {
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    color: 'var(--chalk-muted)',
    fontFamily: 'var(--font-body)',
    padding: '1rem',
  },
}
