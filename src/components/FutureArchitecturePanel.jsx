import React from 'react';
import { Sparkles, TrendingUp, ArrowRight, Layers, CheckCircle2, Shield, Zap, RefreshCw, Cpu, Server, Database } from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';

export function FutureArchitecturePanel({
  currentArchitecture,
  scaledArchitecture,
  onGenerateScaledArchitecture,
  isGeneratingScaled,
  onAdoptScaledArchitecture
}) {
  const currentComps = currentArchitecture?.components || [];
  const scaledComps = scaledArchitecture?.components || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#2563eb" />
              <span>Future &amp; Scaled Architecture Generator</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Synthesizes a High-Availability, horizontal auto-scaled architecture topology without modifying your current baseline architecture.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={onGenerateScaledArchitecture}
              disabled={isGeneratingScaled}
              style={{ fontSize: '0.75rem', gap: '6px' }}
            >
              <Sparkles size={14} />
              <span>{isGeneratingScaled ? 'Synthesizing Future Topology...' : 'Generate Future Architecture'}</span>
            </button>

            {scaledArchitecture && onAdoptScaledArchitecture && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={onAdoptScaledArchitecture}
                style={{ fontSize: '0.75rem', color: '#16a34a' }}
              >
                <CheckCircle2 size={13} color="#16a34a" />
                <span>Adopt Scaled Topology as Current</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Scaling Recommendations Card (Feature 4.D) */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="#d97706" />
          <span>Automated Scaling Strategies for Future Growth (1,000,000+ Monthly Users):</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.74rem' }}>
          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Server size={13} />
              Backend Tier:
            </strong>
            <span style={{ color: '#475569', display: 'block', marginTop: '3px' }}>
              Horizontal autoscaling (HPA) from 2 up to 10 instances behind an Application Load Balancer.
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Database size={13} />
              Database Tier:
            </strong>
            <span style={{ color: '#475569', display: 'block', marginTop: '3px' }}>
              Multi-AZ primary write node paired with 2 asynchronous read replicas to isolate heavy query traffic.
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={13} />
              Cache Tier:
            </strong>
            <span style={{ color: '#475569', display: 'block', marginTop: '3px' }}>
              In-memory Redis Cluster with sharding to absorb 85%+ repeat read requests.
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={13} />
              Frontend &amp; Edge:
            </strong>
            <span style={{ color: '#475569', display: 'block', marginTop: '3px' }}>
              Global Edge CDN (CloudFront / Cloud CDN) caching static bundles and images with 99% hit ratio.
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Diagram Canvases */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '14px' }}>
        {/* CURRENT ARCHITECTURE */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>CURRENT BASELINE</span>
              <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{currentArchitecture?.project_name || 'Current'}</strong>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {currentComps.length} active services
            </span>
          </div>

          <div style={{ height: '420px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <ArchitectureDiagram
              architecture={currentArchitecture}
              direction="TD"
            />
          </div>
        </div>

        {/* FUTURE SCALED ARCHITECTURE */}
        <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>FUTURE SCALED (HA)</span>
              <strong style={{ fontSize: '0.84rem', color: '#1e3a8a' }}>Enterprise Scaled Architecture</strong>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>
              {scaledArchitecture ? `${scaledComps.length} high-availability services` : 'Click generate to preview'}
            </span>
          </div>

          <div style={{ height: '420px', border: '1px solid #bfdbfe', borderRadius: '6px', overflow: 'hidden', background: '#ffffff' }}>
            {scaledArchitecture ? (
              <ArchitectureDiagram
                architecture={scaledArchitecture}
                direction="TD"
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '20px', textAlign: 'center' }}>
                <Sparkles size={32} color="#3b82f6" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e3a8a' }}>Future Architecture Not Generated Yet</div>
                <p style={{ fontSize: '0.76rem', color: '#64748b', maxWidth: '320px', margin: '4px 0 12px' }}>
                  Click below to synthesize a scaled high-availability topology with load balancing, caching, and read replicas.
                </p>
                <button className="btn btn-primary btn-sm" onClick={onGenerateScaledArchitecture} disabled={isGeneratingScaled}>
                  {isGeneratingScaled ? 'Generating...' : 'Generate Future Architecture'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
