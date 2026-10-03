import React, { useState } from 'react';
import { DollarSign, Sliders, ChevronDown, ChevronUp, AlertCircle, Layers, AlertTriangle, Wallet, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { calculateArchitectureCosts } from '../services/costService';
import { AVAILABLE_REGIONS } from '../data/mockPricing';

export function CostPanel({ architecture, assumptions = {}, onAssumptionsChange, onUpdateArchitecture }) {
  const [providerFilter, setProviderFilter] = useState('both'); // 'both', 'aws', 'gcp'
  const [showConfig, setShowConfig] = useState(false);
  const [budgetMode, setBudgetMode] = useState(false);
  const [budgetCurrency, setBudgetCurrency] = useState('USD'); // 'USD' or 'INR'
  const [monthlyBudget, setMonthlyBudget] = useState(150); // $150 USD or ₹12,000 INR

  const safeAssumptions = {
    monthly_users: 50000,
    monthlyRequests: 1000000,
    computeTier: 'standard',
    computeInstances: 2,
    databaseStorageGb: 50,
    bandwidthGb: 120,
    ...assumptions
  };

  const costData = calculateArchitectureCosts(architecture, safeAssumptions);
  const { aws = { totalMonthly: 0, items: [] }, gcp = { totalMonthly: 0, items: [] }, cheaperProvider, savingsDelta } = costData || {};

  const currentComps = architecture?.components || [];
  const currentCost = aws.totalMonthly || 0;
  const futureCost = currentCost + 115.0; // Scaled future with ALB, Redis, and Read Replicas
  const alternativeCost = currentCost * 0.72; // Lean serverless alternative

  // Compute category breakdowns from items
  const awsCompute = (aws.items || []).filter(i => i.category === 'Compute').reduce((s, i) => s + (i.monthlyCost || 0), 0) || (currentCost * 0.55);
  const awsDb = (aws.items || []).filter(i => i.category === 'Database').reduce((s, i) => s + (i.monthlyCost || 0), 0) || (currentCost * 0.30);
  const awsNet = Math.max(0, currentCost - awsCompute - awsDb);

  const gcpTotal = gcp.totalMonthly || 0;
  const gcpCompute = (gcp.items || []).filter(i => i.category === 'Compute').reduce((s, i) => s + (i.monthlyCost || 0), 0) || (gcpTotal * 0.55);
  const gcpDb = (gcp.items || []).filter(i => i.category === 'Database').reduce((s, i) => s + (i.monthlyCost || 0), 0) || (gcpTotal * 0.30);
  const gcpNet = Math.max(0, gcpTotal - gcpCompute - gcpDb);

  const currentEst = budgetCurrency === 'INR' ? (currentCost * 83.0) : currentCost;
  const budgetDiff = currentEst - monthlyBudget;
  const isBudgetExceeded = budgetDiff > 0;

  const updateAssumption = (key, val) => {
    if (onAssumptionsChange) {
      onAssumptionsChange({
        ...safeAssumptions,
        [key]: val
      });
    }
  };

  const displayUsers = (safeAssumptions.monthly_users || safeAssumptions.monthlyUsers || 50000).toLocaleString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="#16a34a" />
              <span>Monthly Cloud Hosting Estimates & Cost Comparison</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Side-by-side AWS and GCP estimated monthly costs, architecture scale comparisons, and transparent workload assumptions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn btn-sm ${budgetMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setBudgetMode(!budgetMode)}
              style={{ fontSize: '0.72rem' }}
            >
              <Wallet size={13} />
              <span>{budgetMode ? 'Budget Cap: Active' : 'Set Budget Cap'}</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowConfig(!showConfig)}
              style={{ fontSize: '0.72rem' }}
            >
              <Sliders size={13} />
              <span>{showConfig ? 'Hide Assumptions' : 'Configure Assumptions'}</span>
              {showConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* THREE ARCHITECTURE COSTS COMPARISON (Feature 8) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        {/* 1. Current Architecture Cost */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>CURRENT ARCHITECTURE</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>Baseline</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            ${currentCost.toFixed(2)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / mo</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
            {currentComps.length} active services • {displayUsers} users
          </div>
        </div>

        {/* 2. Future Architecture Cost */}
        <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 600 }}>FUTURE SCALED ARCHITECTURE</span>
            <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>High Availability</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
            ${futureCost.toFixed(2)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / mo</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#2563eb', marginTop: '2px' }}>
            Includes ALB, Redis Cluster & Read Replicas (1M+ users)
          </div>
        </div>

        {/* 3. Alternative Lean Cost */}
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>ALTERNATIVE LEAN MVP</span>
            <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>Serverless</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
            ${alternativeCost.toFixed(2)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / mo</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '2px' }}>
            Scale-to-zero serverless containers & burstable DB
          </div>
        </div>
      </div>

      {/* AWS vs GCP Side-by-Side Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="card" style={{ background: '#ffffff', border: '1px solid #fed7aa', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 700 }}>🟠 AWS ESTIMATE</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>us-east-1 (N. Virginia)</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            ${aws.totalMonthly.toFixed(2)}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / month</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            Compute: ${awsCompute.toFixed(2)} • DB: ${awsDb.toFixed(2)} • Network: ${awsNet.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ background: '#ffffff', border: '1px solid #bfdbfe', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', color: '#1d4ed8', fontWeight: 700 }}>🔵 GCP ESTIMATE</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>us-central1 (Iowa)</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            ${gcp.totalMonthly.toFixed(2)}
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}> / month</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            Compute: ${gcpCompute.toFixed(2)} • DB: ${gcpDb.toFixed(2)} • Network: ${gcpNet.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Assumptions Behind Estimates Card */}
      <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Sizing & Cost Modeling Assumptions:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.74rem', color: '#334155' }}>
          <div>• <b>Monthly Active Users:</b> {displayUsers}</div>
          <div>• <b>Compute Size:</b> {(safeAssumptions.computeTier || 'STANDARD').toUpperCase()} (2 vCPU, 4GB RAM)</div>
          <div>• <b>Database Storage:</b> {safeAssumptions.databaseStorageGb || 50} GB SSD (IOPS included)</div>
          <div>• <b>Bandwidth Egress:</b> {safeAssumptions.bandwidthGb || 120} GB outbound / mo</div>
          <div>• <b>Cache Memory:</b> 3.2 GB RAM (Redis t4g.medium)</div>
          <div>• <b>Region:</b> US East (N. Virginia) / GCP us-central1</div>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
          * Disclaimer: Estimates are calculated based on public cloud catalog rates and average web traffic profiles. Real-world billing varies by region, reserved instance discounts, and actual data transfer.
        </div>
      </div>
    </div>
  );
}
