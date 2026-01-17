'use client';

// @ts-ignore

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ 
          display: 'flex', 
          minHeight: '100vh', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1rem' 
        }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              严重错误
            </h1>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              {error.message || '应用程序发生了严重错误'}
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace', marginBottom: '1rem' }}>
                错误 ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

