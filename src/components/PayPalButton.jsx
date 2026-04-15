import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'

export default function PayPalButton({ price, onSuccess, onError }) {
  const [{ isPending }] = usePayPalScriptReducer()

  if (isPending) {
    return <div style={styles.loading}>Loading payment…</div>
  }

  return (
    <div style={styles.wrapper}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: Number(price).toFixed(2),
                  currency_code: 'EUR',
                },
                description: 'Canteen lunch subscription',
              },
            ],
          })
        }}
        onApprove={async (data, actions) => {
          try {
            const details = await actions.order.capture()
            onSuccess(details.id)
          } catch (err) {
            onError(err)
          }
        }}
        onError={(err) => {
          onError(err)
        }}
        onCancel={() => {
          // User cancelled — no action needed
        }}
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
