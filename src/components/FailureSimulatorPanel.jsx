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
  Layers,
  Play
} from 'lucide-react';
import { simulateFailureApi } from '../services/apiService';

const FAILURE_TARGETS = [
  { id: 'database', label: 'Database Outage', icon: Database, color: '#16a34a', targetType: 'database' },
  { id: 'backend', label: 'Backend Crash', icon: Server, color: '#2563eb', targetType: 'backend' },
  { id: 'gateway', label: 'API Gateway Down', icon: Split, color: '#0284c7', targetType: 'gateway' },
  { id: 'cache', label: 'Redis Cache Outage', icon: Zap, color: '#d97706', targetType: 'cache' },
  { id: 'storage', label: 'Storage (S3) Failure', icon: Globe, color: '#059669', targetType: 'storage' },
  { id: 'payment', label: 'Payment Gateway Timeout', icon: CreditCard, color: '#db2777', targetType: 'payment' },
  { id: 'auth', label: 'Auth Service Failure', icon: Lock, color: '#dc2626', targetType: 'auth' },
  { id: 'external_api', label: 'External API Failure', icon: CloudLightning, color: '#ea580c', targetType: 'external_api' }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#dc2626" />
              <span>Chaos &amp; Failure Mode Simulator</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Simulates component outage blast radius and identifies cascading dependency failures.
            </p>
          </div>

          {activeFailureState?.isActive && (
            <button className="btn btn-secondary btn-sm" onClick={handleClearFailure} style={{ fontSize: '0.74rem' }}>
              <RotateCcw size={13} />
              <span>Reset Failure State</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Selector */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
          Select Outage Scenario to Inject:
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
          {FAILURE_TARGETS.map(target => {
            const Icon = target.icon;
            const isSelected = selectedTarget === target.id;
            const isTargetInArch = comps.some(c => c.type === target.targetType);

            return (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${target.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={target.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                    {target.label}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: isTargetInArch ? '#16a34a' : '#94a3b8' }}>
                    {isTargetInArch ? 'Active in System' : 'Not configured'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => runFailureSimulation(selectedTarget)}
            disabled={isSimulating}
            style={{ fontSize: '0.76rem', background: '#dc2626', borderColor: '#b91c1c' }}
          >
            <Play size={13} />
            <span>{isSimulating ? 'Simulating Outage...' : 'Inject Outage &amp; Analyze Blast Radius'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Result */}
      {failureResult && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #fecaca', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#dc2626" />
              <strong style={{ fontSize: '0.92rem', color: '#991b1b' }}>Blast-Radius Analysis Report</strong>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
              Risk: {failureResult.risk_level || 'High'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.76rem' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', padding: '10px' }}>
              <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '4px' }}>Primary Failed Services:</strong>
              <div style={{ color: '#7f1d1d' }}>
                {failureResult.failed_component_ids?.join(', ') || 'Target node'}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px' }}>
              <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>Cascaded Impact Nodes:</strong>
              <div style={{ color: '#78350f' }}>
                {failureResult.cascaded_failed_component_ids?.length > 0
                  ? failureResult.cascaded_failed_component_ids.join(', ')
                  : 'Zero cascaded outages detected (decoupled).'}
              </div>
            </div>
          </div>

          {failureResult.mitigations && failureResult.mitigations.length > 0 && (
            <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', fontSize: '0.76rem' }}>
              <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px' }}>Recommended Resiliency Mitigations:</strong>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#166534' }}>
                {failureResult.mitigations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
