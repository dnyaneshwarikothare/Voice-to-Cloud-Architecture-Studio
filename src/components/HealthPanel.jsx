import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles, Lock, Server, Cpu, Zap, DollarSign } from 'lucide-react';
import { analyzeArchitectureHealth } from '../services/healthService';

export function HealthPanel({ architecture, defaultPillar = 'all' }) {
  const [selectedPillar, setSelectedPillar] = useState(defaultPillar);

  useEffect(() => {
    if (defaultPillar) {
      setSelectedPillar(defaultPillar);
    }
  }, [defaultPillar]);

  const healthData = analyzeArchitectureHealth(architecture);
  const { overallScore = 80, pillars = {} } = healthData;

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-warning';
    return 'score-risk';
  };

  const getSeverityIcon = (type, severity) => {
    if (type === 'good') return <CheckCircle2 size={16} color="#10b981" />;
    if (severity === 'high' || type === 'risk') return <AlertCircle size={16} color="#f43f5e" />;
    if (severity === 'medium' || type === 'warning') return <AlertTriangle size={16} color="#f59e0b" />;
    return <Info size={16} color="#06b6d4" />;
  };

  // Filter findings based on selected tab
  let visibleFindings = [];
  if (selectedPillar === 'all') {
    Object.entries(pillars).forEach(([pillarKey, pillar]) => {
      (pillar.findings || []).forEach(f => {
        visibleFindings.push({ ...f, pillar: pillarKey });
      });
    });
  } else {
    visibleFindings = (pillars[selectedPillar]?.findings || []).map(f => ({ ...f, pillar: selectedPillar }));
  }

  // Active pillar reasons
  const activePillarData = selectedPillar !== 'all' ? pillars[selectedPillar] : null;

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      {/* Overall Score Card */}
      <div className="health-score-card">
        <div className={`score-circle ${getScoreBadgeClass(overallScore)}`}>
          <span>{overallScore}</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 500, color: '#94a3b8', marginTop: '-4px' }}>/ 100</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} color="#818cf8" />
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              {selectedPillar === 'security' ? 'Security & Compliance Diagnostic' : 'Architecture Health Index'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            {selectedPillar === 'security'
              ? 'Evaluates perimeter defense, network isolation, unencrypted communication, and credential isolation.'
              : 'Multi-pillar architectural evaluation based on cloud reliability, resilience, performance, and cost.'}
          </p>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
            * This is an automated architectural design-level diagnostic, not a certified production audit.
          </div>
        </div>
      </div>

      {/* Pillar Selector Tabs */}
      <div className="tab-row" style={{ borderRadius: '6px', flexWrap: 'wrap' }}>
        <button
          className={`tab-btn ${selectedPillar === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedPillar('all')}
        >
          All
        </button>
        <button
          className={`tab-btn ${selectedPillar === 'security' ? 'active' : ''}`}
          onClick={() => setSelectedPillar('security')}
        >
          Security ({pillars?.security?.score ?? 100})
        </button>
        <button
          className={`tab-btn ${selectedPillar === 'availability' ? 'active' : ''}`}
          onClick={() => setSelectedPillar('availability')}
        >
          Availability ({pillars?.availability?.score ?? 100})
        </button>
        <button
          className={`tab-btn ${selectedPillar === 'scalability' ? 'active' : ''}`}
          onClick={() => setSelectedPillar('scalability')}
        >
          Scalability ({pillars?.scalability?.score ?? 100})
        </button>
        <button
          className={`tab-btn ${selectedPillar === 'performance' ? 'active' : ''}`}
          onClick={() => setSelectedPillar('performance')}
        >
          Performance ({pillars?.performance?.score ?? 100})
        </button>
        {pillars?.cost && (
          <button
            className={`tab-btn ${selectedPillar === 'cost' ? 'active' : ''}`}
            onClick={() => setSelectedPillar('cost')}
          >
            Cost ({pillars.cost.score})
          </button>
        )}
      </div>

      {/* Pillar Reasons Breakdown */}
      {activePillarData?.reasons && activePillarData.reasons.length > 0 && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Score Attribution Reasons:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activePillarData.reasons.map((r, i) => (
              <div key={i} style={{
                fontSize: '0.72rem',
                color: r.startsWith('+') ? '#34d399' : (r.startsWith('-') ? '#f87171' : '#94a3b8'),
                fontFamily: 'monospace'
              }}>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {visibleFindings.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
            No specific findings or risks detected for this category.
          </div>
        ) : (
          visibleFindings.map((finding, idx) => (
            <div key={idx} className={`finding-card ${finding.type}`}>
              <div className="finding-title">
                {getSeverityIcon(finding.type, finding.severity)}
                <span>{finding.title}</span>
              </div>
              <p className="finding-desc">{finding.description}</p>
              {finding.recommendation && (
                <div className="finding-action">
                  💡 <b>Recommendation:</b> {finding.recommendation}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
