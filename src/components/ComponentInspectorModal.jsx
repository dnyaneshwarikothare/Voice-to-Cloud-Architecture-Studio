import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';
import { COMPONENT_TYPE_CONFIG } from '../utils/architectureSchema';

export function ComponentInspectorModal({
  isOpen,
  onClose,
  component,
  architecture,
  onUpdateComponent,
  onDeleteComponent,
  isBeginnerMode = false
}) {
  const [activeTab, setActiveTab] = useState('inspect'); // 'inspect' | 'edit'

  // Editable local state
  const [editName, setEditName] = useState('');
  const [editTech, setEditTech] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editType, setEditType] = useState('backend');

  useEffect(() => {
    if (component) {
      setEditName(component.name || '');
      setEditTech(component.technology || '');
      setEditRole(component.role || '');
      setEditPurpose(component.purpose || '');
      setEditType(component.type || 'backend');
      setActiveTab('inspect');
    }
  }, [component]);

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

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!onUpdateComponent) return;

    const updated = {
      ...component,
      name: editName.trim() || component.name,
      technology: editTech.trim() || component.technology,
      role: editRole.trim() || component.role,
      purpose: editPurpose.trim() || component.purpose,
      type: editType
    };

    onUpdateComponent(updated);
    setActiveTab('inspect');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${component.name}"? This will also remove any connected links.`)) {
      if (onDeleteComponent) {
        onDeleteComponent(component.id);
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: config.color || '#2563eb',
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
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {component.name}
              </h3>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>
                  Role: {roleName}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>
                  Tech: {techName}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className={`btn btn-sm ${activeTab === 'inspect' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('inspect')}
              style={{ fontSize: '0.72rem' }}
            >
              <Info size={12} />
              <span>Inspect</span>
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('edit')}
              style={{ fontSize: '0.72rem' }}
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
            <button className="icon-btn" onClick={onClose} style={{ marginLeft: '4px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TAB 1: INSPECTION VIEW */}
        {activeTab === 'inspect' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', padding: '16px' }}>
            {/* Functional Purpose */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                Functional Purpose
              </div>
              <p style={{ fontSize: '0.78rem', color: '#1e293b', margin: 0, lineHeight: 1.4 }}>
                {component.purpose || `Handles core ${roleName} duties within this architecture topology.`}
              </p>
            </div>

            {/* Dependencies vs Dependents */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                  <ArrowRight size={11} color="#2563eb" />
                  Calls Dependencies:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dependencies.length > 0 ? (
                    dependencies.map(d => (
                      <span key={d.id} style={{ fontSize: '0.72rem', color: '#334155' }}>• {d.name}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>None (Terminal node)</span>
                  )}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontWeight: 600 }}>
                  <ArrowLeft size={11} color="#16a34a" />
                  Called By (Dependents):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {dependents.length > 0 ? (
                    dependents.map(d => (
                      <span key={d.id} style={{ fontSize: '0.72rem', color: '#334155' }}>• {d.name}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>None (Edge Entrypoint)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Failure Impact */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', marginBottom: '4px' }}>
                <AlertTriangle size={13} />
                Failure Blast-Radius Impact:
              </div>
              <p style={{ fontSize: '0.76rem', color: '#991b1b', margin: 0, lineHeight: 1.4 }}>
                {failureImpact}
              </p>
            </div>

            {/* Bottlenecks & Security */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <Activity size={12} />
                  Potential Bottlenecks
                </span>
                <p style={{ fontSize: '0.7rem', color: '#78350f', margin: 0, lineHeight: 1.3 }}>
                  {potentialBottlenecks}
                </p>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                  <Shield size={12} />
                  Security Guidance
                </span>
                <p style={{ fontSize: '0.7rem', color: '#1e3a8a', margin: 0, lineHeight: 1.3 }}>
                  {securityConsiderations}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT COMPONENT (Feature 3.G Visual Editor) */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveEdit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Component Display Name
              </label>
              <input
                type="text"
                className="input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Technology / Framework
                </label>
                <input
                  type="text"
                  className="input"
                  value={editTech}
                  onChange={e => setEditTech(e.target.value)}
                  placeholder="e.g. FastAPI, PostgreSQL, Redis"
                  required
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Architecture Role
                </label>
                <input
                  type="text"
                  className="input"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  placeholder="e.g. Core API Backend"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Operational Purpose
              </label>
              <textarea
                className="input"
                rows={3}
                value={editPurpose}
                onChange={e => setEditPurpose(e.target.value)}
                placeholder="What responsibilities does this component fulfill?"
                style={{ width: '100%', fontSize: '0.78rem', padding: '8px 10px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDelete}
                style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: '0.74rem' }}
              >
                <Trash2 size={13} />
                <span>Delete Component</span>
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('inspect')}
                  style={{ fontSize: '0.74rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.74rem' }}
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '10px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ fontSize: '0.74rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
