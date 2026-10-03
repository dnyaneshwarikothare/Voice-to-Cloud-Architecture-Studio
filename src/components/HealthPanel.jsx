import React, { useState } from 'react';
import { HeartPulse, CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles, Shield, Cpu, Zap, Database, Layers, ArrowRight } from 'lucide-react';
import { analyzeArchitectureHealth } from '../services/healthService';

export function HealthPanel({ architecture, onGenerateScaledArchitecture, isGeneratingScaled }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const components = architecture?.components || [];
  const connections = architecture?.connections || [];
  const types = new Set(components.map(c => c.type));

  const hasBackend = types.has('backend') || types.has('payment');
  const hasDatabase = types.has('database');
  const hasCache = types.has('cache');
  const hasLoadBalancer = types.has('loadbalancer') || types.has('gateway');
  const hasCdn = types.has('cdn');
  const hasAuth = types.has('auth');
  const hasReplica = components.some(c => c.name?.toLowerCase().includes('replica') || c.id?.toLowerCase().includes('replica'));

  // Calculate transparent score
  let score = 50;
  const passedChecks = [];
  const warnings = [];
  const recommendations = [];

  if (hasBackend) {
    score += 12;
    passedChecks.push({ title: 'Backend compute tier defined', detail: 'Application handles business logic in an isolated layer.' });
  } else {
    warnings.push({ title: 'No backend service defined', detail: 'Direct client-to-database connections create severe security and connection pooling risks.' });
    recommendations.push('Add an application backend service (e.g., FastAPI, Node.js) to isolate business logic.');
  }

  if (hasDatabase) {
    score += 12;
    passedChecks.push({ title: 'Persistent database storage configured', detail: 'Structured relational or document database ensures transaction durability.' });
  } else {
    warnings.push({ title: 'No database storage configured', detail: 'System lacks durable data persistence.' });
    recommendations.push('Add a database (e.g., PostgreSQL, MongoDB) for persistent application records.');
  }

  if (hasCache) {
    score += 10;
    passedChecks.push({ title: 'In-memory caching layer configured (Redis)', detail: 'Offloads repetitive read queries, reducing primary database load by up to 85%.' });
  } else {
    warnings.push({ title: 'No in-memory cache configured', detail: 'Every request hits the primary database directly, causing IOPS contention under high traffic.' });
    recommendations.push('Introduce a Redis in-memory cache to absorb frequent catalog and session queries.');
  }

  if (hasLoadBalancer) {
    score += 8;
    passedChecks.push({ title: 'Traffic load balancer configured', detail: 'Eliminates single points of failure by distributing traffic across redundant instances.' });
  } else {
    warnings.push({ title: 'No load balancer configured', detail: 'Single backend instance cannot handle traffic spikes and lacks failover redundancy.' });
    recommendations.push('Deploy an Application Load Balancer (ALB) across multiple Availability Zones.');
  }

  if (hasCdn) {
    score += 5;
    passedChecks.push({ title: 'Global edge Content Delivery Network (CDN)', detail: 'Caches static web bundles close to end-users globally, reducing origin latency.' });
  } else {
    recommendations.push('Add a CloudFront / Cloud CDN to accelerate static asset delivery and absorb DDoS attacks.');
  }

  if (hasAuth) {
    score += 5;
    passedChecks.push({ title: 'Dedicated authentication service configured', detail: 'Centralized token validation and IAM access control.' });
  }

  if (hasReplica) {
    score += 6;
    passedChecks.push({ title: 'Database read replica configured', detail: 'Segregates read-heavy query traffic from write-intensive transactions.' });
  } else if (hasDatabase) {
    warnings.push({ title: 'Database redundancy not configured', detail: 'Primary database has no read replicas or automated failover replica.' });
    recommendations.push('Configure database read replicas to eliminate read locks and enable multi-AZ automated failover.');
  }

  score = Math.min(100, Math.max(30, score));

  // Determine health color and badge
  let healthColor = '#16a34a';
  let healthBadge = 'Good';
  if (score >= 85) {
    healthColor = '#16a34a';
    healthBadge = 'Optimal';
  } else if (score >= 70) {
    healthColor = '#2563eb';
    healthBadge = 'Healthy';
  } else {
    healthColor = '#d97706';
    healthBadge = 'Needs Attention';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={18} color="#2563eb" />
              <span>Architecture Health Index</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Multi-pillar evaluation assessing security, high availability, redundancy, and scaling readiness.
            </p>
          </div>

          <span
            className="badge"
            style={{
              background: score >= 75 ? '#f0fdf4' : '#fffbeb',
              color: score >= 75 ? '#15803d' : '#b45309',
              borderColor: score >= 75 ? '#bbf7d0' : '#fde68a',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px'
            }}
          >
            {healthBadge} Status
          </span>
        </div>
      </div>

      {/* Main Score & Diagnostic Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {/* Score Summary Box */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>OVERALL ARCHITECTURE HEALTH</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: healthColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>/ 100</span>
          </div>

          <div style={{ marginTop: '10px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.5 }}>
            Based on transparent heuristics checking for tier isolation, caching, load balancing, and failover redundancy.
          </div>

          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
            * Note: This score is derived from architectural best-practice heuristics and is not a scientifically exact measurement.
          </div>
        </div>

        {/* Quick Health Breakdown Stats */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PILLAR METRICS</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="#2563eb" /> Security & Isolation
            </span>
            <strong style={{ color: hasBackend ? '#16a34a' : '#d97706' }}>{hasBackend ? '92 / 100' : '55 / 100'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#0284c7" /> High Availability
            </span>
            <strong style={{ color: hasLoadBalancer ? '#16a34a' : '#d97706' }}>{hasLoadBalancer ? '88 / 100' : '50 / 100'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#16a34a" /> Scalability & Caching
            </span>
            <strong style={{ color: hasCache ? '#16a34a' : '#dc2626' }}>{hasCache ? '95 / 100' : '45 / 100'}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', padding: '6px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="#7c3aed" /> Data Redundancy
            </span>
            <strong style={{ color: hasReplica ? '#16a34a' : '#d97706' }}>{hasReplica ? '90 / 100' : '60 / 100'}</strong>
          </div>
        </div>
      </div>

      {/* Passed Checks (Reasons) */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#15803d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={16} color="#16a34a" />
          <span>Passed Structural Checks ({passedChecks.length})</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {passedChecks.map((chk, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '0.74rem'
              }}
            >
              <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#15803d' }}>{chk.title}</strong>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.71rem', marginTop: '2px' }}>{chk.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="#d97706" />
            <span>Architecture Considerations & Warnings ({warnings.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {warnings.map((wrn, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  fontSize: '0.74rem'
                }}
              >
                <AlertTriangle size={14} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#b45309' }}>{wrn.title}</strong>
                  <p style={{ margin: 0, color: '#78350f', fontSize: '0.71rem', marginTop: '2px' }}>{wrn.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="#2563eb" />
              <span>Recommended Architecture Upgrades to Reach 95+ Health</span>
            </div>
            {onGenerateScaledArchitecture && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onGenerateScaledArchitecture}
                disabled={isGeneratingScaled}
                style={{ fontSize: '0.72rem', padding: '4px 12px' }}
              >
                <Sparkles size={12} />
                <span>Auto-Apply Recommended Topology</span>
              </button>
            )}
          </div>

          <ul style={{ paddingLeft: '18px', fontSize: '0.74rem', color: '#334155', lineHeight: 1.6 }}>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
