// Send transactional emails via the EmailJS REST API (server-side).
// The service/template/key are developer-set env vars — owner never sees them.

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send'

async function sendOrderConfirmation({ toEmail, toName, orderNumber, menuTitle, menuItems, price, lunchDate }) {
  const SERVICE_ID  = process.env.EMAILJS_SERVICE_ID
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID
  const PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS env vars not set — skipping confirmation email.')
    return
  }

  const formattedDate = new Date(lunchDate + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  const body = {
    service_id:  SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id:     PUBLIC_KEY,
    template_params: {
      to_email:     toEmail,
      to_name:      toName,
      order_number: orderNumber,
      menu_title:   menuTitle,
      menu_items:   Array.isArray(menuItems) ? menuItems.join(', ') : menuItems,
      price:        `€${Number(price).toFixed(2)}`,
      lunch_date:   formattedDate,
    },
  }

  const res = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    console.warn(`EmailJS send failed (${res.status}): ${text}`)
  }
}

module.exports = { sendOrderConfirmation }
