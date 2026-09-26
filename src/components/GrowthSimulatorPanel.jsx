import React, { useState, useEffect } from 'react';
import { simulateGrowthApi } from '../services/apiService';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  Play,
  RotateCcw,
  DollarSign,
  Cpu,
  Database,
  HardDrive,
  Activity
} from 'lucide-react';

export function GrowthSimulatorPanel({ architecture }) {
  const [currentUsers, setCurrentUsers] = useState(10000);
  const [growthRate, setGrowthRate] = useState(15);
  const [durationMonths, setDurationMonths] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [growthData, setGrowthData] = useState(null);

  const runGrowthSimulation = async () => {
    setIsLoading(true);
    try {
      const data = await simulateGrowthApi(architecture, currentUsers, growthRate, durationMonths);
      setGrowthData(data);
    } catch (err) {
      console.error('Growth simulation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runGrowthSimulation();
  }, [architecture]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Banner */}
      <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <TrendingUp size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
            Architecture Growth Simulator
          </span>
          <span className="opt-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.62rem' }}>
            MULTI-MONTH
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Project scaling trajectories over 6 to 24 months. Forecast when database saturation, bandwidth bills, and compute thresholds will require architectural refactoring.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Current Users
            </label>
            <input
              type="number"
              min="500"
              max="1000000"
              step="5000"
              value={currentUsers}
              onChange={(e) => setCurrentUsers(parseInt(e.target.value) || 10000)}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Growth Rate (%/mo)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="5"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 15)}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Duration (Months)
            </label>
            <select
              value={durationMonths}
              onChange={(e) => setDurationMonths(parseInt(e.target.value))}
              style={{ width: '100%', fontSize: '0.74rem', padding: '5px 8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc' }}
            >
              <option value="6">6 Months</option>
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
            </select>
          </div>
        </div>

        <button
          onClick={runGrowthSimulation}
          disabled={isLoading}
          className="primary-btn"
          style={{ width: '100%', padding: '6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Play size={12} />
          {isLoading ? 'Calculating Growth Trajectory...' : 'Simulate Growth Timeline'}
        </button>
      </div>

      {/* Timeline Table */}
      {growthData?.timeline && (
        <div style={{ background: '#070b14', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0b1120', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>Period</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>Users</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>RPS</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>Backend Load</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>DB Load</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>Est. Cost</th>
                  <th style={{ padding: '8px 10px', color: '#94a3b8' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {growthData.timeline.map((row, idx) => {
                  let statusBg = 'rgba(16, 185, 129, 0.2)';
                  let statusColor = '#86efac';
                  if (row.status === 'CRITICAL') {
                    statusBg = 'rgba(244, 63, 94, 0.2)';
                    statusColor = '#fda4af';
                  } else if (row.status === 'HIGH LOAD') {
                    statusBg = 'rgba(245, 158, 11, 0.2)';
                    statusColor = '#fde68a';
                  }

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #151e2e', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                      <td style={{ padding: '8px 10px', color: '#f8fafc', fontWeight: 600 }}>{row.label}</td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{row.projected_users.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{row.requests_per_sec}</td>
                      <td style={{ padding: '8px 10px', color: row.backend_load_pct > 80 ? '#f43f5e' : '#cbd5e1' }}>{row.backend_load_pct}%</td>
                      <td style={{ padding: '8px 10px', color: row.database_load_pct > 80 ? '#f43f5e' : '#cbd5e1' }}>{row.database_load_pct}%</td>
                      <td style={{ padding: '8px 10px', color: '#38bdf8', fontWeight: 600 }}>${row.estimated_monthly_cost}/mo</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: statusBg, color: statusColor, fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Note */}
      {growthData?.summary && (
        <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px 12px', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          {growthData.summary}
        </div>
      )}

      <div style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
        {growthData?.disclaimer}
      </div>
    </div>
  );
}
