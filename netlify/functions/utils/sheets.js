// Google Sheets API helpers — raw fetch.
// All functions take an accessToken; caller is responsible for refreshing it.

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE  = 'https://www.googleapis.com/drive/v3'
const SPREADSHEET_NAME = 'Canteen Data'

// ─── Low-level Sheets fetch ───────────────────────────────────────────────────

async function sheetsGet(accessToken, path) {
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Sheets GET error: ${data.error?.message || res.status}`)
  return data
}

async function sheetsPost(accessToken, path, body) {
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Sheets POST error: ${data.error?.message || res.status}`)
  return data
}

async function sheetsPut(accessToken, path, body) {
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Sheets PUT error: ${data.error?.message || res.status}`)
  return data
}

// ─── Spreadsheet bootstrap ───────────────────────────────────────────────────

async function findSpreadsheet(accessToken) {
  const q = encodeURIComponent(
    `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  )
  const res = await fetch(`${DRIVE_BASE}/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Drive search error: ${data.error?.message || res.status}`)
  return data.files?.[0]?.id || null
}

async function createSpreadsheet(accessToken) {
  const body = {
    properties: { title: SPREADSHEET_NAME },
    sheets: [
      {
        properties: { title: 'menus', sheetId: 0 },
        data: [{
          startRow: 0, startColumn: 0,
          rowData: [{
            values: ['date','title','items','price','deadline'].map((v) => ({
              userEnteredValue: { stringValue: v },
            })),
          }],
        }],
      },
      {
        properties: { title: 'orders', sheetId: 1 },
        data: [{
          startRow: 0, startColumn: 0,
          rowData: [{
            values: ['date','orderNumber','name','email','dietary','paypalOrderId','paid','collected','createdAt','email_sent'].map((v) => ({
              userEnteredValue: { stringValue: v },
            })),
          }],
        }],
      },
    ],
  }
  const res = await fetch(SHEETS_BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Create spreadsheet error: ${data.error?.message || res.status}`)
  return data.spreadsheetId
}

// Find or create the spreadsheet. Returns spreadsheet ID.
async function ensureSpreadsheet(accessToken) {
  let id = await findSpreadsheet(accessToken)
  if (!id) {
    id = await createSpreadsheet(accessToken)
  }
  return id
}

// ─── Sheet data helpers ───────────────────────────────────────────────────────

// Returns all rows as array of objects keyed by header row.
async function getSheetRows(accessToken, spreadsheetId, sheetName) {
  const range = encodeURIComponent(`${sheetName}!A:Z`)
  const data  = await sheetsGet(accessToken, `/${spreadsheetId}/values/${range}`)
  const rows  = data.values || []
  if (rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map((row) => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
    return obj
  })
}

// Append a row to a sheet. values is a plain array.
async function appendSheetRow(accessToken, spreadsheetId, sheetName, values) {
  const range = encodeURIComponent(`${sheetName}!A:A`)
  return sheetsPost(
    accessToken,
    `/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { values: [values] }
  )
}

// Update a specific row range (1-indexed rowIndex in the sheet).
async function updateSheetRow(accessToken, spreadsheetId, sheetName, rowIndex, values) {
  const cols = String.fromCharCode(64 + values.length) // 'A' = 65
  const range = encodeURIComponent(`${sheetName}!A${rowIndex}:${cols}${rowIndex}`)
  return sheetsPut(
    accessToken,
    `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    { values: [values] }
  )
}

// Update a single cell. col is 1-indexed.
async function updateCell(accessToken, spreadsheetId, sheetName, rowIndex, colIndex, value) {
  const colLetter = String.fromCharCode(64 + colIndex)
  const range = encodeURIComponent(`${sheetName}!${colLetter}${rowIndex}`)
  return sheetsPut(
    accessToken,
    `/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
    { values: [[value]] }
  )
}

// ─── Domain operations ───────────────────────────────────────────────────────

