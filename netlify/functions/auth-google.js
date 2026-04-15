// GET /.netlify/functions/auth-google
// Redirects the manager to Google OAuth consent screen.

const { getOAuthUrl } = require('./utils/google')

exports.handler = async (event) => {
  try {
    const url = getOAuthUrl('manager')
    return {
      statusCode: 302,
      headers: { Location: url },
      body: '',
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: `OAuth init failed: ${err.message}`,
    }
  }
}
