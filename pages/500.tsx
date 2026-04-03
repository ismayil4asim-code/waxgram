export default function Custom500() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a, #0f0f1a)',
      color: 'white',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 'bold', color: '#2b6bff', margin: 0 }}>500</h1>
      <p style={{ color: '#9ca3af', fontSize: '1.125rem', marginTop: '1rem' }}>Ошибка сервера</p>
    </div>
  )
}
