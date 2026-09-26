import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Link, ArrowRight, Check, HelpCircle, Layers } from 'lucide-react';
import { COMPONENT_TYPES, COMPONENT_TYPE_CONFIG, sanitizeId } from '../utils/architectureSchema';

const PROTOCOLS = ['HTTP', 'HTTPS', 'REST', 'gRPC', 'WebSocket', 'TCP', 'SQL'];

export function ArchitectureEditor({
  architecture,
  onUpdateArchitecture,
  selectedComponent,
  onSelectComponent
}) {
  const [newCompName, setNewCompName] = useState('');
  const [newCompType, setNewCompType] = useState(COMPONENT_TYPES.BACKEND);
  const [newCompTech, setNewCompTech] = useState('');
  const [newCompPurpose, setNewCompPurpose] = useState('');

  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');
  const [connProtocol, setConnProtocol] = useState('HTTPS');
  const [connLabel, setConnLabel] = useState('');

  const [activeTab, setActiveTab] = useState('components'); // 'components' or 'connections'

  const components = architecture?.components || [];
  const connections = architecture?.connections || [];

  // Add Component
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
      why_recommended: `Added manually by user for ${role} duties.`,
      tier: 'standard',
      description: `${newCompName.trim()} (${tech} - ${role})`
    };

    onUpdateArchitecture({
      ...architecture,
      components: [...components, newComp]
    });

    setNewCompName('');
    setNewCompTech('');
    setNewCompPurpose('');
  };

  // Delete Component
  const handleDeleteComponent = (id) => {
    const updatedComponents = components.filter(c => c.id !== id);
    const updatedConnections = connections.filter(conn => conn.from !== id && conn.to !== id);

    onUpdateArchitecture({
      ...architecture,
      components: updatedComponents,
      connections: updatedConnections
    });

    if (selectedComponent?.id === id) {
      onSelectComponent(null);
    }
  };

  // Update Component (rename, change type/role, technology, or purpose)
  const handleUpdateComponent = (id, fields) => {
    const updated = components.map(c => {
      if (c.id === id) {
        return { ...c, ...fields };
      }
      return c;
    });

    onUpdateArchitecture({
      ...architecture,
      components: updated
    });
  };

  // Add Connection
  const handleAddConnection = (e) => {
    e.preventDefault();
    if (!connFrom || !connTo || connFrom === connTo) return;

    const exists = connections.some(c => c.from === connFrom && c.to === connTo);
    if (exists) return;

    const newConn = {
      from: connFrom,
      to: connTo,
      protocol: connProtocol,
      label: connLabel.trim() || connProtocol
    };

    onUpdateArchitecture({
      ...architecture,
      connections: [...connections, newConn]
    });

    setConnLabel('');
  };

  // Delete Connection
  const handleDeleteConnection = (index) => {
    const updated = connections.filter((_, i) => i !== index);
    onUpdateArchitecture({
      ...architecture,
      connections: updated
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sub-tab navigation */}
      <div className="tab-row" style={{ borderRadius: '6px' }}>
        <button
          className={`tab-btn ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components ({components.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          Connections ({connections.length})
        </button>
      </div>

      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Note about Technology != Role */}
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.4)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            💡 <b>Role vs Technology:</b> You can set the architectural role (e.g. <i>API Gateway</i>) independently from its technology (e.g. <i>Node.js</i>).
          </div>

          {/* Add Component Form */}
          <form onSubmit={handleAddComponent} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
              Add New Component
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
              <input
                type="text"
                placeholder="Component Name (e.g. Payment Gateway)"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '0.76rem'
                }}
              />

              <select
                value={newCompType}
                onChange={(e) => setNewCompType(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              >
                {Object.entries(COMPONENT_TYPE_CONFIG).map(([typeKey, config]) => (
                  <option key={typeKey} value={typeKey}>
                    Role: {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
              <input
                type="text"
                placeholder="Tech (e.g. Node.js, FastAPI)"
                value={newCompTech}
                onChange={(e) => setNewCompTech(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '0.76rem'
                }}
              />
              <input
                type="text"
                placeholder="Purpose (e.g. Charges cards)"
                value={newCompPurpose}
                onChange={(e) => setNewCompPurpose(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '0.76rem'
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newCompName.trim()}>
                <Plus size={14} /> Add
              </button>
            </div>
          </form>

          {/* Component List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
            {components.map((comp) => {
              const config = COMPONENT_TYPE_CONFIG[comp.type] || COMPONENT_TYPE_CONFIG.custom;
              const isSelected = selectedComponent?.id === comp.id;

              return (
                <div
                  key={comp.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: config.color || '#38bdf8',
                          flexShrink: 0
                        }}
                      />
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleUpdateComponent(comp.id, { name: e.target.value })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <select
                        value={comp.type || 'custom'}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const cfg = COMPONENT_TYPE_CONFIG[newType];
                          handleUpdateComponent(comp.id, {
                            type: newType,
                            role: cfg ? cfg.label : newType
                          });
                        }}
                        style={{
                          background: '#0b0f19',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          color: '#94a3b8',
                          fontSize: '0.7rem'
                        }}
                      >
                        {Object.entries(COMPONENT_TYPE_CONFIG).map(([typeKey, cfg]) => (
                          <option key={typeKey} value={typeKey}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => onSelectComponent(comp)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Why this component?"
                      >
                        <HelpCircle size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteComponent(comp.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete component"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Independent Technology and Purpose Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Tech:</span>
                      <input
                        type="text"
                        value={comp.technology || comp.name}
                        onChange={(e) => handleUpdateComponent(comp.id, { technology: e.target.value })}
                        style={{
                          background: '#0b0f19',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: '#cbd5e1',
                          fontSize: '0.7rem',
                          width: '100%'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Role:</span>
                      <input
                        type="text"
                        value={comp.role || config.label}
                        onChange={(e) => handleUpdateComponent(comp.id, { role: e.target.value })}
                        style={{
                          background: '#0b0f19',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: '#cbd5e1',
                          fontSize: '0.7rem',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Add Connection Form */}
          <form onSubmit={handleAddConnection} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
              Connect Components
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={connFrom}
                onChange={(e) => setConnFrom(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              >
                <option value="">From...</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <ArrowRight size={14} color="#64748b" />

              <select
                value={connTo}
                onChange={(e) => setConnTo(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              >
                <option value="">To...</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '6px' }}>
              <select
                value={connProtocol}
                onChange={(e) => setConnProtocol(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '5px',
                  color: '#fff',
                  fontSize: '0.72rem'
                }}
              >
                {PROTOCOLS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Label (e.g. REST API, Cache Check)"
                value={connLabel}
                onChange={(e) => setConnLabel(e.target.value)}
                style={{
                  background: '#0b0f19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '0.74rem'
                }}
              />

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!connFrom || !connTo || connFrom === connTo}
              >
                <Link size={13} /> Connect
              </button>
            </div>
          </form>

          {/* Connection List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
            {connections.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '12px' }}>
                No active connections. Connect components using the form above.
              </div>
            ) : (
              connections.map((conn, idx) => {
                const fromName = components.find(c => c.id === conn.from)?.name || conn.from;
                const toName = components.find(c => c.id === conn.to)?.name || conn.to;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.76rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 500 }}>{fromName}</span>
                      <ArrowRight size={12} color="#64748b" />
                      <span style={{ color: '#a855f7', fontWeight: 500 }}>{toName}</span>
                      {conn.label && (
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                          [{conn.label}]
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteConnection(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '3px'
                      }}
                      title="Delete connection"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
