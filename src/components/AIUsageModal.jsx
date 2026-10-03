import React, { useState, useEffect } from 'react';
import { X, Cpu, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ShieldCheck, Zap, Activity } from 'lucide-react';
import { getAIUsageStatsApi, clearResponseCacheApi } from '../services/apiService';

export function AIUsageModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const loadStats = async () => {
    setLoading(true);
    const data = await getAIUsageStatsApi();
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      setActionNotice('');
    }
  }, [isOpen]);

  const handleClearCache = async () => {
    const res = await clearResponseCacheApi();
    setActionNotice(res.message || 'Cache cleared');
    loadStats();
    setTimeout(() => setActionNotice(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Cpu size={18} color="#2563eb" />
            <span>AI Provider Router & Session Usage Management</span>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {actionNotice && (
            <div className="status-banner status-banner-success">
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Requests</span>
              <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{stats?.total_requests ?? 0}</strong>
            </div>
            <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Success Rate</span>
              <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>{stats?.success_rate_pct ?? 100}%</strong>
            </div>
            <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Cache Hits</span>
              <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>{stats?.cached_requests ?? 0}</strong>
            </div>
            <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Fallback Events</span>
              <strong style={{ fontSize: '1.25rem', color: stats?.fallback_events > 0 ? '#d97706' : '#64748b' }}>
                {stats?.fallback_events ?? 0}
              </strong>
            </div>
          </div>

          {/* Provider Routing Architecture Card */}
          <div className="card" style={{ background: '#f8fafc' }}>
            <div className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#16a34a" />
                Active Multi-Provider Routing Policy
              </span>
              <span className="badge badge-success">Zero Leaked Secrets</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>
              When a user submits requirements, the backend router queries the <b>Primary Provider</b>.
              If rate-limited or quota exceeded, it automatically fails over to the <b>Backup Provider</b>,
              and finally to the <b>Local Rule Engine</b> to guarantee zero downtime.
            </p>
          </div>

          {/* Per-Provider Usage Breakdown */}
          <div className="card">
            <div className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#2563eb" />
                Provider Statistics (Current Session)
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadStats}
                disabled={loading}
                style={{ padding: '2px 8px' }}
              >
                <RefreshCw size={12} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>

            <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '6px 4px' }}>Provider</th>
                  <th style={{ padding: '6px 4px' }}>Requests</th>
                  <th style={{ padding: '6px 4px' }}>Success</th>
                  <th style={{ padding: '6px 4px' }}>Avg Latency</th>
                  <th style={{ padding: '6px 4px' }}>Est. Tokens</th>
                </tr>
              </thead>
              <tbody>
                {stats?.provider_stats && Object.entries(stats.provider_stats).map(([pName, pStat]) => (
                  <tr key={pName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 4px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {pName.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{pStat.requests}</td>
                    <td style={{ padding: '6px 4px', color: pStat.fail > 0 ? '#d97706' : '#16a34a' }}>
                      {pStat.success} / {pStat.requests}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{pStat.avg_ms} ms</td>
                    <td style={{ padding: '6px 4px' }}>~{pStat.tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cache Management Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>Response Normalization Cache</div>
              <div style={{ fontSize: '0.73rem', color: '#64748b' }}>Caches valid architectures to eliminate repetitive AI calls.</div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearCache}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <Trash2 size={13} />
              Clear Cache
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
