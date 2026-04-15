# The Daily Lunch — Developer Setup Guide

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Guest menu/order UI, manager dashboard, check-in view |
| Backend | Netlify Functions (Node.js) | All API logic: auth, Sheets ops, PayPal capture |
| Database | Google Sheets (owner's Drive) | Menus and orders — data lives in the owner's Google account |
| Auth | Google OAuth 2.0 | Manager login, session via HttpOnly JWT cookie |
| Payments | PayPal REST API | Server-side order creation + capture |
| Emails | EmailJS REST API | Order confirmation to guests |
| Persistence | Netlify Blobs | Stores Google refresh token, spreadsheet ID, PayPal merchant info |

**Owner experience**: Sign in with Google → Connect PayPal → done. No keys, no configs, no spreadsheet setup.

---

## Developer setup (one-time)

You (the developer) set up three services once. The owner never touches any of this.

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (name it "ContactLunch").
2. Go to **APIs & Services → Library** and enable:
   - **Google Sheets API**
   - **Google Drive API**
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: "The Daily Lunch"
   - Add scopes: `spreadsheets`, `drive.file`, `email`, `openid`, `profile`
   - Add the owner's email as a test user (until you publish the app)
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorised redirect URIs — add both:
     - `https://YOUR-SITE.netlify.app/.netlify/functions/auth-google-callback`
     - `http://localhost:8888/.netlify/functions/auth-google-callback`
5. Copy the **Client ID** and **Client Secret**.

### 2. PayPal Developer

1. Go to [developer.paypal.com](https://developer.paypal.com) and log in.
2. Go to **Apps & Credentials → Create App**:
   - App name: "ContactLunch"
   - App type: **Merchant**
3. Under **App Settings**, enable **Log In with PayPal** and add redirect URIs:
   - `https://YOUR-SITE.netlify.app/.netlify/functions/auth-paypal-callback`
   - `http://localhost:8888/.netlify/functions/auth-paypal-callback`
4. Copy the **Client ID** and **Client Secret** (use the Sandbox tab for testing, Live for production).

### 3. EmailJS

1. Go to [emailjs.com](https://emailjs.com) and create a free account.
2. **Email Services → Add New Service** — connect Gmail, copy the **Service ID**.
3. **Email Templates → Create New Template**:
   - Subject: `Your lunch order #{{order_number}}`
   - To Email: `{{to_email}}`
   - Body (use exactly these variable names):
     ```
     Hi {{to_name}},

     Your order is confirmed!

     Order number: {{order_number}}
     Menu: {{menu_title}}
     Items: {{menu_items}}
     Price paid: {{price}}
     Date: {{lunch_date}}

     Just say your number at the counter.
     ```
   - Copy the **Template ID**.
4. **Account → General** — copy the **Public Key**.

### 4. Netlify deployment

1. Connect the GitHub repo to Netlify (Add new site → Import from GitHub).
2. Build settings are auto-detected from `netlify.toml`.
3. Go to **Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `PAYPAL_CLIENT_ID` | From PayPal Developer |
| `PAYPAL_CLIENT_SECRET` | From PayPal Developer |
| `PAYPAL_ENV` | `sandbox` (change to `live` for production) |
| `EMAILJS_SERVICE_ID` | From EmailJS |
| `EMAILJS_TEMPLATE_ID` | From EmailJS |
| `EMAILJS_PUBLIC_KEY` | From EmailJS |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

4. Deploy. Netlify sets `URL` automatically.

### 5. Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into the `JWT_SECRET` env var.

---

## Local development

```bash
npm install
netlify dev   # starts Vite on 5173, functions on 8888, proxied together at 8888
```

Create a `.env` file (copy from `.env.example`) with your sandbox credentials. The `URL` env var is automatically set by Netlify in production; for local dev it defaults to `http://localhost:8888`.

---

## Owner first-run flow

After you deploy and visit the site, the owner does this **once**:

1. Visit `/manager`
2. Click **Sign in with Google** — approves Sheets + Drive access
3. The app automatically creates a **"Canteen Data"** spreadsheet in their Google Drive with the correct tabs (`menus`, `orders`) and headers
4. Back in `/manager`, click **Connect with PayPal** — logs into PayPal, authorises payment routing
5. Done. The dashboard is ready.

---

## Daily operation (for the owner)

### Every morning — publish the menu
1. Go to `/manager` — already signed in (session lasts 7 days)
2. Fill in: menu title, items (one per line), price, order deadline
3. Click **Publish Menu**

### At lunch — check people in
1. Open `/checkin` on the tablet
2. Tap each order card as guests collect — it greys out
3. Auto-refreshes every 30 seconds

### View all orders
Go to `/manager` → **Today's Orders** tab → click Refresh

---

## Switching to live PayPal

1. In PayPal Developer, go to the **Live** tab and copy the Live Client ID and Secret.
2. In Netlify → Environment variables, update `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and set `PAYPAL_ENV=live`.
3. Trigger a redeploy (Netlify → Deploys → Trigger deploy).

---

## Data

All data lives in the owner's Google Drive spreadsheet **"Canteen Data"**:
- `menus` sheet: one row per day (date, title, items, price, deadline)
- `orders` sheet: one row per order (date, orderNumber, name, email, dietary, paypalOrderId, paid, collected, createdAt)

The owner can view, export, or edit the spreadsheet at any time at sheets.google.com.

---

## Troubleshooting

**"App not set up — manager must sign in"** — The Google OAuth flow hasn't been completed. Visit `/manager` and sign in with Google.

**PayPal button doesn't appear** — Check that `PAYPAL_CLIENT_ID` is set and `PAYPAL_ENV` matches the key type (sandbox vs live). Functions logs in Netlify dashboard show any errors.

**Emails not sending** — Check EmailJS dashboard for usage (200/month on free tier). Template variable names must match exactly.

**"Blobs unavailable"** warning — You're running `npm run dev` (Vite only) instead of `netlify dev`. Functions require `netlify dev` to work locally.
