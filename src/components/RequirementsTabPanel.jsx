import React from 'react';
import { Sparkles, Shield, Cpu, Database, CheckCircle2, Users, SlidersHorizontal, Activity } from 'lucide-react';

export function RequirementsTabPanel({
  requirements,
  onOpenClarificationModal
}) {
  if (!requirements) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
        No requirements analyzed yet. Type or speak an idea to generate requirements.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Structured Requirements Specification
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Extracted domain, technical requirements, and capacity constraints.
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenClarificationModal}
          style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <SlidersHorizontal size={13} />
          Refine Details
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {/* Domain & Expected Users */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Application Type
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
              {requirements.application_type || 'Web Application'}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Expected Users
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#a855f7', marginTop: '2px' }}>
              {requirements.expected_users || '10,000 – 100,000'}
            </div>
          </div>
        </div>

        {/* Main Features */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#10b981" />
            Core Features & Functional Scope
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(requirements.main_features || []).map((feat, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  color: '#c7d2fe',
                  fontWeight: 500
                }}
              >
                ✔ {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Data & Storage Requirements */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="#f59e0b" />
            Data & Persistence Requirements
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(requirements.data_requirements || []).map((d, idx) => (
              <div key={idx} style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                • {d}
              </div>
            ))}
          </div>
        </div>

        {/* Security Requirements */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} color="#f43f5e" />
            Security & Compliance Standards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(requirements.security_requirements || []).map((s, idx) => (
              <div key={idx} style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                🛡️ {s}
              </div>
            ))}
          </div>
        </div>

        {/* Performance & Availability */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={13} /> Performance SLA
            </span>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
              {(requirements.performance_requirements || ['Sub-150ms latency'])[0]}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} /> Availability SLA
            </span>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
              {(requirements.availability_requirements || ['99.9% High Availability'])[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
