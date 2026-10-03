import React, { useState } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  TrendingUp,
  DollarSign,
  HeartPulse,
  Cpu,
  Database,
  Zap,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe
} from 'lucide-react';

export function WhatIfSimulatorPanel({ architecture, onApplySimulatedArchitecture }) {
  const defaultComponents = architecture?.components || [];
  const defaultTypes = new Set(defaultComponents.map(c => c.type));

  // What-If State Variables as requested in Feature 6:
  // - Frontend technology
  // - Backend technology
  // - Database
  // - Cache
  // - Traffic
  // - Number of backend instances
  // - Cloud provider
  const [frontendTech, setFrontendTech] = useState(
    defaultComponents.find(c => c.type === 'frontend')?.technology || 'React (Vite SPA)'
  );
  const [backendTech, setBackendTech] = useState(
    defaultComponents.find(c => c.type === 'backend')?.technology || 'FastAPI (Python)'
  );
  const [databaseTech, setDatabaseTech] = useState(
    defaultComponents.find(c => c.type === 'database')?.technology || 'PostgreSQL'
  );
  const [hasCache, setHasCache] = useState(defaultTypes.has('cache'));
  const [cacheTech, setCacheTech] = useState('Redis In-Memory');
  const [monthlyTraffic, setMonthlyTraffic] = useState(100000); // 100k users
  const [backendInstances, setBackendInstances] = useState(
    defaultComponents.some(c => c.name?.includes('Cluster') || c.name?.includes('Replica')) ? 3 : 1
  );
  const [cloudProvider, setCloudProvider] = useState('aws');

  // Baseline Cost & Health
  const baseCost = defaultComponents.length * 28.5 + 35.0;
  const baseHealth = 74;

  // Real-time What-If calculations
  let calculatedCost = 25.0; // Base platform fee

  // Frontend Cost
  calculatedCost += frontendTech.includes('Next') ? 25.0 : 10.0;

  // Backend Cost per instance
  const backendCostPerUnit = backendTech.includes('Spring') ? 45.0 : (backendTech.includes('Go') ? 22.0 : 30.0);
  calculatedCost += backendCostPerUnit * backendInstances;

  // Load Balancer needed if >1 instance
  if (backendInstances > 1) {
    calculatedCost += 24.0; // ALB cost
  }

  // Database Cost
  calculatedCost += databaseTech.includes('Dynamo') ? 35.0 : (databaseTech.includes('Mongo') ? 58.0 : 54.0);

  // Cache Cost
  if (hasCache) {
    calculatedCost += cacheTech.includes('Redis') ? 29.0 : 20.0;
  }

  // Bandwidth Cost based on traffic
  calculatedCost += Math.round((monthlyTraffic / 10000) * 1.8);

  // Cloud provider variance
  if (cloudProvider === 'gcp') {
    calculatedCost *= 0.94; // GCP ~6% cheaper
  }

  // Health Score calculation
  let calculatedHealth = 50;
  if (backendInstances > 1) calculatedHealth += 16;
  if (hasCache) calculatedHealth += 14;
  if (monthlyTraffic > 500000 && backendInstances < 3) calculatedHealth -= 15;
  if (databaseTech === 'PostgreSQL' || databaseTech === 'Amazon DynamoDB') calculatedHealth += 10;
  if (hasCache && backendInstances >= 2) calculatedHealth += 10;
  calculatedHealth = Math.min(98, Math.max(35, calculatedHealth));

  const costDelta = calculatedCost - baseCost;
  const healthDelta = calculatedHealth - baseHealth;

  const handleApply = () => {
    if (!onApplySimulatedArchitecture) return;

    const newComps = [
      { id: 'web_ui', name: `Web UI (${frontendTech})`, type: 'frontend', technology: frontendTech },
      { id: 'api_server', name: `API Cluster (${backendInstances}x ${backendTech})`, type: 'backend', technology: backendTech },
      { id: 'primary_db', name: `Primary DB (${databaseTech})`, type: 'database', technology: databaseTech }
    ];

    if (backendInstances > 1) {
      newComps.splice(1, 0, {
        id: 'app_lb',
        name: 'Application Load Balancer',
        type: 'loadbalancer',
        technology: cloudProvider === 'aws' ? 'AWS ALB' : 'GCP Cloud Load Balancing'
      });
    }

    if (hasCache) {
      newComps.push({
        id: 'cache_cluster',
        name: cacheTech,
        type: 'cache',
        technology: 'Redis'
      });
    }

    const newConns = [];
    if (backendInstances > 1) {
      newConns.push({ from: 'web_ui', to: 'app_lb', protocol: 'HTTPS', label: 'Ingress' });
      newConns.push({ from: 'app_lb', to: 'api_server', protocol: 'HTTP', label: 'Balanced' });
    } else {
      newConns.push({ from: 'web_ui', to: 'api_server', protocol: 'HTTPS', label: 'REST API' });
    }

    newConns.push({ from: 'api_server', to: 'primary_db', protocol: 'SQL', label: 'Transactions' });
    if (hasCache) {
      newConns.push({ from: 'api_server', to: 'cache_cluster', protocol: 'TCP', label: 'Query Cache' });
    }

    onApplySimulatedArchitecture({
      project_name: `${architecture?.project_name || 'System'} (What-If Scenario)`,
      cloud_provider: cloudProvider,
      components: newComps,
      connections: newConns
    });
  };

  const handleReset = () => {
    setFrontendTech('React (Vite SPA)');
    setBackendTech('FastAPI (Python)');
    setDatabaseTech('PostgreSQL');
    setHasCache(true);
    setMonthlyTraffic(100000);
    setBackendInstances(2);
    setCloudProvider('aws');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="#2563eb" />
              <span>Interactive What-If Architecture Simulator</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Hypothetically alter frontend framework, backend runtime, database engine, caching tier, backend instances, and traffic to preview live cost and resilience impacts.
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            <RotateCcw size={12} />
            <span>Reset Scenario</span>
          </button>
        </div>
      </div>

      {/* Real-Time Impact Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {/* Estimated Cost */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>WHAT-IF ESTIMATED COST</span>
            <DollarSign size={14} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            ${calculatedCost.toFixed(2)}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / mo</span>
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: '2px', color: costDelta >= 0 ? '#b45309' : '#16a34a', fontWeight: 600 }}>
            {costDelta >= 0 ? `+$${costDelta.toFixed(2)} vs baseline` : `-$${Math.abs(costDelta).toFixed(2)} savings`}
          </div>
        </div>

        {/* Health Score */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SIMULATED HEALTH SCORE</span>
            <HeartPulse size={14} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: calculatedHealth >= 75 ? '#16a34a' : '#d97706', marginTop: '2px' }}>
            {calculatedHealth}
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}> / 100</span>
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: '2px', color: healthDelta >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            {healthDelta >= 0 ? `+${healthDelta} pts resilience improvement` : `${healthDelta} pts reliability penalty`}
          </div>
        </div>

        {/* Peak Concurrency */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>PEAK CONCURRENCY CAPACITY</span>
            <Cpu size={14} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            ~{(backendInstances * 350).toLocaleString()} RPS
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: '2px', color: '#64748b' }}>
            {backendInstances}x distributed compute instances
          </div>
        </div>
      </div>

      {/* Parameter Adjustment Controls */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={15} color="#2563eb" />
          <span>Interactive Scenario Levers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {/* Frontend Technology */}
          <div className="form-group">
            <label className="form-label">Frontend Technology</label>
            <select
              className="select-custom"
              value={frontendTech}
              onChange={(e) => setFrontendTech(e.target.value)}
            >
              <option value="React (Vite SPA)">React (Vite Single Page App)</option>
              <option value="Next.js (React Hybrid SSR)">Next.js (SSR / Hybrid)</option>
              <option value="Vue.js (Vite)">Vue.js 3</option>
            </select>
          </div>

          {/* Backend Technology */}
          <div className="form-group">
            <label className="form-label">Backend Technology Runtime</label>
            <select
              className="select-custom"
              value={backendTech}
              onChange={(e) => setBackendTech(e.target.value)}
            >
              <option value="FastAPI (Python)">FastAPI (Python Async)</option>
              <option value="Node.js (Express)">Node.js (Express / Fastify)</option>
              <option value="Go (Gin / Fiber)">Go (Gin / Goroutines)</option>
              <option value="Spring Boot (Java)">Spring Boot (Java 21)</option>
            </select>
          </div>

          {/* Database Engine */}
          <div className="form-group">
            <label className="form-label">Database Engine</label>
            <select
              className="select-custom"
              value={databaseTech}
              onChange={(e) => setDatabaseTech(e.target.value)}
            >
              <option value="PostgreSQL">PostgreSQL (Relational ACID)</option>
              <option value="MongoDB">MongoDB (Document Store)</option>
              <option value="Amazon DynamoDB">Amazon DynamoDB (Serverless NoSQL)</option>
              <option value="MySQL">MySQL (Relational)</option>
            </select>
          </div>

          {/* Cache Tier Toggle */}
          <div className="form-group">
            <label className="form-label">In-Memory Cache Tier</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${hasCache ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.72rem' }}
                onClick={() => setHasCache(true)}
              >
                Redis Cache (Active)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${!hasCache ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.72rem' }}
                onClick={() => setHasCache(false)}
              >
                No Cache
              </button>
            </div>
          </div>

          {/* Backend Instances Scale */}
          <div className="form-group">
            <label className="form-label">Number of Backend Compute Instances</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 4, 8, 16].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`btn btn-sm ${backendInstances === count ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.72rem' }}
                  onClick={() => setBackendInstances(count)}
                >
                  {count}x
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Traffic */}
          <div className="form-group">
            <label className="form-label">Simulated Monthly Traffic</label>
            <select
              className="select-custom"
              value={monthlyTraffic}
              onChange={(e) => setMonthlyTraffic(Number(e.target.value))}
            >
              <option value={10000}>10,000 users / mo (~12 RPS)</option>
              <option value={100000}>100,000 users / mo (~120 RPS)</option>
              <option value={1000000}>1,000,000 users / mo (~1,200 RPS)</option>
              <option value={5000000}>5,000,000 users / mo (~6,000 RPS)</option>
            </select>
          </div>

          {/* Cloud Provider Target */}
          <div className="form-group">
            <label className="form-label">Target Cloud Provider</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${cloudProvider === 'aws' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.72rem' }}
                onClick={() => setCloudProvider('aws')}
              >
                AWS (Amazon)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${cloudProvider === 'gcp' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.72rem' }}
                onClick={() => setCloudProvider('gcp')}
              >
                GCP (Google Cloud)
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Apply What-If to Studio */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {onApplySimulatedArchitecture && (
            <button
              className="btn btn-primary"
              onClick={handleApply}
              style={{ fontSize: '0.78rem', padding: '8px 16px' }}
            >
              <Sparkles size={14} />
              <span>Apply This What-If Scenario to Canvas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