async function getMenu(accessToken, spreadsheetId, date) {
  const rows = await getSheetRows(accessToken, spreadsheetId, 'menus')
  const row  = rows.find((r) => r.date === date)
  if (!row) return null
  return {
    date:     row.date,
    title:    row.title,
    items:    row.items ? row.items.split(',').map((s) => s.trim()).filter(Boolean) : [],
    price:    parseFloat(row.price) || 0,
    deadline: row.deadline || null,
  }
}

async function getOrders(accessToken, spreadsheetId, date) {
  const rows = await getSheetRows(accessToken, spreadsheetId, 'orders')
  return rows
    .filter((r) => r.date === date)
    .map((r) => ({
      date:          r.date,
      orderNumber:   r.orderNumber,
      name:          r.name,
      email:         r.email,
      dietary:       r.dietary || '',
      paypalOrderId: r.paypalOrderId || '',
      paid:          r.paid === 'TRUE' || r.paid === true,
      collected:     r.collected === 'TRUE' || r.collected === true,
      createdAt:     r.createdAt || '',
    }))
}

async function publishMenu(accessToken, spreadsheetId, { date, title, items, price, deadline }) {
  const rows = await getSheetRows(accessToken, spreadsheetId, 'menus')
  const itemsStr = Array.isArray(items) ? items.join(', ') : String(items)
  const values   = [date, title, itemsStr, price, deadline || '']

  const existingIdx = rows.findIndex((r) => r.date === date)
  if (existingIdx !== -1) {
    // +2 because data rows start at row 2 (row 1 is header)
    await updateSheetRow(accessToken, spreadsheetId, 'menus', existingIdx + 2, values)
    return { success: true, updated: true }
  }
  await appendSheetRow(accessToken, spreadsheetId, 'menus', values)
  return { success: true, updated: false }
}

// Orders columns (1-indexed): A=date B=orderNumber C=name D=email E=dietary
//   F=paypalOrderId G=paid H=collected I=createdAt J=email_sent
const COL_COLLECTED  = 8  // H
const COL_EMAIL_SENT = 10 // J

async function createOrder(accessToken, spreadsheetId, { date, name, email, dietary, paypalOrderId }) {
  const rows     = await getSheetRows(accessToken, spreadsheetId, 'orders')
  const todayN   = rows.filter((r) => r.date === date).length
  const orderNum = String(todayN + 1).padStart(3, '0')
  // email_sent starts as FALSE; updated to TRUE after successful send
  const values   = [date, orderNum, name, email, dietary || '', paypalOrderId, 'TRUE', 'FALSE', new Date().toISOString(), 'FALSE']
  await appendSheetRow(accessToken, spreadsheetId, 'orders', values)
  return { success: true, orderNumber: orderNum }
}

async function markCollected(accessToken, spreadsheetId, { date, orderNumber }) {
  const rows = await getSheetRows(accessToken, spreadsheetId, 'orders')
  const idx  = rows.findIndex((r) => r.date === date && r.orderNumber === orderNumber)
  if (idx === -1) throw new Error(`Order ${orderNumber} not found for ${date}`)
  await updateCell(accessToken, spreadsheetId, 'orders', idx + 2, COL_COLLECTED, 'TRUE')
  return { success: true }
}

async function markEmailSent(accessToken, spreadsheetId, { date, orderNumber }) {
  const rows = await getSheetRows(accessToken, spreadsheetId, 'orders')
  const idx  = rows.findIndex((r) => r.date === date && r.orderNumber === orderNumber)
  if (idx === -1) return // row disappeared — not fatal
  await updateCell(accessToken, spreadsheetId, 'orders', idx + 2, COL_EMAIL_SENT, 'TRUE')
}

module.exports = {
  ensureSpreadsheet,
  getSheetRows,
  getMenu,
  getOrders,
  publishMenu,
  createOrder,
  markCollected,
  markEmailSent,
}
