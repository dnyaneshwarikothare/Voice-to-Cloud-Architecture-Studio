import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          color: '#fca5a5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px',
          margin: '16px'
        }}>
          <AlertTriangle size={32} color="#ef4444" />
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#f87171' }}>
            {this.props.title || 'Panel Encountered an Issue'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', maxWidth: '320px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fef2f2',
              fontSize: '0.74rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
