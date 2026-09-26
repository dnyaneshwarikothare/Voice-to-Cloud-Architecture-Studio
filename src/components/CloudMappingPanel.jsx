import React, { useState } from 'react';
import { Cloud, Layers, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCloudServiceForComponent } from '../utils/cloudMappings';

export function CloudMappingPanel({ architecture, cloudMode, onCloudModeChange }) {
  const components = architecture?.components || [];

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Cloud Provider Service Mapping
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Mapping generic architecture roles to AWS and GCP cloud native managed services.
          </span>
        </div>

        <div className="view-mode-tabs">
          <button
            className={`view-tab ${cloudMode === 'logical' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('logical')}
          >
            Logical
          </button>
          <button
            className={`view-tab aws ${cloudMode === 'aws' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('aws')}
          >
            AWS
          </button>
          <button
            className={`view-tab gcp ${cloudMode === 'gcp' ? 'active' : ''}`}
            onClick={() => onCloudModeChange('gcp')}
          >
            GCP
          </button>
        </div>
      </div>

      <div style={{
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        fontSize: '0.74rem',
        color: '#bae6fd'
      }}>
        💡 <b>Suggested Mapping:</b> These cloud service mappings represent battle-tested production recommendations based on your architectural requirements. They are not the only option and can be customized.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
        {components.map((comp) => {
          const awsService = getCloudServiceForComponent(comp, 'aws');
          const gcpService = getCloudServiceForComponent(comp, 'gcp');

          return (
            <div
              key={comp.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                  {comp.name}
                </span>
                <span className="opt-badge" style={{ fontSize: '0.68rem' }}>
                  Role: {comp.role || comp.type}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                {/* AWS Box */}
                <div style={{
                  background: cloudMode === 'aws' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  border: `1px solid ${cloudMode === 'aws' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  padding: '8px'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#fed7aa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🟠 AWS Service:</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {awsService?.service || 'AWS Service'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {awsService?.category}
                  </div>
                </div>

                {/* GCP Box */}
                <div style={{
                  background: cloudMode === 'gcp' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                  border: `1px solid ${cloudMode === 'gcp' ? 'rgba(56, 189, 248, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  padding: '8px'
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#bae6fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔵 GCP Service:</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {gcpService?.service || 'GCP Service'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {gcpService?.category}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
