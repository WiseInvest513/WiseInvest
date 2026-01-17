'use client';

// @ts-ignore

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
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
          出错了
        </h1>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          {error.message || '发生了一个意外错误'}
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace', marginBottom: '1rem' }}>
            错误 ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: '1rem',
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
  );
}

