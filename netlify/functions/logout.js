// GET /.netlify/functions/logout
// Clears the session cookie and redirects to /manager (login screen).

const { clearSessionCookie } = require('./utils/auth')

function getSiteUrl() {
  return process.env.URL || 'http://localhost:8888'
}

exports.handler = async () => {
  return {
    statusCode: 302,
    headers: {
      Location: `${getSiteUrl()}/manager`,
      'Set-Cookie': clearSessionCookie(),
    },
    body: '',
  }
}
