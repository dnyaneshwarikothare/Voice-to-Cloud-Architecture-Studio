import React, { useState } from 'react';
import { Download, FileCode, FileImage, FileText, Check, Copy, Printer, Sparkles, Cloud } from 'lucide-react';
import { generateMermaidCode, renderMermaidSvg, svgToPngDataUrl } from '../services/mermaidService';
import { generateTerraformApi } from '../services/apiService';

export function ExportStudioPanel({ architecture, cloudMode = 'aws', direction = 'LR' }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTf, setCopiedTf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [terraformCode, setTerraformCode] = useState('');
  const [isGeneratingTf, setIsGeneratingTf] = useState(false);

  const mermaidCode = generateMermaidCode(architecture, { direction, mode: cloudMode });
  const architectureJson = JSON.stringify(architecture, null, 2);

  // Copy Mermaid code
  const handleCopyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Download Mermaid .mmd file
  const handleDownloadMmd = () => {
    const blob = new Blob([mermaidCode], { type: 'text/vnd.mermaid;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture?.project_name?.replace(/\s+/g, '_') || 'architecture'}_${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([architectureJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture?.project_name?.replace(/\s+/g, '_') || 'architecture'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PNG file
  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const res = await renderMermaidSvg('export_png_canvas', mermaidCode);
      if (res.success && res.svg) {
        const dataUrl = await svgToPngDataUrl(res.svg, 2);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${architecture?.project_name?.replace(/\s+/g, '_') || 'architecture'}_diagram.png`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Print-Ready PDF Export
  const handlePrintPdf = () => {
    window.print();
  };

  // Load / Download Terraform
  const handleGenerateTerraform = async () => {
    setIsGeneratingTf(true);
    try {
      const res = await generateTerraformApi(architecture, cloudMode);
      const tfContent = res?.main_tf || res?.terraform_code || '# Terraform Configuration\nprovider "aws" {\n  region = "us-east-1"\n}\n';
      setTerraformCode(tfContent);
    } catch (err) {
      console.error('Terraform generation failed:', err);
    } finally {
      setIsGeneratingTf(false);
    }
  };

  const handleDownloadTf = () => {
    const content = terraformCode || '# Terraform Configuration\nprovider "aws" {\n  region = "us-east-1"\n}\n';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.tf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="#2563eb" />
              <span>Multi-Format Export & Infrastructure as Code (IaC)</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
              Export high-resolution raster PNG, print-ready PDF, raw Mermaid source code, structured JSON specification, and Terraform IaC templates.
            </p>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            Multi-Format Exporter
          </span>
        </div>
      </div>

      {/* Export Options Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {/* 1. PNG Image */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
              <FileImage size={18} />
              <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>PNG Image</strong>
            </div>
            <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
              High-resolution 2x rasterized PNG with crisp white background, suitable for slides and design docs.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExportPng}
            disabled={isExportingPng}
            style={{ fontSize: '0.75rem', padding: '7px 12px' }}
          >
            <Download size={13} />
            <span>{isExportingPng ? 'Rendering PNG...' : 'Download PNG Image'}</span>
          </button>
        </div>

        {/* 2. PDF Document */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
              <Printer size={18} />
              <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>PDF Document</strong>
            </div>
            <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
              Formatted print-ready architectural document layout with diagrams, cost, and component tables.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handlePrintPdf}
            style={{ fontSize: '0.75rem', padding: '7px 12px' }}
          >
            <Printer size={13} />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* 3. Mermaid Source */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed' }}>
              <FileCode size={18} />
              <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Mermaid.js Code</strong>
            </div>
            <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
              Direct text flowchart syntax for GitHub markdown, Notion, and live documentation wikis.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleCopyMermaid}
              style={{ flex: 1, fontSize: '0.72rem', padding: '6px 8px' }}
            >
              {copiedCode ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Copied' : 'Copy Syntax'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadMmd}
              style={{ flex: 1, fontSize: '0.72rem', padding: '6px 8px' }}
            >
              <Download size={12} />
              <span>.mmd File</span>
            </button>
          </div>
        </div>

        {/* 4. JSON Architecture Spec */}
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
              <FileText size={18} />
              <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Architecture JSON</strong>
            </div>
            <p style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
              Full machine-readable JSON specification of all services, connections, and metadata.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleDownloadJson}
            style={{ fontSize: '0.75rem', padding: '7px 12px' }}
          >
            <Download size={13} />
            <span>Download JSON Spec</span>
          </button>
        </div>
      </div>

      {/* 5. Terraform Infrastructure as Code (IaC) */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={18} color="#2563eb" />
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Terraform Infrastructure as Code (IaC)</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Generates declarative Terraform HCL resources for {cloudMode?.toUpperCase() || 'AWS'}. (Preview only; does not automatically deploy).
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleGenerateTerraform}
              disabled={isGeneratingTf}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              <Sparkles size={12} />
              <span>{isGeneratingTf ? 'Generating HCL...' : 'Generate Terraform HCL'}</span>
            </button>

            {terraformCode && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleDownloadTf}
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              >
                <Download size={12} />
                <span>Download main.tf</span>
              </button>
            )}
          </div>
        </div>

        {terraformCode ? (
          <pre
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              maxHeight: '260px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {terraformCode}
          </pre>
        ) : (
          <div style={{ padding: '14px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', fontSize: '0.74rem', color: '#64748b' }}>
            Click "Generate Terraform HCL" above to preview ready-to-run declarative infrastructure code.
          </div>
        )}
      </div>
    </div>
  );
}
