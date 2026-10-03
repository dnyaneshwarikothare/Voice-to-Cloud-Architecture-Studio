import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export function ExperimentLabPanel({
  architecture,
  onSwitchArchitecture,
  onNavigateToCompare
}) {
  const [experiments, setExperiments] = useState([
    {
      id: 'exp_base',
      name: 'Baseline Architecture',
      description: 'Current live active architecture topology.',
      architecture: JSON.parse(JSON.stringify(architecture || {})),
      traffic: '10,000 users • 100 RPS',
      cost: '$120.00/mo',
      health: 88,
      status: 'Active'
    },
    {
      id: 'exp_a',
      name: 'Scenario A: 10,000 Users (Lean MVP)',
      description: 'Single-AZ baseline with serverless compute and burstable database.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture || {})),
        project_name: 'Scenario A: Lean MVP'
      },
      traffic: '10,000 users • 50 RPS',
      cost: '$65.00/mo',
      health: 80,
      status: 'Ready'
    },
    {
      id: 'exp_b',
      name: 'Scenario B: 100,000 Users (Balanced Production)',
      description: 'Multi-AZ load balanced compute, Redis caching cluster, automated backups.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture || {})),
        project_name: 'Scenario B: Balanced Production'
      },
      traffic: '100,000 users • 450 RPS',
      cost: '$280.00/mo',
      health: 94,
      status: 'Ready'
    },
    {
      id: 'exp_c',
      name: 'Scenario C: 1,000,000 Users (Enterprise Scale)',
      description: 'Global CloudFront CDN, distributed Redis cluster, Multi-AZ with read replicas.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture || {})),
        project_name: 'Scenario C: Enterprise Scale'
      },
      traffic: '1,000,000 users • 2,500 RPS',
      cost: '$850.00/mo',
      health: 98,
      status: 'Ready'
    }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={20} color="#7c3aed" />
              <span>Experiment &amp; Scenario Lab</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Create isolated architecture sandbox scenarios to test traffic thresholds, tier adjustments, and budget allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {experiments.map(exp => (
          <div
            key={exp.id}
            className="card"
            style={{
              background: '#ffffff',
              border: `1px solid ${exp.status === 'Active' ? '#3b82f6' : '#e2e8f0'}`,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className={`badge ${exp.status === 'Active' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.66rem' }}>
                {exp.status}
              </span>
              <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{exp.cost}</strong>
            </div>

            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {exp.name}
            </h4>

            <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              {exp.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Traffic Profile:</span>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{exp.traffic}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Health Index:</span>
                <div style={{ fontWeight: 600, color: '#16a34a', marginTop: '2px' }}>{exp.health} / 100</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              {onSwitchArchitecture && exp.status !== 'Active' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSwitchArchitecture(exp.architecture)}
                  style={{ fontSize: '0.74rem' }}
                >
                  Load Scenario
                </button>
              )}
              {onNavigateToCompare && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigateToCompare(exp.architecture)}
                  style={{ fontSize: '0.74rem' }}
                >
                  <span>Compare</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
