import React from 'react';
import { Cloud, Save, Download, Plus, FolderOpen, Sparkles, Undo2, Redo2, History, BookOpen, Wrench } from 'lucide-react';
import { PRESET_ARCHITECTURES } from '../data/presetArchitectures';

export function Header({
  onSelectPreset,
  onNewArchitecture,
  onOpenSaveModal,
  onOpenSavedListModal,
  onOpenExportModal,
  onOpenVersionModal,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isBeginnerMode = false,
  onToggleBeginnerMode,
  activeArchitectureName
}) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="nav-logo-icon">
          <Cloud size={22} color="#ffffff" />
        </div>
        <div>
          <div className="nav-brand-title">Voice-to-Cloud Architecture Studio</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span className="nav-badge">AI Studio</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {activeArchitectureName ? `• ${activeArchitectureName}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Undo / Redo Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <button
            className="icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? 'Undo last change' : 'No changes to undo'}
            style={{ width: '28px', height: '28px', padding: 0, opacity: canUndo ? 1 : 0.4 }}
          >
            <Undo2 size={14} />
          </button>
          <button
            className="icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? 'Redo change' : 'No changes to redo'}
            style={{ width: '28px', height: '28px', padding: 0, opacity: canRedo ? 1 : 0.4 }}
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Beginner vs Advanced Mode Toggle */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleBeginnerMode}
          title={isBeginnerMode ? 'Switch to Advanced Mode (Cloud Terminology)' : 'Switch to Beginner Mode (Plain English analogies)'}
          style={{
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isBeginnerMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            borderColor: isBeginnerMode ? '#10b981' : '#38bdf8',
            color: isBeginnerMode ? '#a7f3d0' : '#bae6fd'
          }}
        >
          {isBeginnerMode ? <BookOpen size={14} color="#10b981" /> : <Wrench size={14} color="#38bdf8" />}
          <span>{isBeginnerMode ? 'Beginner Mode' : 'Advanced Mode'}</span>
        </button>

        {/* Demo Mode Presets Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#a855f7" />
          <select
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px', fontSize: '0.76rem', background: '#0f172a' }}
            onChange={(e) => {
              if (e.target.value) {
                const preset = PRESET_ARCHITECTURES.find(p => p.id === e.target.value);
                if (preset) onSelectPreset(preset);
                e.target.value = '';
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>✨ Load Demo Architecture (9 Domains)...</option>
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
          <History size={14} />
          Versions
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onNewArchitecture}
          title="Create a new blank architecture"
        >
          <Plus size={14} />
          New
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSaveModal}
          title="Save current architecture to database or library"
        >
          <Save size={14} />
          Save
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenSavedListModal}
          title="View and restore saved architectures"
        >
          <FolderOpen size={14} />
          Library
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenExportModal}
          title="Export Mermaid code, SVG, PNG, JSON, or Terraform"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </header>
  );
}
