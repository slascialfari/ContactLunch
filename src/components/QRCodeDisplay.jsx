import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ url }) {
  const lunchUrl = url || `${window.location.origin}/lunch`

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>Permanent QR code — print once, stick on the wall</p>
      <div style={styles.qrBox}>
        <QRCodeSVG
          value={lunchUrl}
          size={200}
          bgColor="#ffffff"
          fgColor="#1a1a18"
          level="M"
        />
      </div>
      <p style={styles.url}>{lunchUrl}</p>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--chalk-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'center',
  },
  qrBox: {
    padding: '0.75rem',
    background: '#ffffff',
    borderRadius: 'var(--radius)',
  },
  url: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--chalk-faint)',
  },
}
