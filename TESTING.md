# Testing & Go-Live Guide

## Sandbox Testing

### Test card numbers (PayPal sandbox)
Use a sandbox buyer account from the PayPal Developer Dashboard:
1. Go to developer.paypal.com → Sandbox → Accounts
2. Use the sandbox **Personal** account email + password to log in on the PayPal checkout screen
3. Or use the hosted card fields — sandbox card: `4032039317984658`, expiry any future date, CVV any 3 digits

### iDEAL
iDEAL is a **live-only** payment method. It cannot be tested in sandbox mode.
In sandbox, only card and PayPal balance payments are available.

---

## PayPal Webhook Setup

### Register the webhook endpoint

1. Go to **developer.paypal.com** → **My Apps & Credentials** → select your app
2. Scroll to **Webhooks** → **Add Webhook**
3. Enter the webhook URL:
   ```
   https://chic-melba-971707.netlify.app/.netlify/functions/paypal-webhook
   ```
4. Select event type: **`PAYMENT.CAPTURE.COMPLETED`**
5. Save → copy the **Webhook ID** shown
6. Add to Netlify env vars:
   - `PAYPAL_WEBHOOK_ID` = the ID you just copied

### Local webhook testing with ngrok
```bash
# Install ngrok: https://ngrok.com
ngrok http 8888

# Register the ngrok URL in PayPal webhook settings:
# https://xxxx.ngrok.io/.netlify/functions/paypal-webhook
```

---

## Going Live

1. Change `PAYPAL_ENV=live` in Netlify env vars
2. Replace `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with the **Live** credentials from your PayPal app
3. Register a new webhook in the **Live** section of your PayPal app (same URL, same event)
4. Update `PAYPAL_WEBHOOK_ID` with the live webhook ID
5. Enable **iDEAL** in PayPal Business account settings under payment methods
6. Redeploy

---

## Part 4 — Webhook URL

Register this exact URL in the PayPal developer dashboard:

```
https://chic-melba-971707.netlify.app/.netlify/functions/paypal-webhook
```

Event to select: **`PAYMENT.CAPTURE.COMPLETED`**
