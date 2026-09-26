import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { generateTerraformApi } from '../services/apiService';

export function TerraformPreviewPanel({ architecture, cloudMode = 'aws' }) {
  const [provider, setProvider] = useState(cloudMode === 'gcp' ? 'gcp' : 'aws');
  const [terraformData, setTerraformData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function loadTf() {
      setIsLoading(true);
      const res = await generateTerraformApi(architecture, provider);
      if (!isCancelled) {
        setTerraformData(res);
        setIsLoading(false);
      }
    }
    loadTf();
    return () => { isCancelled = true; };
  }, [architecture, provider]);

  const handleCopy = async () => {
    if (!terraformData?.hcl_code) return;
    try {
      await navigator.clipboard.writeText(terraformData.hcl_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!terraformData?.hcl_code) return;
    const blob = new Blob([terraformData.hcl_code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = terraformData.filename || `main_${provider}.tf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Infrastructure-as-Code (Terraform)
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Executable HCL blueprint for {provider.toUpperCase()} infrastructure provisioning.
          </span>
        </div>

        <div className="view-mode-tabs">
          <button
            className={`view-tab aws ${provider === 'aws' ? 'active' : ''}`}
            onClick={() => setProvider('aws')}
          >
            AWS HCL
          </button>
          <button
            className={`view-tab gcp ${provider === 'gcp' ? 'active' : ''}`}
            onClick={() => setProvider('gcp')}
          >
            GCP HCL
          </button>
        </div>
      </div>

      <div style={{
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        fontSize: '0.72rem',
        color: '#fde68a',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
        <span><b>Review Notice:</b> Generated infrastructure code must be thoroughly audited before executing in production environments.</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          {copied ? 'Copied HCL!' : 'Copy Code'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownload}>
          <Download size={13} />
          Download {terraformData?.filename || '.tf'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#070b12' }}>
        <pre
          style={{
            margin: 0,
            padding: '14px',
            color: '#38bdf8',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            height: '100%',
            overflowY: 'auto'
          }}
        >
          {isLoading ? '// Generating Terraform blueprint...' : (terraformData?.hcl_code || '// No code generated')}
        </pre>
      </div>
    </div>
  );
}
