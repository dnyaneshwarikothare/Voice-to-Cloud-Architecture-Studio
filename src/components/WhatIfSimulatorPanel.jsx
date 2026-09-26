import React, { useState } from 'react';
import { runWhatIfApi } from '../services/apiService';
import {
  HelpCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: 'What if traffic becomes 10x higher?',
    name: '10x Black Friday Traffic Surge',
    type: 'traffic_increase',
    params: { multiplier: 10, current_users: 10000, current_rps: 100 }
  },
  {
    title: 'What if PostgreSQL fails?',
    name: 'Primary Database Outage',
    type: 'component_failure',
    params: { target_type: 'database' }
  },
  {
    title: 'What if I remove Redis?',
    name: 'Remove In-Memory Cache Tier',
    type: 'component_removal',
    params: { target_id: 'redis' }
  },
  {
    title: 'What if monthly budget is ₹10,000 ($120)?',
    name: 'Budget Cap ₹10,000/mo',
    type: 'budget_constraint',
    params: { budget: 120, currency: 'USD' }
  },
  {
    title: 'What if users grow from 10k to 1 million?',
    name: '1 Million Users Scaling',
    type: 'user_growth',
    params: { new_users: 1000000 }
  },
  {
    title: 'What if I change Node.js to Python/FastAPI?',
    name: 'Runtime Migration to Python',
    type: 'technology_change',
    params: { from_tech: 'Node.js', to_tech: 'Python/FastAPI' }
  }
];

