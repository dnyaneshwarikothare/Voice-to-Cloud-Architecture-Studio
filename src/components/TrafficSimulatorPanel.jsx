import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, TrendingUp, Cpu, Database, HardDrive, Wifi, Sliders, CheckCircle2 } from 'lucide-react';
import { simulateTrafficApi } from '../services/apiService';

export function TrafficSimulatorPanel({ architecture }) {
  const [currentUsers, setCurrentUsers] = useState(10000);
  const [futureUsers, setFutureUsers] = useState(100000);
  const [baseRps, setBaseRps] = useState(100);
  const [peakMultiplier, setPeakMultiplier] = useState(2.5);
  const [simulationData, setSimulationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function runSim() {
      setIsLoading(true);
      const res = await simulateTrafficApi({
        architecture,
        current_users: currentUsers,
        future_users: futureUsers,
        requests_per_second: baseRps,
        peak_multiplier: peakMultiplier
      });
      if (!isCancelled) {
        setSimulationData(res);
        setIsLoading(false);
      }
    }
    runSim();
    return () => { isCancelled = true; };
  }, [architecture, currentUsers, futureUsers, baseRps, peakMultiplier]);

  const getStatusBadge = (status) => {
    if (status === 'CRITICAL') return { class: 'score-risk', color: '#f43f5e', text: 'CRITICAL LOAD' };
    if (status === 'HIGH LOAD') return { class: 'score-warning', color: '#f59e0b', text: 'HIGH LOAD' };
    return { class: 'score-good', color: '#10b981', text: 'NORMAL LOAD' };
  };

  const statusInfo = getStatusBadge(simulationData?.status || 'NORMAL');

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      {/* Header and Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Future Traffic & Bottleneck Simulator
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Scenario-based capacity planning under future user growth.
          </span>
        </div>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: `${statusInfo.color}22`,
            color: statusInfo.color,
            border: `1px solid ${statusInfo.color}66`
          }}
        >
          {statusInfo.text}
        </span>
      </div>

      {/* Traffic Growth Interactive Sliders */}
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={14} color="#818cf8" />
          Simulation Parameters
        </div>

        {/* Current Users -> Future Users */}
        <div className="slider-group">
          <div className="slider-header">
            <span>Projected Active Users:</span>
            <b>{currentUsers.toLocaleString()} → <span style={{ color: '#38bdf8' }}>{futureUsers.toLocaleString()}</span></b>
          </div>
          <input
            type="range"
            min="5000"
            max="1000000"
            step="10000"
            value={futureUsers}
            onChange={(e) => setFutureUsers(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Base Requests per Second */}
        <div className="slider-group">
          <div className="slider-header">
            <span>Baseline Requests / Sec (RPS):</span>
            <b>{baseRps} RPS</b>
          </div>
          <input
            type="range"
            min="10"
            max="2000"
            step="50"
            value={baseRps}
            onChange={(e) => setBaseRps(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Peak Surge Multiplier */}
        <div className="slider-group">
          <div className="slider-header">
            <span>Peak Traffic Multiplier:</span>
            <b>{peakMultiplier}x Peak Burst</b>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={peakMultiplier}
            onChange={(e) => setPeakMultiplier(Number(e.target.value))}
            className="range-slider"
          />
        </div>
      </div>

      {/* Capacity Metrics Dashboard */}
      {simulationData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Backend Load Gauge */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <Cpu size={14} color="#818cf8" />
              <span>Backend Compute Load</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: simulationData.backend_load_pct > 100 ? '#f43f5e' : (simulationData.backend_load_pct > 75 ? '#f59e0b' : '#10b981'), marginTop: '2px' }}>
              {simulationData.backend_load_pct}%
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              At {simulationData.projected_rps_peak} peak RPS
            </div>
          </div>

          {/* Database Load Gauge */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <Database size={14} color="#10b981" />
              <span>Database Query Load</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: simulationData.database_load_pct > 100 ? '#f43f5e' : (simulationData.database_load_pct > 75 ? '#f59e0b' : '#10b981'), marginTop: '2px' }}>
              {simulationData.database_load_pct}%
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Cache hit rate: {simulationData.cache_hit_rate_pct}%
            </div>
          </div>

          {/* Storage Growth */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <HardDrive size={14} color="#f59e0b" />
              <span>Projected Storage</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {simulationData.storage_projected_gb} GB
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              12-Month Accumulation
            </div>
          </div>

          {/* Network Bandwidth */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
              <Wifi size={14} color="#38bdf8" />
              <span>Network Egress</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
              {simulationData.network_bandwidth_gb} GB / mo
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Outbound transfer
            </div>
          </div>
        </div>
      )}

      {/* Bottlenecks Detected */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color="#f59e0b" />
          Detected Bottlenecks & Capacity Constraints
        </div>

        {simulationData?.bottlenecks && simulationData.bottlenecks.length > 0 ? (
          simulationData.bottlenecks.map((b, idx) => (
            <div
              key={idx}
              style={{
                background: b.severity === 'critical' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${b.severity === 'critical' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.76rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: b.severity === 'critical' ? '#fda4af' : '#fed7aa' }}>
                  {b.component}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: b.severity === 'critical' ? '#f43f5e' : '#f59e0b' }}>
                  {b.severity} severity
                </span>
              </div>
              <div style={{ color: '#cbd5e1' }}>{b.issue}</div>
              <div style={{ color: '#a7f3d0', fontSize: '0.72rem', marginTop: '2px' }}>
                💡 <b>Remedy:</b> {b.recommendation}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            No immediate saturation bottlenecks detected under this simulation scenario.
          </div>
        )}
      </div>

      <div className="disclaimer-text">
        ⚠️ {simulationData?.disclaimer || 'Scenario-based estimate. Actual traffic patterns vary with real-world user behavior.'}
      </div>
    </div>
  );
}
