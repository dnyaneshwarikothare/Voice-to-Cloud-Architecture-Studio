import React from 'react';
import {
  Cloud,
  Save,
  Download,
  Plus,
  FolderOpen,
  Sparkles,
  Undo2,
  Redo2,
  History,
  BookOpen,
  Wrench,
  Cpu,
  Layers
} from 'lucide-react';
import { PRESET_ARCHITECTURES } from '../data/presetArchitectures';

export function Header({
  onSelectPreset,
  onNewArchitecture,
  onOpenSaveModal,
  onOpenSavedListModal,
  onOpenExportModal,
  onOpenVersionModal,
  onOpenAIUsageModal,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isBeginnerMode = false,
  onToggleBeginnerMode,
  activeArchitectureName,
  providerUsed = 'Auto-Router'
}) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-icon">
          <Cloud size={20} color="#ffffff" />
        </div>
        <div>
          <div className="nav-brand-title">Voice-to-Cloud Architecture Studio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className="nav-badge">Architecture Studio</span>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
              {activeArchitectureName ? `• ${activeArchitectureName}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* AI Provider & Health Status Pill */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenAIUsageModal}
          title="View AI Provider Router, Rate Limits, and Session Usage"
          style={{
            background: '#f8fafc',
            borderColor: '#cbd5e1',
            color: '#0f172a',
            fontSize: '0.72rem'
          }}
        >
          <Cpu size={13} color="#2563eb" />
          <span>AI Engine: <b>{providerUsed || 'Auto-Fallback'}</b></span>
        </button>

        {/* Undo / Redo Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <button
            className="icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? 'Undo last change' : 'No changes to undo'}
            style={{ width: '28px', height: '28px', padding: 0, opacity: canUndo ? 1 : 0.4, border: 'none', background: 'transparent' }}
          >
            <Undo2 size={13} />
          </button>
          <button
            className="icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? 'Redo change' : 'No changes to redo'}
            style={{ width: '28px', height: '28px', padding: 0, opacity: canRedo ? 1 : 0.4, border: 'none', background: 'transparent' }}
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Beginner vs Advanced Mode Toggle */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleBeginnerMode}
          title={isBeginnerMode ? 'Switch to Advanced Mode (Cloud Terminology)' : 'Switch to Beginner Mode (Plain English analogies)'}
          style={{
            fontSize: '0.72rem',
            background: isBeginnerMode ? '#f0fdf4' : '#ffffff',
            borderColor: isBeginnerMode ? '#86efac' : '#cbd5e1',
            color: isBeginnerMode ? '#15803d' : '#0f172a'
          }}
        >
          {isBeginnerMode ? <BookOpen size={13} color="#16a34a" /> : <Wrench size={13} color="#2563eb" />}
          <span>{isBeginnerMode ? 'Beginner Mode' : 'Advanced Mode'}</span>
        </button>

        {/* Demo Mode Presets Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            className="input-custom"
            style={{ padding: '4px 8px', fontSize: '0.74rem', height: '30px', width: 'auto' }}
            onChange={(e) => {
              if (e.target.value) {
                const preset = PRESET_ARCHITECTURES.find(p => p.id === e.target.value);
                if (preset) onSelectPreset(preset);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Load Demo (9 Domains)...</option>
            {PRESET_ARCHITECTURES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Version History Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenVersionModal}
          title="Save or compare architecture versions"
        >
          <History size={13} />
          <span>Versions</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onNewArchitecture}
          title="Create a new blank architecture"
        >
          <Plus size={13} />
          <span>New</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSaveModal}
          title="Save current architecture to database or library"
        >
          <Save size={13} />
          <span>Save</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSavedListModal}
          title="View and restore saved architectures"
        >
          <FolderOpen size={13} />
          <span>Library</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenExportModal}
          title="Export Mermaid code, SVG, PNG, JSON, PDF, or Terraform"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