export function WhatIfSimulatorPanel({ architecture, onApplySimulatedArchitecture }) {
  const [scenarioName, setScenarioName] = useState('10x Traffic Spike');
  const [scenarioType, setScenarioType] = useState('traffic_increase');
  const [multiplier, setMultiplier] = useState(10);
  const [targetComponent, setTargetComponent] = useState(
    architecture?.components?.find(c => c.type === 'database')?.id || 'database'
  );
  const [budgetVal, setBudgetVal] = useState(100);
  const [userGrowthVal, setUserGrowthVal] = useState(1000000);
  const [toTechVal, setToTechVal] = useState('Python/FastAPI');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(null);

  const handleRunSimulation = async (overrideParams = null, overrideType = null, overrideName = null) => {
    setIsLoading(true);
    setLoadingStep('Analyzing current architecture topology...');

    const typeToUse = overrideType || scenarioType;
    const nameToUse = overrideName || scenarioName;

    let params = overrideParams || {};
    if (!overrideParams) {
      if (typeToUse === 'traffic_increase' || typeToUse === 'traffic_decrease') {
        params = { multiplier, current_users: 10000, current_rps: 100 };
      } else if (typeToUse === 'component_failure' || typeToUse === 'component_removal') {
        params = { target_id: targetComponent, target_type: 'database' };
      } else if (typeToUse === 'budget_constraint') {
        params = { budget: budgetVal, currency: 'USD' };
      } else if (typeToUse === 'user_growth') {
        params = { new_users: userGrowthVal };
      } else if (typeToUse === 'technology_change') {
        params = { from_tech: 'Node.js', to_tech: toTechVal };
      }
    }

    // Step 2 simulated delay for visual feedback
    setTimeout(() => {
      setLoadingStep('Calculating traffic and dependency impact...');
    }, 250);

    setTimeout(() => {
      setLoadingStep('Generating recommendations and bottlenecks...');
    }, 500);

    setTimeout(async () => {
      try {
        const res = await runWhatIfApi(architecture, nameToUse, typeToUse, params);
        setResult(res);
      } catch (err) {
        console.error('What-If simulation failed:', err);
      } finally {
        setIsLoading(false);
        setLoadingStep('');
      }
    }, 750);
  };

  const handleSelectPreset = (preset) => {
    setScenarioName(preset.name);
    setScenarioType(preset.type);
    if (preset.params.multiplier) setMultiplier(preset.params.multiplier);
    if (preset.params.budget) setBudgetVal(preset.params.budget);
    if (preset.params.new_users) setUserGrowthVal(preset.params.new_users);
    handleRunSimulation(preset.params, preset.type, preset.name);
  };

  const handleReset = () => {
    setResult(null);
    setScenarioName('10x Traffic Spike');
    setScenarioType('traffic_increase');
    setMultiplier(10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(129, 140, 248, 0.08))', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
            Architecture What-If Simulator
          </span>
          <span className="opt-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.62rem' }}>
            SCENARIO-BASED
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Experiment with hypothetical conditions before building real infrastructure.
          Calculate component saturation, cost changes, and failure blast-radii.
        </p>
      </div>

      {/* Suggested Quick Question Chips */}
      <div>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
          💡 Try Common Questions:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              className="action-chip"
              onClick={() => handleSelectPreset(p)}
              style={{
                fontSize: '0.68rem',
                background: scenarioName === p.name ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: scenarioName === p.name ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: scenarioName === p.name ? '#38bdf8' : '#cbd5e1',
                padding: '4px 10px',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Controls Card */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Scenario Name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="glass-input"
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Scenario Type
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              style={{ width: '100%', fontSize: '0.75rem', padding: '6px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            >
              <option value="traffic_increase">1. Traffic Increase (Surge)</option>
              <option value="traffic_decrease">2. Traffic Decrease (Low Season)</option>
              <option value="component_failure">3. Component Failure (Outage)</option>
              <option value="component_removal">4. Component Removal</option>
              <option value="component_addition">5. Component Addition</option>
              <option value="technology_change">6. Technology Migration</option>
              <option value="budget_constraint">7. Budget Constraint</option>
              <option value="storage_growth">8. Storage Growth</option>
              <option value="user_growth">9. User Growth (Scale)</option>
              <option value="custom">10. Custom Scenario</option>
            </select>
          </div>
        </div>

        {/* Dynamic Parameter Section */}
        <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
          {scenarioType === 'traffic_increase' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '6px' }}>
                <span>Traffic Multiplier:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{multiplier}x Peak Load ({ (100 * multiplier).toLocaleString() } RPS)</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={multiplier}
                onChange={(e) => setMultiplier(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>
                <span>2x (~200 RPS)</span>
                <span>10x (Black Friday)</span>
                <span>50x (Flash Sale 5,000 RPS)</span>
              </div>
            </div>
          )}

          {(scenarioType === 'component_failure' || scenarioType === 'component_removal') && (
            <div>
              <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Select Target Component to {scenarioType === 'component_failure' ? 'Fail' : 'Remove'}:
              </label>
              <select
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
              >
                {architecture?.components?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role || c.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {scenarioType === 'budget_constraint' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '6px' }}>
                <span>Monthly Budget Cap:</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>${budgetVal}/month (approx. ₹{(budgetVal * 83).toLocaleString()})</span>
              </div>
              <input
                type="range"
                min="25"
                max="1000"
                step="25"
                value={budgetVal}
                onChange={(e) => setBudgetVal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
            </div>
          )}

          {scenarioType === 'user_growth' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '6px' }}>
                <span>Projected User Horizon:</span>
                <span style={{ fontWeight: 700, color: '#a855f7' }}>{userGrowthVal.toLocaleString()} Users</span>
              </div>
              <input
                type="range"
                min="50000"
                max="5000000"
                step="50000"
                value={userGrowthVal}
                onChange={(e) => setUserGrowthVal(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>
          )}

          {scenarioType === 'technology_change' && (
            <div>
              <label style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Migrate Backend Services To:
              </label>
              <select
                value={toTechVal}
                onChange={(e) => setToTechVal(e.target.value)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
              >
                <option value="Python/FastAPI">Python / FastAPI (Async ASGI + AI)</option>
                <option value="Node.js/Express">Node.js / Express (TypeScript)</option>
                <option value="Go/Fiber">Go / Fiber (High Concurrency)</option>
                <option value="Java/Spring Boot">Java / Spring Boot (Enterprise)</option>
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleRunSimulation()}
            disabled={isLoading}
            className="primary-btn"
            style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Play size={14} />
            {isLoading ? 'Simulating...' : 'Run What-If Simulation'}
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="secondary-btn"
            style={{ padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="pulse-indicator" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
            <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{loadingStep}</span>
          </div>
        )}
      </div>

      {/* Simulation Results Display */}
      {result && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Delta Highlights Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'block' }}>Throughput</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                {result.traffic_impact?.projected_rps} RPS
              </span>
              <span style={{ fontSize: '0.62rem', color: result.delta?.rps_delta > 0 ? '#38bdf8' : '#94a3b8', display: 'block' }}>
                +{result.delta?.rps_delta} RPS delta
              </span>
            </div>

            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'block' }}>Backend Saturation</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: result.performance_impact?.backend_load_pct > 80 ? '#f43f5e' : (result.performance_impact?.backend_load_pct > 60 ? '#f59e0b' : '#10b981') }}>
                {result.performance_impact?.backend_load_pct}%
              </span>
              <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block' }}>
                Latency: ~{result.performance_impact?.avg_latency_ms}ms
              </span>
            </div>

            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'block' }}>DB Pressure</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: result.performance_impact?.database_load_pct > 80 ? '#f43f5e' : '#10b981' }}>
                {result.performance_impact?.database_load_pct}%
              </span>
              <span style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'block' }}>
                Cache hit: {result.performance_impact?.cache_hit_rate_pct}%
              </span>
            </div>

            <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px 10px' }}>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'block' }}>Est. Cost (AWS)</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                ${result.cost_impact?.simulated_aws_cost}
              </span>
              <span style={{ fontSize: '0.62rem', color: result.delta?.cost_delta_usd >= 0 ? '#f43f5e' : '#10b981', display: 'block' }}>
                {result.delta?.cost_delta_usd >= 0 ? `+$${result.delta?.cost_delta_usd}/mo` : `-$${Math.abs(result.delta?.cost_delta_usd)}/mo`}
              </span>
            </div>
          </div>

          {/* Bottlenecks Detected */}
          {result.bottlenecks?.length > 0 && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={14} color="#f43f5e" />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fda4af' }}>
                  Critical Bottlenecks Detected Under Scenario
                </span>
              </div>
              {result.bottlenecks.map((b, idx) => (
                <div key={idx} style={{ fontSize: '0.72rem', color: '#fecdd3', marginBottom: '4px' }}>
                  • <b>{b.component}:</b> {b.metric} — {b.explanation}
                </div>
              ))}
            </div>
          )}

          {/* Actionable Recommendations */}
          <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="#38bdf8" />
              Scenario-Based Recommendations:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.recommendations?.map((r, idx) => (
                <div key={idx} style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Optional apply simulated architecture */}
            {result.simulated_architecture && (
              <button
                onClick={() => onApplySimulatedArchitecture && onApplySimulatedArchitecture(result.simulated_architecture)}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Apply Simulated Architecture to Active Canvas
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
