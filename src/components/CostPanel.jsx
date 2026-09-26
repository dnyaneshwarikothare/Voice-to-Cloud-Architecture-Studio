import React, { useState } from 'react';
import { DollarSign, Sliders, ChevronDown, ChevronUp, AlertCircle, Layers, AlertTriangle, Wallet, CheckCircle2 } from 'lucide-react';
import { calculateArchitectureCosts } from '../services/costService';
import { AVAILABLE_REGIONS } from '../data/mockPricing';

export function CostPanel({ architecture, assumptions, onAssumptionsChange, onUpdateArchitecture }) {
  const [providerFilter, setProviderFilter] = useState('both'); // 'both', 'aws', 'gcp'
  const [showConfig, setShowConfig] = useState(false);
  const [budgetMode, setBudgetMode] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState('INR'); // 'INR' or 'USD'
  const [monthlyBudget, setMonthlyBudget] = useState(10000); // ₹10,000 INR or $120 USD

  const costData = calculateArchitectureCosts(architecture, assumptions);
  const { aws, gcp, cheaperProvider, savingsDelta } = costData;

  const currentEst = budgetCurrency === 'INR' ? (aws.totalMonthly * 83.0) : aws.totalMonthly;
  const budgetDiff = currentEst - monthlyBudget;
  const isBudgetExceeded = budgetDiff > 0;

  const updateAssumption = (key, val) => {
    onAssumptionsChange({
      ...assumptions,
      [key]: val
    });
  };

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      {/* Top Controls: Provider Selection & Assumptions Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${providerFilter === 'both' ? 'active' : ''}`}
            onClick={() => setProviderFilter('both')}
          >
            AWS vs GCP
          </button>
          <button
            className={`view-tab aws ${providerFilter === 'aws' ? 'active' : ''}`}
            onClick={() => setProviderFilter('aws')}
          >
            AWS Only
          </button>
          <button
            className={`view-tab gcp ${providerFilter === 'gcp' ? 'active' : ''}`}
            onClick={() => setProviderFilter('gcp')}
          >
            GCP Only
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${budgetMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBudgetMode(!budgetMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', background: budgetMode ? '#0284c7' : undefined }}
          >
            <Wallet size={13} />
            {budgetMode ? 'Budget Mode: ON' : 'Budget Mode: OFF'}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowConfig(!showConfig)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem' }}
          >
            <Sliders size={13} />
            {showConfig ? 'Hide Assumptions' : 'Configure Assumptions'}
            {showConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Budget Mode Panel */}
      {budgetMode && (
        <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wallet size={14} color="#38bdf8" />
              Monthly Budget Constraint
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => {
                  setBudgetCurrency('INR');
                  setMonthlyBudget(10000);
                }}
                style={{
                  fontSize: '0.64rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: budgetCurrency === 'INR' ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ₹ INR
              </button>
              <button
                onClick={() => {
                  setBudgetCurrency('USD');
                  setMonthlyBudget(120);
                }}
                style={{
                  fontSize: '0.64rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: budgetCurrency === 'USD' ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                $ USD
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Set Target Budget:</span>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Math.max(10, parseInt(e.target.value) || 0))}
              style={{ width: '120px', fontSize: '0.74rem', padding: '4px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{budgetCurrency}/month</span>
          </div>

          {/* Budget Comparison Banner */}
          {isBudgetExceeded ? (
            <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#f43f5e" />
                  BUDGET EXCEEDED
                </span>
                <span style={{ fontSize: '0.7rem', color: '#fda4af', fontWeight: 600 }}>
                  Difference: +{budgetCurrency === 'INR' ? '₹' : '$'}{Math.round(budgetDiff).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                <span>Budget: <b>{budgetCurrency === 'INR' ? '₹' : '$'}{monthlyBudget.toLocaleString()}</b></span>
                <span>Estimated: <b>{budgetCurrency === 'INR' ? '₹' : '$'}{Math.round(currentEst).toLocaleString()}</b></span>
                <span style={{ color: '#f43f5e' }}>Over: <b>+{budgetCurrency === 'INR' ? '₹' : '$'}{Math.round(budgetDiff).toLocaleString()}</b></span>
              </div>

              {/* Actionable Alternatives */}
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                  Non-Destructive Cost-Reduction Alternatives:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {assumptions.computeTier !== 'small' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1', background: '#0b1120', padding: '4px 8px', borderRadius: '4px' }}>
                      <span>Downsize compute tier from {assumptions.computeTier} to <b>small</b> (saves ~$28/mo)</span>
                      <button
                        onClick={() => updateAssumption('computeTier', 'small')}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: '0.62rem', cursor: 'pointer' }}
                      >
                        Apply Recommendation
                      </button>
                    </div>
                  )}

                  {assumptions.computeInstances > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1', background: '#0b1120', padding: '4px 8px', borderRadius: '4px' }}>
                      <span>Scale compute instances from {assumptions.computeInstances} to <b>1</b> (saves ~$30/mo)</span>
                      <button
                        onClick={() => updateAssumption('computeInstances', 1)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: '0.62rem', cursor: 'pointer' }}
                      >
                        Apply Recommendation
                      </button>
                    </div>
                  )}

                  {assumptions.databaseTier !== 'small' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1', background: '#0b1120', padding: '4px 8px', borderRadius: '4px' }}>
                      <span>Downsize database tier to <b>small</b> (saves ~$35/mo)</span>
                      <button
                        onClick={() => updateAssumption('databaseTier', 'small')}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '3px', fontSize: '0.62rem', cursor: 'pointer' }}
                      >
                        Apply Recommendation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.72rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>Within Budget! Monthly surplus of <b>{budgetCurrency === 'INR' ? '₹' : '$'}{Math.abs(Math.round(budgetDiff)).toLocaleString()}</b>.</span>
            </div>
          )}
        </div>
      )}

      {/* Monthly Total Summary Cards */}
      <div className="cost-summary-card">
        {(providerFilter === 'both' || providerFilter === 'aws') && (
          <div className="cost-box aws">
            <span className="cost-provider-label">🟠 AWS Estimated Cost</span>
            <div className="cost-amount">${aws.totalMonthly.toFixed(2)}</div>
            <span className="cost-period">/ month (US East Region)</span>
          </div>
        )}

        {(providerFilter === 'both' || providerFilter === 'gcp') && (
          <div className="cost-box gcp">
            <span className="cost-provider-label">🔵 GCP Estimated Cost</span>
            <div className="cost-amount">${gcp.totalMonthly.toFixed(2)}</div>
            <span className="cost-period">/ month (us-central1 Region)</span>
          </div>
        )}
      </div>

      {providerFilter === 'both' && cheaperProvider !== 'Tie' && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.74rem',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>
            ✨ <b>{cheaperProvider}</b> is approximately <b>${savingsDelta.toFixed(2)}/mo</b> cheaper under these workload assumptions.
          </span>
        </div>
      )}

      {/* Assumptions Configuration Drawer */}
      {showConfig && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
            Workload & Sizing Assumptions
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Region */}
            <div className="slider-group">
              <div className="slider-header">
                <span>Deployment Region</span>
              </div>
              <select
                value={assumptions.region}
                onChange={(e) => updateAssumption('region', e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              >
                {AVAILABLE_REGIONS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Compute Tier */}
            <div className="slider-group">
              <div className="slider-header">
                <span>Compute Size</span>
                <b>{assumptions.computeTier.toUpperCase()}</b>
              </div>
              <select
                value={assumptions.computeTier}
                onChange={(e) => updateAssumption('computeTier', e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              >
                <option value="small">Small (2 vCPU, 2GB)</option>
                <option value="medium">Medium (2 vCPU, 4GB)</option>
                <option value="large">Large (2 vCPU, 8GB)</option>
                <option value="serverless">Serverless On-Demand</option>
              </select>
            </div>
          </div>

          {/* Monthly Requests Slider */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Monthly Requests</span>
              <b>{(assumptions.monthlyRequests / 1000000).toFixed(1)} Million reqs</b>
            </div>
            <input
              type="range"
              min="100000"
              max="20000000"
              step="200000"
              value={assumptions.monthlyRequests}
              onChange={(e) => updateAssumption('monthlyRequests', Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Database Storage Slider */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Database Storage (SSD)</span>
              <b>{assumptions.databaseStorageGb} GB</b>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={assumptions.databaseStorageGb}
              onChange={(e) => updateAssumption('databaseStorageGb', Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Cache Memory Slider */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Redis Cache Memory</span>
              <b>{assumptions.cacheMemoryGb} GB</b>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={assumptions.cacheMemoryGb}
              onChange={(e) => updateAssumption('cacheMemoryGb', Number(e.target.value))}
              className="range-slider"
            />
          </div>

          {/* Bandwidth / Egress Traffic Slider */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Outbound Bandwidth / Egress</span>
              <b>{assumptions.trafficOutGb} GB / mo</b>
            </div>
            <input
              type="range"
              min="10"
              max="2000"
              step="50"
              value={assumptions.trafficOutGb}
              onChange={(e) => updateAssumption('trafficOutGb', Number(e.target.value))}
              className="range-slider"
            />
          </div>
        </div>
      )}

      {/* Itemized Service Cost Breakdown */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
          Line-by-Line Service Mapping & Estimated Rates
        </div>

        <table className="cost-table">
          <thead>
            <tr>
              <th>Component</th>
              {(providerFilter === 'both' || providerFilter === 'aws') && <th>AWS Service & Cost</th>}
              {(providerFilter === 'both' || providerFilter === 'gcp') && <th>GCP Service & Cost</th>}
            </tr>
          </thead>
          <tbody>
            {architecture.components.map((comp, idx) => {
              const awsItem = aws.items.find(i => i.componentId === comp.id);
              const gcpItem = gcp.items.find(i => i.componentId === comp.id);

              return (
                <tr key={comp.id || idx}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{comp.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{comp.type}</div>
                  </td>

                  {(providerFilter === 'both' || providerFilter === 'aws') && (
                    <td>
                      <div style={{ color: '#fed7aa', fontWeight: 600 }}>
                        ${awsItem ? awsItem.monthlyCost.toFixed(2) : '0.00'} / mo
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {awsItem ? awsItem.cloudService : ''}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {awsItem ? awsItem.details : ''}
                      </div>
                    </td>
                  )}

                  {(providerFilter === 'both' || providerFilter === 'gcp') && (
                    <td>
                      <div style={{ color: '#bfdbfe', fontWeight: 600 }}>
                        ${gcpItem ? gcpItem.monthlyCost.toFixed(2) : '0.00'} / mo
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {gcpItem ? gcpItem.cloudService : ''}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {gcpItem ? gcpItem.details : ''}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="disclaimer-text">
        ⚠️ Estimated cost based on the selected assumptions (baseline demo rates). Connect real AWS/GCP Cost Explorer APIs for live enterprise billing.
      </div>
    </div>
  );
}
