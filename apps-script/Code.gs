/**
 * ContactLunch — Google Apps Script Backend
 *
 * Sheets required (in the same spreadsheet):
 *   Sheet 1 name: "menus"
 *   Sheet 2 name: "orders"
 *
 * menus columns:  date | title | items | price | deadline
 * orders columns: date | orderNumber | name | email | dietary | paypalOrderId | paid | collected | createdAt
 */

var MENUS_SHEET  = 'menus'
var ORDERS_SHEET = 'orders'

// ─── Entry point ─────────────────────────────────────────────────────────────

function doPost(e) {
  var output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)

  try {
    var payload = JSON.parse(e.postData.contents)
    var result  = route(payload)
    output.setContent(JSON.stringify(result))
  } catch (err) {
    output.setContent(JSON.stringify({ error: err.message }))
  }

  return output
}

// Allow GET for quick health checks from the browser
function doGet(e) {
  var output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  output.setContent(JSON.stringify({ status: 'ok', service: 'ContactLunch' }))
  return output
}

function route(payload) {
  switch (payload.action) {
    case 'getMenu':      return getMenu(payload.date)
    case 'getOrders':    return getOrders(payload.date)
    case 'publishMenu':  return publishMenu(payload)
    case 'createOrder':  return createOrder(payload)
    case 'markCollected':return markCollected(payload)
    default:             throw new Error('Unknown action: ' + payload.action)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSheet(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(name)
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Create it in your spreadsheet.')
  return sheet
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  var headers = data[0].map(function(h) { return String(h).trim() })
  return data.slice(1).map(function(row) {
    var obj = {}
    headers.forEach(function(h, i) { obj[h] = row[i] })
    return obj
  })
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function getMenu(date) {
  var sheet = getSheet(MENUS_SHEET)
  var rows  = sheetToObjects(sheet)
  var menu  = rows.find(function(r) { return String(r.date).trim() === date })
  if (!menu) return null

  // Parse items — stored as comma-separated string
  var items = String(menu.items).split(',').map(function(s) { return s.trim() }).filter(Boolean)

  return {
    date:     menu.date,
    title:    menu.title,
    items:    items,
    price:    parseFloat(menu.price),
    deadline: menu.deadline ? String(menu.deadline) : null,
  }
}

function getOrders(date) {
  var sheet  = getSheet(ORDERS_SHEET)
  var rows   = sheetToObjects(sheet)
  var orders = rows.filter(function(r) { return String(r.date).trim() === date })

  return orders.map(function(o) {
    return {
      date:         o.date,
      orderNumber:  o.orderNumber,
      name:         o.name,
      email:        o.email,
      dietary:      o.dietary || '',
      paypalOrderId:o.paypalOrderId || '',
      paid:         o.paid === true || o.paid === 'TRUE' || o.paid === 1,
      collected:    o.collected === true || o.collected === 'TRUE' || o.collected === 1,
      createdAt:    o.createdAt ? String(o.createdAt) : '',
    }
  })
}

function publishMenu(payload) {
  var sheet = getSheet(MENUS_SHEET)
  var data  = sheet.getDataRange().getValues()

  // Ensure header row
  if (data.length === 0 || String(data[0][0]).trim() !== 'date') {
    sheet.getRange(1, 1, 1, 5).setValues([['date', 'title', 'items', 'price', 'deadline']])
    data = sheet.getDataRange().getValues()
  }

  var items    = Array.isArray(payload.items) ? payload.items.join(', ') : String(payload.items)
  var newRow   = [payload.date, payload.title, items, payload.price, payload.deadline || '']

  // Find existing row for this date and update it, or append
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === payload.date) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([newRow])
      return { success: true, updated: true }
    }
  }
  sheet.appendRow(newRow)
  return { success: true, updated: false }
}

function createOrder(payload) {
  var sheet  = getSheet(ORDERS_SHEET)
  var data   = sheet.getDataRange().getValues()

  // Ensure header row
  var headers = ['date', 'orderNumber', 'name', 'email', 'dietary', 'paypalOrderId', 'paid', 'collected', 'createdAt']
  if (data.length === 0 || String(data[0][0]).trim() !== 'date') {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    data = sheet.getDataRange().getValues()
  }

  // Calculate next sequential order number for today
  var todayOrders = data.slice(1).filter(function(row) {
    return String(row[0]).trim() === payload.date
  })
  var nextNum = todayOrders.length + 1
  var orderNumber = String(nextNum).padStart(3, '0')

  var now    = new Date().toISOString()
  var newRow = [payload.date, orderNumber, payload.name, payload.email, payload.dietary || '', payload.paypalOrderId, true, false, now]
  sheet.appendRow(newRow)

  return { success: true, orderNumber: orderNumber }
}

function markCollected(payload) {
  var sheet = getSheet(ORDERS_SHEET)
  var data  = sheet.getDataRange().getValues()

  if (data.length < 2) throw new Error('No orders found')

  var headers     = data[0].map(function(h) { return String(h).trim() })
  var orderNumIdx = headers.indexOf('orderNumber')
  var dateIdx     = headers.indexOf('date')
  var collectedIdx= headers.indexOf('collected')

  if (orderNumIdx === -1 || collectedIdx === -1) throw new Error('Sheet headers missing')

  for (var i = 1; i < data.length; i++) {
    var rowDate = String(data[i][dateIdx]).trim()
    var rowNum  = String(data[i][orderNumIdx]).trim()
    if (rowDate === payload.date && rowNum === payload.orderNumber) {
      sheet.getRange(i + 1, collectedIdx + 1).setValue(true)
      return { success: true }
    }
  }

  throw new Error('Order ' + payload.orderNumber + ' not found for date ' + payload.date)
}
