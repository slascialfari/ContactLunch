// Netlify Blobs — stores Google credentials for guest checkout (PayPal capture).
// Requires NETLIFY_ACCESS_TOKEN env var (Netlify personal access token).
// SITE_ID is injected automatically by the Netlify runtime.

const { getStore } = require('@netlify/blobs')

const STORE_NAME = 'contactlunch'
const CONFIG_KEY = 'config'

function getConfiguredStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
  const token  = process.env.NETLIFY_ACCESS_TOKEN

  if (!siteID || !token) {
    throw new Error(
      `Blobs not configured. SITE_ID=${siteID ? 'ok' : 'missing'}, NETLIFY_ACCESS_TOKEN=${token ? 'ok' : 'missing'}. ` +
      'Add NETLIFY_ACCESS_TOKEN (Netlify personal access token) to your site env vars.'
    )
  }

  return getStore({ name: STORE_NAME, siteID, token })
}

async function getConfig() {
  try {
    const store = getConfiguredStore()
    const data  = await store.get(CONFIG_KEY, { type: 'json' })
    return data || {}
  } catch (err) {
    console.warn('Blobs unavailable:', err.message)
    return {}
  }
}

async function setConfig(updates) {
  const store   = getConfiguredStore()
  const current = await getConfig()
  await store.setJSON(CONFIG_KEY, { ...current, ...updates })
}

module.exports = { getConfig, setConfig }
