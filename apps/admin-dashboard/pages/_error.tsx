// Custom error page for Next.js Pages Router fallback
// This prevents the automatic error page generation that causes SSG issues

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>
        {statusCode || 'Error'}
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>
        {statusCode === 404 
          ? 'Página no encontrada' 
          : 'Ha ocurrido un error'}
      </p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode: number }, err?: { statusCode: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
