import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Zap,
  Server,
  Database,
  Globe,
  Split,
  CreditCard,
  Lock,
  CloudLightning,
  ArrowDown,
  Layers
} from 'lucide-react';
import { simulateFailureApi } from '../services/apiService';

const FAILURE_TARGETS = [
  { id: 'database', label: 'Database Outage', icon: Database, color: '#10b981', targetType: 'database' },
  { id: 'backend', label: 'Backend Crash', icon: Server, color: '#8b5cf6', targetType: 'backend' },
  { id: 'gateway', label: 'API Gateway Down', icon: Split, color: '#06b6d4', targetType: 'gateway' },
  { id: 'cache', label: 'Redis Cache Outage', icon: Zap, color: '#f59e0b', targetType: 'cache' },
  { id: 'storage', label: 'Storage (S3) Failure', icon: Globe, color: '#14b8a6', targetType: 'storage' },
  { id: 'payment', label: 'Payment Gateway Timeout', icon: CreditCard, color: '#ec4899', targetType: 'payment' },
  { id: 'auth', label: 'Auth Service Failure', icon: Lock, color: '#ef4444', targetType: 'auth' },
  { id: 'external_api', label: 'External API Failure', icon: CloudLightning, color: '#f97316', targetType: 'external_api' }
];

export function FailureSimulatorPanel({
  architecture,
  activeFailureState,
  onFailureStateChange
}) {
  const [selectedTarget, setSelectedTarget] = useState('database');
  const [failureResult, setFailureResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const comps = architecture?.components || [];

  const runFailureSimulation = async (targetType) => {
    setIsSimulating(true);
    const res = await simulateFailureApi({
      architecture,
      failure_target_type: targetType
    });
    setFailureResult(res);
    setIsSimulating(false);

    if (onFailureStateChange) {
      onFailureStateChange({
        isActive: true,
        targetType,
        failedIds: res.failed_component_ids || [],
        cascadedIds: res.cascaded_failed_component_ids || []
      });
    }
  };

  const handleClearFailure = () => {
    setFailureResult(null);
    if (onFailureStateChange) {
      onFailureStateChange({
        isActive: false,
        targetType: null,
        failedIds: [],
        cascadedIds: []
      });
    }
  };

  // Derive human-readable cascade chain
  const getCascadeChain = (targetType) => {
    switch (targetType) {
      case 'database':
        return {
          origin: 'Primary PostgreSQL Database',
          dependent: 'Order Service & Product Catalog Microservices',
          userImpact: 'Checkout & Transaction Creation Halted (HTTP 500)'
        };
      case 'gateway':
        return {
          origin: 'Central API Gateway',
          dependent: 'All Upstream Client Endpoints & Webhooks',
          userImpact: 'Mobile & Web Frontends Disconnected from APIs'
        };
      case 'cache':
        return {
          origin: 'Redis In-Memory Cache Cluster',
          dependent: 'Primary Database (Cache-Miss Stampede)',
          userImpact: 'Slow Page Loads & Database Connection Timeouts'
        };
      case 'payment':
        return {
          origin: 'Stripe / Payment Gateway Microservice',
          dependent: 'Order Processing & Cart Checkout',
          userImpact: 'Customer Transactions Rejected; Cart Abandonment'
        };
      case 'auth':
        return {
          origin: 'Authentication & Identity Service',
          dependent: 'API Gateway JWT Validator & Protected APIs',
          userImpact: 'User Sign-in & Authorized Requests Blocked (HTTP 401)'
        };
      case 'storage':
        return {
          origin: 'S3 / Cloud Object Storage',
          dependent: 'Static Media Server & Upload Handlers',
          userImpact: 'File Uploads & Image Previews Broken'
        };
      case 'external_api':
        return {
          origin: 'External 3rd-Party Partner API',
          dependent: 'Integration Sync Microservice',
          userImpact: 'Third-party Data Enrichment Unavailable'
        };
      default:
        return {
          origin: 'Backend Compute Cluster',
          dependent: 'API Gateway Routes',
          userImpact: 'Service Degraded & Fallback Responses Triggered'
        };
    }
  };

  const chain = getCascadeChain(activeFailureState?.targetType || selectedTarget);

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      <div>
        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px 0' }}>
          Architectural Failure & Cascade Simulator
        </h4>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Select an outage scenario to inspect the multi-tier failure cascade, dependent service impacts, and user feature disruptions.
        </span>
      </div>

      {/* Target Selector Grid (All 8 Scenarios) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {FAILURE_TARGETS.map((t) => {
          const Icon = t.icon;
          const isCurrent = (activeFailureState?.targetType || selectedTarget) === t.id && activeFailureState?.isActive;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTarget(t.id);
                runFailureSimulation(t.id);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 4px',
                borderRadius: '6px',
                background: isCurrent ? 'rgba(244, 63, 94, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                border: isCurrent ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
                color: isCurrent ? '#f43f5e' : '#cbd5e1',
                cursor: 'pointer',
                fontSize: '0.64rem',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isCurrent ? '#f43f5e' : t.color} />
              <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Simulation Actions */}
      {activeFailureState?.isActive && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fda4af', fontSize: '0.74rem', fontWeight: 600 }}>
            <AlertOctagon size={16} color="#f43f5e" />
            <span>Outage Active (Nodes Pulsing Red on Diagram)</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleClearFailure} style={{ fontSize: '0.7rem' }}>
            <RotateCcw size={12} /> Clear Outage
          </button>
        </div>
      )}

      {/* Visual 3-Tier Cascade Path */}
      {activeFailureState?.isActive && (
        <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Outage Cascade Flow Path
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            {/* Step 1: Failed Origin */}
            <div style={{ width: '100%', background: 'rgba(244, 63, 94, 0.18)', border: '1px solid #f43f5e', borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: '#fda4af', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>FAILED COMPONENT</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{chain.origin}</span>
            </div>

            <ArrowDown size={14} color="#f43f5e" />

            {/* Step 2: Dependent Services */}
            <div style={{ width: '100%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: '#fde68a', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>DEPENDENT COMPONENTS</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fff' }}>{chain.dependent}</span>
            </div>

            <ArrowDown size={14} color="#f59e0b" />

            {/* Step 3: User-Impacted Features */}
            <div style={{ width: '100%', background: 'rgba(244, 63, 94, 0.12)', border: '1px dashed #f43f5e', borderRadius: '6px', padding: '8px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>USER-IMPACTED FEATURES</span>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fecdd3' }}>{chain.userImpact}</span>
            </div>
          </div>
        </div>
      )}

      {/* Impact Assessment Card */}
      {failureResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Blast Radius Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f43f5e' }}>
                {failureResult.failed_component_ids.length}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#fda4af' }}>Failed Origin</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
                {failureResult.cascaded_failed_component_ids.length}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#fed7aa' }}>Cascaded Impact</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                {failureResult.operational_component_ids.length}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#a7f3d0' }}>Operational</div>
            </div>
          </div>

          {/* Business Impact Card */}
          <div style={{ background: '#0b1120', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} />
              User Impact & Operational Risk
            </div>
            <p style={{ fontSize: '0.78rem', color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
              {failureResult.business_impact}
            </p>
          </div>

          {/* Recommended Mitigations */}
          <div style={{ background: '#0b1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              Architectural Mitigations & Failover Patterns
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {failureResult.mitigation_strategies.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.74rem', color: '#cbd5e1' }}>
                  <span style={{ color: '#38bdf8', marginTop: '1px' }}>🛡️</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
            ⚠️ {failureResult.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
