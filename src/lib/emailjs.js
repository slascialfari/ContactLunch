import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendOrderConfirmation({ name, email, orderNumber, menuTitle, items, price, date }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured — skipping confirmation email.')
    return
  }

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const templateParams = {
    to_name:      name,
    to_email:     email,
    order_number: orderNumber,
    menu_title:   menuTitle,
    menu_items:   Array.isArray(items) ? items.join(', ') : items,
    price:        `€${Number(price).toFixed(2)}`,
    lunch_date:   formattedDate,
  }

  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
}
