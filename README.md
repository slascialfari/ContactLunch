# The Daily Lunch — Setup Guide

A canteen lunch subscription app. Guests scan a QR code, see today's menu, pay via PayPal, and get an order number. The manager publishes menus, monitors orders, and checks guests in on a tablet.

---

## What you need before starting

- A Google account (for the spreadsheet & script)
- A PayPal Business account (free — developer.paypal.com)
- An EmailJS account (free — emailjs.com)
- A Netlify account (free — netlify.com)
- This GitHub repository connected to Netlify

---

## Step 1 — Google Sheets & Apps Script (the database)

### 1.1 Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it **"ContactLunch"** (or anything you like).
3. You need **two sheets** (tabs at the bottom):
   - Rename **Sheet1** to: `menus`
   - Click the **+** button to add a second sheet, name it: `orders`
4. Leave both sheets empty — the script will add headers automatically.

### 1.2 Create the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**.
2. Delete all the default code in the editor.
3. Open the file `apps-script/Code.gs` from this repository and **copy all of its contents**.
4. Paste it into the Apps Script editor.
5. Click **Save** (the floppy disk icon).

### 1.3 Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon ⚙ next to "Type" and select **Web app**.
3. Fill in:
   - **Description**: ContactLunch API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**.
5. Google will ask you to authorise — click through and accept.
6. Copy the **Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Save this URL — you'll need it in Step 4.

> **Important**: Every time you change the Apps Script code, you must create a **New deployment** (not update the existing one) to see your changes live.

---

## Step 2 — PayPal

1. Go to [developer.paypal.com](https://developer.paypal.com).
2. Log in with your PayPal Business account.
3. Go to **Apps & Credentials**.
4. You'll see a **Sandbox** tab and a **Live** tab.
   - Use **Sandbox** for testing (no real money)
   - Switch to **Live** when you're ready to go live
5. Under the relevant tab, click your default app (or create a new one).
6. Copy the **Client ID**.
7. Save it — you'll need it in Step 4.

---

## Step 3 — EmailJS (confirmation emails)

1. Go to [emailjs.com](https://emailjs.com) and create a free account.
2. **Add an Email Service**:
   - Click **Email Services → Add New Service**
   - Choose Gmail (or your provider) and connect your account
   - Copy the **Service ID** (e.g. `service_abc123`)
3. **Create an Email Template**:
   - Click **Email Templates → Create New Template**
   - Set the Subject to: `Your lunch order #{{order_number}}`
   - Write the body — use these variables exactly:
     ```
     Hi {{to_name}},

     Your order is confirmed!

     Order number: {{order_number}}
     Menu: {{menu_title}}
     Items: {{menu_items}}
     Price paid: {{price}}
     Date: {{lunch_date}}

     Just say your number at the counter.

     See you at lunch!
     ```
   - In the **To Email** field, set: `{{to_email}}`
   - Click **Save**
   - Copy the **Template ID** (e.g. `template_xyz789`)
4. Go to **Account → General** and copy your **Public Key**.

---

## Step 4 — Netlify & environment variables

1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **Add new site → Import an existing project**.
3. Choose **GitHub** and select the `ContactLunch` repository.
4. Build settings (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Before deploying, go to **Site configuration → Environment variables**.
6. Add each of these variables with the values you collected:

| Variable | Where to find it |
|---|---|
| `VITE_PAYPAL_CLIENT_ID` | PayPal Developer — Client ID |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS — Service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS — Template ID |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS — Account → Public Key |
| `VITE_APPS_SCRIPT_URL` | Apps Script deployment URL |
| `VITE_MANAGER_PASSWORD` | Choose your own password |

7. Click **Deploy site**.

---

## Step 5 — Print the QR code (once)

1. Once deployed, visit: `https://your-site.netlify.app/manager`
2. Log in with your manager password.
3. Click the **QR Code** tab.
4. Print the QR code — it always points to `/lunch` and will show today's menu dynamically.
5. Stick it on the wall. You'll never need to reprint it.

---

## Daily operation (for the manager)

### Every morning — publish the menu

1. Go to `https://your-site.netlify.app/manager`
2. Log in.
3. Under **Publish Menu**:
   - Enter today's menu title (e.g. "Pasta & Salad Thursday")
   - Enter each item on a separate line
   - Set the price
   - Set the **order deadline** (e.g. 11:30 AM) — after this, the guest page shows "subscriptions closed"
4. Click **Publish Menu**.

### At lunch — check people in

1. Go to `/checkin` on your tablet (or bookmark it).
2. Log in with your manager password.
3. As guests arrive, they'll say their 3-digit number.
4. Tap their card to mark them as collected — it turns grey.
5. The page refreshes automatically every 30 seconds.

### Monitoring orders

- Go to `/manager` → **Today's Orders** tab.
- You can see everyone's name, dietary notes, and payment status in real time.
- Click **Refresh** to get the latest.

---

## Going live (switching from PayPal Sandbox to real payments)

1. In your PayPal Developer dashboard, switch to the **Live** tab.
2. Copy the **Live Client ID**.
3. Go to Netlify → **Environment variables**.
4. Update `VITE_PAYPAL_CLIENT_ID` with the live Client ID.
5. Trigger a redeploy (Netlify → Deploys → Trigger deploy).

---

## Troubleshooting

**"Apps Script URL not configured"** — Check that `VITE_APPS_SCRIPT_URL` is set in Netlify environment variables and redeploy.

**Emails not sending** — Check your EmailJS dashboard for usage (200/month on free tier). Verify the template variable names match exactly.

**PayPal button not appearing** — Check that `VITE_PAYPAL_CLIENT_ID` is correct. In sandbox mode it can take a few seconds to load.

**Menu not showing up** — Make sure you published the menu for today's date. Check the `menus` sheet in Google Sheets to confirm a row exists with today's date in `YYYY-MM-DD` format.

**Apps Script changes not working** — Remember: after editing `Code.gs`, you must create a **New deployment** and update `VITE_APPS_SCRIPT_URL` in Netlify with the new URL.
