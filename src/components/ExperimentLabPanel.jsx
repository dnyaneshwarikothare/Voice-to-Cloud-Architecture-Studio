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
      name: 'Base Architecture',
      description: 'Current live baseline architecture.',
      architecture: JSON.parse(JSON.stringify(architecture)),
      traffic: '10,000 users • 100 RPS',
      cost: '$215.00/mo',
      health: 89,
      status: 'Active'
    },
    {
      id: 'exp_a',
      name: 'Scenario A: 10,000 Users (Lean MVP)',
      description: 'Single-AZ baseline with serverless compute and burstable database.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture)),
        project_name: 'Scenario A: Lean MVP'
      },
      traffic: '10,000 users • 50 RPS',
      cost: '$85.00/mo',
      health: 80,
      status: 'Ready'
    },
    {
      id: 'exp_b',
      name: 'Scenario B: 100,000 Users (Balanced Production)',
      description: 'Multi-AZ load balanced compute, Redis caching cluster, automated backups.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture)),
        project_name: 'Scenario B: Balanced Production'
      },
      traffic: '100,000 users • 450 RPS',
      cost: '$320.00/mo',
      health: 94,
      status: 'Ready'
    },
    {
      id: 'exp_c',
      name: 'Scenario C: 1,000,000 Users (High Scalability Enterprise)',
      description: 'Global CloudFront CDN, distributed Redis cluster, Aurora Multi-AZ with read replicas.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture)),
        project_name: 'Scenario C: Enterprise Scale'
      },
      traffic: '1,000,000 users • 2,500 RPS',
      cost: '$940.00/mo',
      health: 98,
      status: 'Ready'
    },
    {
      id: 'exp_d',
      name: 'Scenario D: Database Outage Resilience',
      description: 'Evaluates circuit breaker fallbacks, dead-letter message queues, and read caches during DB downtime.',
      architecture: {
        ...JSON.parse(JSON.stringify(architecture)),
        project_name: 'Scenario D: Outage Isolation'
      },
      traffic: '50,000 users • Outage Simulation',
      cost: '$240.00/mo',
      health: 65,
      status: 'Ready'
    }
  ]);

  const [activeExpId, setActiveExpId] = useState('exp_base');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreateExperiment = () => {
    const newId = `exp_${Date.now()}`;
    const newExp = {
      id: newId,
      name: `Scenario ${String.fromCharCode(65 + experiments.length - 1)}: Custom Experiment`,
      description: 'Branch created from current active canvas.',
      architecture: JSON.parse(JSON.stringify(architecture)),
      traffic: '50,000 users • 200 RPS',
      cost: '$215.00/mo',
      health: 85,
      status: 'Ready'
    };
    setExperiments(prev => [...prev, newExp]);
  };

  const handleDuplicate = (exp) => {
    const newId = `exp_${Date.now()}`;
    const clone = {
      ...JSON.parse(JSON.stringify(exp)),
      id: newId,
      name: `${exp.name} (Copy)`
    };
    setExperiments(prev => [...prev, clone]);
  };

  const handleDelete = (id) => {
    if (experiments.length <= 1) return;
    setExperiments(prev => prev.filter(e => e.id !== id));
    if (activeExpId === id) setActiveExpId(experiments[0].id);
  };

  const handleStartRename = (exp) => {
    setEditingId(exp.id);
    setEditName(exp.name);
  };

  const handleSaveRename = (id) => {
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, name: editName } : e));
    setEditingId(null);
  };

  const handleActivate = (exp) => {
    setActiveExpId(exp.id);
    if (onSwitchArchitecture) {
      onSwitchArchitecture(exp.architecture);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Banner */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Architecture Experiment Lab
            </span>
          </div>
          <button
            onClick={handleCreateExperiment}
            className="primary-btn"
            style={{ fontSize: '0.68rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} />
            New Experiment
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Branch and test multiple independent architecture scenarios (e.g. 10k users vs 1M users, low budget, failure isolation) without altering your baseline architecture.
        </p>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onNavigateToCompare}
          className="secondary-btn"
          style={{ flex: 1, padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Layers size={13} color="#38bdf8" />
          Compare All Experiments Side-by-Side
        </button>
      </div>

      {/* Experiments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {experiments.map((exp) => {
          const isActive = activeExpId === exp.id;
          return (
            <div
              key={exp.id}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.08)' : '#0b1120',
                border: isActive ? '1px solid #38bdf8' : '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  {editingId === exp.id ? (
                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '0.75rem', padding: '4px 6px', flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                      />
                      <button
                        onClick={() => handleSaveRename(exp.id)}
                        className="primary-btn"
                        style={{ fontSize: '0.64rem', padding: '2px 8px' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#38bdf8' : '#f8fafc' }}>
                      {exp.name}
                    </span>
                  )}
                  {isActive && (
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                      ACTIVE CANVAS
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleStartRename(exp)}
                    title="Rename Experiment"
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(exp)}
                    title="Duplicate Scenario"
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    <Copy size={13} />
                  </button>
                  {experiments.length > 1 && (
                    <button
                      onClick={() => handleDelete(exp.id)}
                      title="Delete Scenario"
                      style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                {exp.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.68rem', color: '#cbd5e1', background: '#070b14', padding: '6px 10px', borderRadius: '4px' }}>
                <span><b>Traffic:</b> {exp.traffic}</span>
                <span><b>Cost:</b> {exp.cost}</span>
                <span><b>Health:</b> {exp.health}/100</span>
              </div>

              {!isActive && (
                <button
                  onClick={() => handleActivate(exp)}
                  className="secondary-btn"
                  style={{ width: '100%', fontSize: '0.7rem', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Play size={12} />
                  Load & Experiment on Canvas
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
