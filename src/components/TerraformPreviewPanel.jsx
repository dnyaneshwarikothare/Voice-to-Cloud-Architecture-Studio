import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Download, AlertTriangle, RefreshCw, CheckCircle2, Cloud, Terminal } from 'lucide-react';
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
      try {
        const res = await generateTerraformApi(architecture, provider);
        if (!isCancelled) {
          setTerraformData(res);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setIsLoading(false);
        }
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

  const components = architecture?.components || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={20} color="#059669" />
              <span>Terraform Infrastructure-as-Code (IaC) Generator</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Executable HashiCorp Configuration Language (HCL) blueprints synthesized directly from your active architecture topology.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <button
                className={`btn btn-sm ${provider === 'aws' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setProvider('aws')}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                AWS (Terraform)
              </button>
              <button
                className={`btn btn-sm ${provider === 'gcp' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setProvider('gcp')}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                GCP (Terraform)
              </button>
            </div>
          </div>
        </div>

        {/* IMPORTANT NOTICE BANNER (Explicit User Requirement) */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderRadius: '6px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          fontSize: '0.75rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
          <div>
            <strong>Notice:</strong> Terraform configuration generated from the architecture. Generating Terraform does <u>NOT</u> automatically deploy infrastructure or incur cloud charges.
          </div>
        </div>
      </div>

      {/* Code Viewer Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
              Blueprint: <code style={{ color: '#0284c7' }}>{terraformData?.filename || `main_${provider}.tf`}</code>
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>
              {components.length} mapped resources
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy} disabled={!terraformData?.hcl_code}>
              {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy HCL'}</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload} disabled={!terraformData?.hcl_code}>
              <Download size={13} />
              <span>Download {terraformData?.filename || '.tf'}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <div>Generating modular {provider.toUpperCase()} Terraform code...</div>
          </div>
        ) : (
          <pre
            style={{
              margin: 0,
              padding: '14px',
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '6px',
              fontSize: '0.76rem',
              lineHeight: 1.5,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              maxHeight: '520px',
              overflowY: 'auto',
              border: '1px solid #1e293b'
            }}
          >
            <code>{terraformData?.hcl_code || '# No architecture components to convert to Terraform.'}</code>
          </pre>
        )}

        <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>To apply locally: <code>terraform init &amp;&amp; terraform plan</code></span>
          <span>Target Provider: <strong>{provider.toUpperCase()}</strong></span>
        </div>
      </div>
    </div>
  );
}
