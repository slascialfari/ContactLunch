// Netlify Blobs — persistent server-side config store.
// Holds: googleRefreshToken, spreadsheetId, paypalMerchantEmail, paypalMerchantId
// Single-user app: one config object, key = 'config'.

const { getStore } = require('@netlify/blobs')

const STORE_NAME = 'contactlunch'
const CONFIG_KEY = 'config'

async function getConfig() {
  try {
    const store = getStore(STORE_NAME)
    const data  = await store.get(CONFIG_KEY, { type: 'json' })
    return data || {}
  } catch (err) {
    console.warn('Blobs unavailable:', err.message)
    return {}
  }
}

async function setConfig(updates) {
  const store   = getStore(STORE_NAME)
  const current = await getConfig()
  await store.setJSON(CONFIG_KEY, { ...current, ...updates })
}

module.exports = { getConfig, setConfig }
