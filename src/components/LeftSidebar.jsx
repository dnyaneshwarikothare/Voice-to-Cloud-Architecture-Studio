import React, { useState } from 'react';
import {
  Mic,
  FileText,
  Sliders,
  Layers,
  Link,
  Cpu,
  Activity,
  DollarSign,
  HeartPulse,
  Sparkles,
  History,
  Download,
  Plus,
  Trash2,
  Edit2,
  Check,
  TrendingUp,
  Cloud
} from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { ArchitectureInput } from './ArchitectureInput';
import { COMPONENT_TYPES, COMPONENT_TYPE_CONFIG, sanitizeId } from '../utils/architectureSchema';

export function LeftSidebar({
  activeTab,
  onTabChange,
  inputText,
  onInputTextChange,
  onInitiateGeneration,
  onConversationalCommand,
  isProcessing,
  architecture,
  onUpdateArchitecture,
  selectedComponent,
  onSelectComponent,
  cloudMode,
  onCloudModeChange,
  assumptions,
  onAssumptionsChange,
  healthData,
  trafficData,
  costData,
  versionHistory,
  onSaveVersion,
  onRestoreVersion,
  onOpenExportModal
}) {
  // Local state for component editor
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState('backend');
  const [newCompTech, setNewCompTech] = useState('');
  const [newCompPurpose, setNewCompPurpose] = useState('');

  // Local state for connection editor
  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');
  const [connProtocol, setConnProtocol] = useState('HTTPS');
  const [connLabel, setConnLabel] = useState('');

  // Local state for traffic simulation inputs
  const [simUsers, setSimUsers] = useState(assumptions?.monthly_users || 50000);
  const [simFutureUsers, setSimFutureUsers] = useState(1000000);
  const [simGrowthRate, setSimGrowthRate] = useState('10x');
  const [simPeriod, setSimPeriod] = useState('12 Months');

  const components = architecture?.components || [];
  const connections = architecture?.connections || [];

  // Add Component handler
  const handleAddComponent = (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const id = sanitizeId(newCompName.trim());
    let finalId = id;
    let counter = 1;
    while (components.some(c => c.id === finalId)) {
      finalId = `${id}_${counter++}`;
    }

    const typeConfig = COMPONENT_TYPE_CONFIG[newCompType] || COMPONENT_TYPE_CONFIG.custom;
    const tech = newCompTech.trim() || newCompName.trim();
    const role = typeConfig.label;
    const purpose = newCompPurpose.trim() || `Handles ${newCompName.trim()} operations.`;

    const newComp = {
      id: finalId,
      name: newCompName.trim(),
      type: newCompType,
      role: role,
      technology: tech,
      purpose: purpose,
      why_recommended: `Configured for ${role} services.`,
      tier: 'standard'
    };

    onUpdateArchitecture({
      ...architecture,
      components: [...components, newComp]
    });

    setNewCompName('');
    setNewCompTech('');
    setNewCompPurpose('');
  };

  // Delete Component handler
  const handleDeleteComponent = (id) => {
    const updatedComps = components.filter(c => c.id !== id);
    const updatedConns = connections.filter(conn => conn.from !== id && conn.to !== id && conn.from_id !== id && conn.to_id !== id);
    onUpdateArchitecture({
      ...architecture,
      components: updatedComps,
      connections: updatedConns
    });
    if (selectedComponent?.id === id) onSelectComponent(null);
  };

  // Add Connection handler
  const handleAddConnection = (e) => {
    e.preventDefault();
    if (!connFrom || !connTo || connFrom === connTo) return;

    const exists = connections.some(
      c => (c.from === connFrom || c.from_id === connFrom) && (c.to === connTo || c.to_id === connTo)
    );
    if (exists) return;

    const newConn = {
      from: connFrom,
      to: connTo,
      protocol: connProtocol,
      label: connLabel.trim()
    };

    onUpdateArchitecture({
      ...architecture,
      connections: [...connections, newConn]
    });

    setConnLabel('');
  };

  // Delete Connection handler
  const handleDeleteConnection = (fromId, toId) => {
    const updated = connections.filter(c => {
      const f = c.from || c.from_id;
      const t = c.to || c.to_id;
      return !(f === fromId && t === toId);
    });
    onUpdateArchitecture({
      ...architecture,
      connections: updated
    });
  };

  // Swap Technology Quick Action
  const handleSwapTech = (targetType, newTechName) => {
    const updatedComps = components.map(c => {
      if (c.type === targetType) {
        return {
          ...c,
          technology: newTechName,
          name: newTechName.split(' ')[0] + ' ' + (c.role || c.type)
        };
      }
      return c;
    });
    onUpdateArchitecture({
      ...architecture,
      components: updatedComps
    });
  };

  return (
    <section className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Left Tabs Bar */}
      <div className="panel-header" style={{ padding: '8px 10px', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', width: '100%', paddingBottom: '2px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'input' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('input')}
            title="Voice & Text Input"
          >
            <Mic size={13} />
            <span>Input</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'architecture' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('architecture')}
            title="Architecture Details"
          >
            <Sliders size={13} />
            <span>Project</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'components' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('components')}
            title="Components List & Add"
          >
            <Layers size={13} />
            <span>Comps ({components.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'connections' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('connections')}
            title="Connections List & Add"
          >
            <Link size={13} />
            <span>Links ({connections.length})</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'tech' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('tech')}
            title="Technology Stack Picker"
          >
            <Cpu size={13} />
            <span>Tech</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'traffic' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('traffic')}
            title="Traffic Growth Simulation"
          >
            <TrendingUp size={13} />
            <span>Traffic</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'cost' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('cost')}
            title="Cost Analysis"
          >
            <DollarSign size={13} />
            <span>Cost</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('health')}
            title="Architecture Health"
          >
            <HeartPulse size={13} />
            <span>Health</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'whatif' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('whatif')}
            title="What-If Analysis"
          >
            <Sparkles size={13} />
            <span>What-If</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('history')}
            title="Version History"
          >
            <History size={13} />
            <span>History</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onTabChange('export')}
            title="Export Architecture"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="panel-content" style={{ flex: 1, overflowY: 'auto' }}>
        {/* ========================================================
            1. VOICE & TEXT INPUT TAB
            ======================================================== */}
        {activeTab === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <VoiceInput
              currentText={inputText}
              onTranscriptChange={onInputTextChange}
            />
            <ArchitectureInput
              value={inputText}
              onChange={onInputTextChange}
              onGenerate={() => onInitiateGeneration()}
              onClear={() => onInputTextChange('')}
              onConversationalCommand={onConversationalCommand}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* ========================================================
            2. ARCHITECTURE DETAILS TAB
            ======================================================== */}
        {activeTab === 'architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">Architecture Configuration</div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="input-custom"
                  value={architecture?.project_name || ''}
                  onChange={(e) => onUpdateArchitecture({ ...(architecture || {}), project_name: e.target.value })}
                  placeholder="e.g. Production E-commerce System"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cloud Target Provider</label>
                <select
                  className="select-custom"
                  value={cloudMode}
                  onChange={(e) => onCloudModeChange(e.target.value)}
                >
                  <option value="logical">Logical / Cloud Agnostic</option>
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Workload Requirements</label>
                <textarea
                  className="textarea-custom"
                  style={{ minHeight: '70px' }}
                  value={architecture?.description || ''}
                  onChange={(e) => onUpdateArchitecture({ ...(architecture || {}), description: e.target.value })}
                  placeholder="High-level architecture scope and non-functional requirements..."
                />
              </div>
            </div>

            <div className="card" style={{ background: '#f8fafc' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                Summary Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.76rem' }}>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Components:</span> <b>{components.length}</b>
                </div>
                <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>Connections:</span> <b>{connections.length}</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            3. COMPONENTS TAB (List, Add, Delete, Edit)
            ======================================================== */}
        {activeTab === 'components' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Add Component Form */}
            <form onSubmit={handleAddComponent} className="card" style={{ background: '#f8fafc' }}>
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} color="#2563eb" />
                  Add Architecture Component
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="input-custom"
                  placeholder="e.g. Order Processing API"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Role / Type</label>
                  <select
                    className="select-custom"
                    value={newCompType}
                    onChange={(e) => setNewCompType(e.target.value)}
                  >
                    {Object.entries(COMPONENT_TYPE_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Technology</label>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="e.g. FastAPI / Python"
                    value={newCompTech}
                    onChange={(e) => setNewCompTech(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input
                  type="text"
                  className="input-custom"
                  placeholder="e.g. Validates orders and updates inventory"
                  value={newCompPurpose}
                  onChange={(e) => setNewCompPurpose(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Plus size={13} />
                Add Component
              </button>
            </form>

            {/* Existing Components List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Components ({components.length})
              </div>
              {components.map((comp) => {
                const config = COMPONENT_TYPE_CONFIG[comp.type] || COMPONENT_TYPE_CONFIG.custom;
                const isSelected = selectedComponent?.id === comp.id;

                return (
                  <div
                    key={comp.id}
                    className="card"
                    style={{
                      padding: '8px 10px',
                      borderLeft: `4px solid ${config.color || '#2563eb'}`,
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    onClick={() => onSelectComponent(comp)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{comp.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {comp.technology || comp.name} • {config.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          className="icon-btn"
                          style={{ width: '24px', height: '24px', border: 'none' }}
                          title="Inspect / Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComponent(comp);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ width: '24px', height: '24px', border: 'none', color: '#dc2626' }}
                          title="Delete Component"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComponent(comp.id);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            4. CONNECTIONS TAB (List, Add, Delete)
            ======================================================== */}
        {activeTab === 'connections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Add Connection Form */}
            <form onSubmit={handleAddConnection} className="card" style={{ background: '#f8fafc' }}>
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} color="#2563eb" />
                  Add Architecture Connection
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Source Component</label>
                  <select
                    className="select-custom"
                    value={connFrom}
                    onChange={(e) => setConnFrom(e.target.value)}
                    required
                  >
                    <option value="">Select source...</option>
                    {components.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Component</label>
                  <select
                    className="select-custom"
                    value={connTo}
                    onChange={(e) => setConnTo(e.target.value)}
                    required
                  >
                    <option value="">Select destination...</option>
                    {components.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Protocol</label>
                  <select
                    className="select-custom"
                    value={connProtocol}
                    onChange={(e) => setConnProtocol(e.target.value)}
                  >
                    <option value="HTTPS">HTTPS (REST/API)</option>
                    <option value="gRPC">gRPC (HTTP/2)</option>
                    <option value="TCP">TCP / Socket</option>
                    <option value="SQL">SQL (Database Query)</option>
                    <option value="WSS">WebSocket (Real-Time)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Label (Optional)</label>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="e.g. Read / Write query"
                    value={connLabel}
                    onChange={(e) => setConnLabel(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                <Plus size={13} />
                Connect Components
              </button>
            </form>

            {/* Existing Connections List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Active Connections ({connections.length})
              </div>
              {connections.map((conn, idx) => {
                const fId = conn.from || conn.from_id;
                const tId = conn.to || conn.to_id;
                const sourceComp = components.find(c => c.id === fId);
                const targetComp = components.find(c => c.id === tId);

                return (
                  <div
                    key={`${fId}_${tId}_${idx}`}
                    className="card"
                    style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>
                        {sourceComp?.name || fId} → {targetComp?.name || tId}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Protocol: <b>{conn.protocol || 'HTTPS'}</b> {conn.label ? `• "${conn.label}"` : ''}
                      </div>
                    </div>
                    <button
                      className="icon-btn"
                      style={{ width: '24px', height: '24px', border: 'none', color: '#dc2626' }}
                      title="Remove Connection"
                      onClick={() => handleDeleteConnection(fId, tId)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            5. TECHNOLOGY SELECTION TAB
            ======================================================== */}
        {activeTab === 'tech' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">Technology Stack Presets</div>
              <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Quickly swap the core technologies in this architecture to compare trade-offs.
              </p>

              {/* Backend Swapping */}
              <div className="form-group" style={{ marginTop: '6px' }}>
                <label className="form-label">Backend Framework</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['FastAPI (Python)', 'Node.js (Express)', 'Go (Gin)', 'Spring Boot (Java)'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSwapTech('backend', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Database Swapping */}
              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">Primary Database</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['PostgreSQL', 'MySQL', 'MongoDB', 'Amazon DynamoDB'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSwapTech('database', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cache Swapping */}
              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">Caching Solution</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Redis Cluster', 'Memcached', 'AWS ElastiCache Redis'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSwapTech('cache', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            6. TRAFFIC SIMULATION TAB
            ======================================================== */}
        {activeTab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} color="#0284c7" />
                  Simulate Future Growth
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Project load, bandwidth, and component saturation under simulated growth.
              </p>

              <div className="form-group">
                <label className="form-label">Current Active Users / Month</label>
                <input
                  type="number"
                  className="input-custom"
                  value={simUsers}
                  onChange={(e) => setSimUsers(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Future Users / Month</label>
                <input
                  type="number"
                  className="input-custom"
                  value={simFutureUsers}
                  onChange={(e) => setSimFutureUsers(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Growth Rate</label>
                  <select
                    className="select-custom"
                    value={simGrowthRate}
                    onChange={(e) => setSimGrowthRate(e.target.value)}
                  >
                    <option value="2x">2x (+100%)</option>
                    <option value="5x">5x (+400%)</option>
                    <option value="10x">10x (+900%)</option>
                    <option value="100x">100x (+9,900%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Period</label>
                  <select
                    className="select-custom"
                    value={simPeriod}
                    onChange={(e) => setSimPeriod(e.target.value)}
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months</option>
                    <option value="24 Months">24 Months</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.74rem' }}>
                <div>Current: <b>{simUsers.toLocaleString()}</b> users/mo</div>
                <div>Projected: <b>{simFutureUsers.toLocaleString()}</b> users/mo ({simGrowthRate} over {simPeriod})</div>
                <div style={{ color: '#0284c7', marginTop: '4px' }}>
                  See Right Sidebar for Bottlenecks & Capacity Alerts.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            7. COST ANALYSIS TAB
            ======================================================== */}
        {activeTab === 'cost' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">Monthly Cloud Hosting Estimates</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Estimated pricing based on configured catalog for AWS and GCP:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <div style={{ padding: '10px', border: '1px solid #ff9900', borderRadius: '6px', background: '#fffbeb' }}>
                  <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>AWS ESTIMATE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    ${costData?.aws?.estimated_monthly_cost?.toFixed(2) || (components.length * 28.5 + 35).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>per month (USD)</div>
                </div>

                <div style={{ padding: '10px', border: '1px solid #4285f4', borderRadius: '6px', background: '#eff6ff' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>GCP ESTIMATE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    ${costData?.gcp?.estimated_monthly_cost?.toFixed(2) || (components.length * 26.2 + 30).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>per month (USD)</div>
                </div>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px' }}>
                * Clearly labeled as estimates. Real-world billing varies by region and variable egress traffic.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            8. ARCHITECTURE HEALTH TAB
            ======================================================== */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">Multi-Pillar Health Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#16a34a' }}>
                  {healthData?.overall_score || 82}
                  <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}> / 100</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Rule-based architecture evaluation across Security, Reliability, Performance, and Scalability.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            9. WHAT-IF ANALYSIS TAB
            ======================================================== */}
        {activeTab === 'whatif' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">What-If Scenario Simulator</div>
              <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Test architectural changes (switching database, scaling backend count, or changing cloud provider)
                and recalculate impact immediately.
              </p>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">What if we scale backend to 4 instances?</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onConversationalCommand && onConversationalCommand('Scale backend to 4 instances with load balancer')}
                >
                  Apply 4-Instance Scenario
                </button>
              </div>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <label className="form-label">What if we add Redis in-memory cache?</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onConversationalCommand && onConversationalCommand('Add Redis')}
                >
                  Apply In-Memory Cache Scenario
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            10. ARCHITECTURE HISTORY TAB
            ======================================================== */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">
                <span>Architecture Version History</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSaveVersion && onSaveVersion(`Snapshot ${(versionHistory?.length || 0) + 1}`)}
                >
                  Save Snapshot
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {(versionHistory || []).map((ver, idx) => (
                  <div
                    key={ver.id || idx}
                    className="card"
                    style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>{ver.note || `Version ${idx + 1}`}</strong>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {ver.architecture?.components?.length || 0} components • {ver.timestamp ? new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved'}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRestoreVersion && onRestoreVersion(ver)}
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            11. EXPORT TAB
            ======================================================== */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card">
              <div className="card-title">Export Architecture & IaC</div>
              <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Generate downloadable formats for presentations, docs, and Terraform cloud provisioning.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenExportModal}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Download size={13} color="#2563eb" />
                  Export as PNG / SVG Image
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenExportModal}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <FileText size={13} color="#059669" />
                  Export Mermaid Diagram (.mmd)
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenExportModal}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Layers size={13} color="#7c3aed" />
                  Export Architecture JSON Schema
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenExportModal}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <Cloud size={13} />
                  Export Terraform Infrastructure Code (.tf)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
