export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.04em' }}>
        momento
      </div>
      <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        you're offline — check your connection
      </div>
    </div>
  )
}