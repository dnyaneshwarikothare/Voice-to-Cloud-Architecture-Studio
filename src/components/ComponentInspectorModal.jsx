import React from 'react';
import {
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  HelpCircle,
  Shield,
  DollarSign,
  Activity,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { COMPONENT_TYPE_CONFIG } from '../utils/architectureSchema';

export function ComponentInspectorModal({
  isOpen,
  onClose,
  component,
  architecture,
  isBeginnerMode = false
}) {
  if (!isOpen || !component) return null;

  const config = COMPONENT_TYPE_CONFIG[component.type] || COMPONENT_TYPE_CONFIG.custom;
  const roleName = component.role || config.label || component.type;
  const techName = component.technology || component.name;

  // Calculate dependencies (outgoing) and dependents (incoming)
  const connections = architecture?.connections || [];
  const components = architecture?.components || [];

  const dependencies = connections
    .filter(c => c.from === component.id)
    .map(c => components.find(comp => comp.id === c.to))
    .filter(Boolean);

  const dependents = connections
    .filter(c => c.to === component.id)
    .map(c => components.find(comp => comp.id === c.from))
    .filter(Boolean);

  // Failure impact reasoning
  let failureImpact = 'Service degraded; client operations may experience retry delays.';
  let securityConsiderations = 'Ensure TLS/HTTPS encryption in transit and IAM least-privilege service roles.';
  let potentialBottlenecks = 'Network latency and connection pooling concurrency limits under peak surge.';
  let recommendations = 'Implement health checks, connection keep-alive, and retry backoff.';

  if (component.type === 'database') {
    failureImpact = 'Critical failure: All write transactions and un-cached reads will fail. Order placement and user signups halt.';
    securityConsiderations = 'Keep database inside private VPC subnet with NO public IP. Enforce TLS 1.3 and KMS storage encryption at rest.';
    potentialBottlenecks = 'IOPS exhaustion and max connection pool limits during flash sales or heavy reporting queries.';
    recommendations = 'Configure multi-AZ automated failover with read replicas and automated daily snapshot retention.';
  } else if (component.type === 'cache') {
    failureImpact = 'Cache-miss avalanche: All reads fall through directly to the database, causing DB load to spike by 300%–500%.';
    securityConsiderations = 'Enable AUTH token password protection and encrypt in-transit traffic between backend and Redis.';
    potentialBottlenecks = 'Memory exhaustion if cache eviction policies (e.g. volatile-lru) are misconfigured.';
    recommendations = 'Deploy Redis replication cluster with circuit breaker fallback logic in application tier.';
  } else if (component.type === 'gateway' || component.type === 'loadbalancer') {
    failureImpact = 'Perimeter entrypoint severed: Client web and mobile applications cannot reach backend APIs.';
    securityConsiderations = 'Enforce AWS WAF / Cloud Armor rules, rate limiting (100 req/min per IP), and DDoS protection.';
    potentialBottlenecks = 'TLS termination handshake CPU saturation and connection keep-alive timeouts.';
    recommendations = 'Enable multi-region DNS failover (Route 53 / Cloud DNS) and automated SSL certificate renewal.';
  } else if (component.type === 'backend') {
    failureImpact = 'Business logic execution stalled: Associated API endpoints return 502/503 Bad Gateway errors.';
    securityConsiderations = 'Input sanitization against injection, stateless JWT verification, and container vulnerability scanning.';
    potentialBottlenecks = 'Thread/Worker pool saturation under heavy CPU-bound tasks or slow external API calls.';
    recommendations = 'Implement Horizontal Pod Autoscaling (HPA) with CPU target utilization at 70%.';
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: config.color || '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700
              }}
            >
              <Cpu size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {component.name}
              </h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                <span className="opt-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  Role: {roleName}
                </span>
                <span className="opt-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  Tech: {techName}
                </span>
              </div>
            </div>
          </div>

          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
          {/* Functional Purpose */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>
              Functional Purpose
            </div>
            <p style={{ fontSize: '0.78rem', color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
              {component.purpose || `Handles core ${roleName} duties within this architecture topology.`}
            </p>
          </div>

          {/* Dependencies vs Dependents */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowRight size={11} color="#38bdf8" />
                Dependencies (Calls):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dependencies.length > 0 ? (
                  dependencies.map(d => (
                    <span key={d.id} style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>• {d.name}</span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>None (Terminal Leaf node)</span>
                )}
              </div>
            </div>

            <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <ArrowLeft size={11} color="#10b981" />
                Dependents (Called By):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dependents.length > 0 ? (
                  dependents.map(d => (
                    <span key={d.id} style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>• {d.name}</span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>None (Edge Entry node)</span>
                )}
              </div>
            </div>
          </div>

          {/* Failure Impact */}
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '4px' }}>
              <AlertTriangle size={13} />
              Failure Blast-Radius Impact:
            </div>
            <p style={{ fontSize: '0.76rem', color: '#fecdd3', margin: 0, lineHeight: 1.4 }}>
              {failureImpact}
            </p>
          </div>

          {/* Bottlenecks & Security */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Activity size={12} />
                Potential Bottlenecks
              </span>
              <p style={{ fontSize: '0.7rem', color: '#cbd5e1', margin: 0, lineHeight: 1.3 }}>
                {potentialBottlenecks}
              </p>
            </div>

            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                <Shield size={12} />
                Security Considerations
              </span>
              <p style={{ fontSize: '0.7rem', color: '#cbd5e1', margin: 0, lineHeight: 1.3 }}>
                {securityConsiderations}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Sparkles size={12} />
              Architectural Recommendation
            </span>
            <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
              {recommendations}
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.74rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
