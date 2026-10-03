import React from 'react';
import { Cloud, Layers, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { getCloudServiceForComponent } from '../utils/cloudMappings';

export function CloudMappingPanel({ architecture, cloudMode, onCloudModeChange }) {
  const components = architecture?.components || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={20} color="#2563eb" />
              <span>Cloud Provider Service Mapping (AWS &amp; GCP)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Maps generic architecture components to native managed cloud services on Amazon Web Services and Google Cloud Platform.
            </p>
          </div>

          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              className={`btn btn-sm ${cloudMode === 'logical' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onCloudModeChange('logical')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              Logical View
            </button>
            <button
              className={`btn btn-sm ${cloudMode === 'aws' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onCloudModeChange('aws')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              AWS View
            </button>
            <button
              className={`btn btn-sm ${cloudMode === 'gcp' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onCloudModeChange('gcp')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              GCP View
            </button>
          </div>
        </div>

        {/* Note */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          fontSize: '0.75rem',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={15} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>
            <b>Architecture Guidance:</b> Cloud service mappings represent battle-tested production recommendations for each tier. Neither AWS nor GCP is universally superior; provider choice depends on organizational tooling, credits, and team expertise.
          </span>
        </div>
      </div>

      {/* Mapping Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        {components.map((comp) => {
          const awsService = getCloudServiceForComponent(comp, 'aws');
          const gcpService = getCloudServiceForComponent(comp, 'gcp');

          return (
            <div
              key={comp.id}
              className="card"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  {comp.name}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.64rem' }}>
                  {comp.type}
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Technology: <strong style={{ color: '#0f172a' }}>{comp.technology}</strong> • Role: {comp.role}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#b45309' }}>🟠 AWS SERVICE</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#78350f', marginTop: '2px' }}>
                    {awsService?.service || 'AWS EC2'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '2px' }}>
                    Category: {awsService?.category || 'Compute'}
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#1d4ed8' }}>🔵 GCP SERVICE</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a', marginTop: '2px' }}>
                    {gcpService?.service || 'Compute Engine'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '2px' }}>
                    Category: {gcpService?.category || 'Compute'}
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
