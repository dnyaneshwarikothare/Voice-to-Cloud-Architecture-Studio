import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

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
          background: '#ffffff',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '12px',
          margin: '20px auto',
          maxWidth: '560px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="#dc2626" />
          </div>
          
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#991b1b' }}>
            {this.props.title || 'Feature Encountered an Unexpected Issue'}
          </h4>
          
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An error occurred while loading this view. The main dashboard and architecture canvas remain operational.'}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.76rem', gap: '5px' }}
            >
              <RotateCcw size={13} />
              <span>Retry View</span>
            </button>
            
            {this.props.onReturnToCanvas && (
              <button
                onClick={this.props.onReturnToCanvas}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.76rem', gap: '5px' }}
              >
                <ArrowLeft size={13} />
                <span>Return to Architecture Canvas</span>
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
