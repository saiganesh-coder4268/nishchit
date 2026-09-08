import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Nishchit App Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '80px auto',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          fontFamily: 'Inter, sans-serif'
        }}>
          <h2 style={{ color: '#0f172a', marginBottom: '12px' }}>Nishchit Application Reload Required</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred. Please click below to refresh.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Refresh Nishchit App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
