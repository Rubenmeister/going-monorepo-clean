// Simple 404 page without any client-side dependencies
export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>Página no encontrada</p>
      <a href="/" style={{ 
        marginTop: '1rem', 
        padding: '0.5rem 1rem', 
        backgroundColor: '#0033A0', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '4px'
      }}>
        Volver al inicio
      </a>
    </div>
  );
}
