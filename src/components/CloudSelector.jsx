import React from 'react';
import { Layers, ArrowRight, ArrowDown, Info } from 'lucide-react';

export function CloudSelector({
  cloudMode, // 'logical', 'aws', 'gcp'
  onCloudModeChange,
  direction, // 'LR' or 'TD'
  onDirectionToggle,
  diagramType, // 'flowchart', 'c4_context', 'c4_container', 'c4_component'
  onDiagramTypeChange
}) {
  return (
    <div className="diagram-toolbar">
      {/* Cloud Service Mapping Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
          Mapping:
        </span>
        <div className="view-mode-tabs">
          <button
            className={`view-tab ${cloudMode === 'logical' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('logical')}
            title="Show generic technology names (React, FastAPI, PostgreSQL)"
          >
            🧩 Logical
          </button>
          <button
            className={`view-tab aws ${cloudMode === 'aws' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('aws')}
            title="Map components to Amazon Web Services (S3, ECS, RDS, ElastiCache)"
          >
            🟠 AWS
          </button>
          <button
            className={`view-tab gcp ${cloudMode === 'gcp' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('gcp')}
            title="Map components to Google Cloud Platform (Cloud Run, Cloud SQL, Memorystore)"
          >
            🔵 GCP
          </button>
        </div>
      </div>

      {/* C4 Model Roadmap Selector & Orientation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Direction Toggle */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onDirectionToggle}
          title={`Switch orientation to ${direction === 'LR' ? 'Top-Down (TD)' : 'Left-to-Right (LR)'}`}
          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
        >
          {direction === 'LR' ? <ArrowRight size={13} /> : <ArrowDown size={13} />}
          {direction === 'LR' ? 'Horizontal (LR)' : 'Vertical (TD)'}
        </button>

        {/* Diagram Type / C4 selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} color="#94a3b8" />
          <select
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: '0.72rem', background: '#0b0f19' }}
            value={diagramType}
            onChange={(e) => onDiagramTypeChange(e.target.value)}
          >
            <option value="flowchart">Flowchart (Active)</option>
            <option value="c4_context" disabled>C4 Context (Coming soon)</option>
            <option value="c4_container" disabled>C4 Container (Coming soon)</option>
            <option value="c4_component" disabled>C4 Component (Coming soon)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
