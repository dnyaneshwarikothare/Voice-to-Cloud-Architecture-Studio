import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, FileImage, FileJson } from 'lucide-react';
import { generateMermaidCode, renderMermaidSvg, svgToPngDataUrl } from '../services/mermaidService';
import { generateTerraformApi } from '../services/apiService';

export function ExportModal({ isOpen, onClose, architecture, cloudMode, direction }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  if (!isOpen) return null;

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

  // Copy Architecture Description Summary
  const handleCopySummary = async () => {
    const summary = [
      `# Architecture: ${architecture.name || 'Cloud Architecture'}`,
      `**Description:** ${architecture.description || architecture.rawText || 'Software architecture model'}`,
      '',
      '## Components:',
      ...(architecture.components || []).map(c => `- **${c.name}** (${c.type}): ${c.description || ''}`),
      '',
      '## Connections:',
      ...(architecture.connections || []).map(conn => `- ${conn.from} -> ${conn.to} ${conn.label ? `[${conn.label}]` : ''}`)
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
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
    a.download = `architecture_${Date.now()}.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download JSON file
  const handleDownloadJson = () => {
    const blob = new Blob([architectureJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export SVG file
  const handleExportSvg = async () => {
    const res = await renderMermaidSvg('export_svg_tmp', mermaidCode);
    if (res.success && res.svg) {
      const blob = new Blob([res.svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `architecture_${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Export PNG file
  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const res = await renderMermaidSvg('export_png_tmp', mermaidCode);
      if (res.success && res.svg) {
        const dataUrl = await svgToPngDataUrl(res.svg, 2);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `architecture_${Date.now()}.png`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Export Architecture & Diagram
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleCopyMermaid}>
              {copiedCode ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copiedCode ? 'Copied Mermaid!' : 'Copy Mermaid Code'}
            </button>

            <button className="btn btn-secondary" onClick={handleCopySummary}>
              {copiedSummary ? <Check size={16} color="#10b981" /> : <FileCode size={16} />}
              {copiedSummary ? 'Copied Architecture!' : 'Copy Architecture MD'}
            </button>

            <button className="btn btn-secondary" onClick={handleExportSvg}>
              <Download size={16} />
              Export SVG Diagram
            </button>

            <button className="btn btn-secondary" onClick={handleExportPng} disabled={isExportingPng}>
              <FileImage size={16} />
              {isExportingPng ? 'Rasterizing...' : 'Export High-Res PNG'}
            </button>

            <button className="btn btn-secondary" onClick={handleDownloadMmd}>
              <FileCode size={16} />
              Download .mmd File
            </button>

            <button className="btn btn-secondary" onClick={handleDownloadJson}>
              <FileJson size={16} />
              Download JSON
            </button>

            <button className="btn btn-secondary" onClick={() => window.print()}>
              <FileCode size={16} />
              Print / Save as PDF
            </button>

            <button className="btn btn-secondary" onClick={async () => {
              const res = await generateTerraformApi(architecture, cloudMode === 'gcp' ? 'gcp' : 'aws');
              const blob = new Blob([res.hcl_code || ''], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = res.filename || 'main.tf';
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <FileCode size={16} />
              Download Terraform (.tf)
            </button>
          </div>

          {/* Mermaid Code Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
              Generated Mermaid Syntax:
            </label>
            <pre
              style={{
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                overflowX: 'auto',
                maxHeight: '180px'
              }}
            >
              {mermaidCode}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
