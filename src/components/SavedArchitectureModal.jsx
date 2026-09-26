import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, FolderOpen, Clock, Layers, ArrowRight, Database, HardDrive } from 'lucide-react';
import { getProjectsApi, saveProjectApi } from '../services/apiService';

const STORAGE_KEY = 'v2c_saved_architectures_v1';

export function SavedArchitectureModal({
  isOpen,
  mode = 'list', // 'save' or 'list'
  onClose,
  currentArchitecture,
  currentAssumptions,
  cloudMode,
  onLoadArchitecture
}) {
  const [savedItems, setSavedItems] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [storageSource, setStorageSource] = useState('db'); // 'db' or 'local'

  useEffect(() => {
    if (!isOpen) return;

    async function loadSaved() {
      try {
        const items = await getProjectsApi();
        if (Array.isArray(items) && items.length > 0) {
          setSavedItems(items);
          setStorageSource('db');
        } else {
          // Check local storage fallback
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            setSavedItems(JSON.parse(raw));
            setStorageSource('local');
          } else {
            setSavedItems([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load from API, falling back to localStorage:', err);
        const raw = localStorage.getItem(STORAGE_KEY);
        setSavedItems(raw ? JSON.parse(raw) : []);
        setStorageSource('local');
      }
    }

    loadSaved();

    if (mode === 'save') {
      setSaveName(currentArchitecture?.project_name || currentArchitecture?.name || `Architecture ${new Date().toLocaleDateString()}`);
      setSaveDescription(currentArchitecture?.rawText || currentArchitecture?.description || '');
    }
  }, [isOpen, mode, currentArchitecture]);

  if (!isOpen) return null;

  const handleSaveCurrent = async (e) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    setIsSaving(true);
    const newProjectPayload = {
      name: saveName.trim(),
      description: saveDescription.trim(),
      cloud_provider: cloudMode || 'logical',
      architecture: currentArchitecture,
      cost_assumptions: currentAssumptions
    };

    try {
      await saveProjectApi(newProjectPayload);
      // Also cache in local storage for zero-dependency offline access
      const raw = localStorage.getItem(STORAGE_KEY);
      const localList = raw ? JSON.parse(raw) : [];
      const localItem = {
        id: `arch_${Date.now()}`,
        name: saveName.trim(),
        description: saveDescription.trim(),
        architecture: currentArchitecture,
        assumptions: currentAssumptions,
        cloudMode,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([localItem, ...localList]));
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error deleting from localStorage:', err);
    }
  };

  const handleSelectToLoad = (item) => {
    if (onLoadArchitecture) {
      onLoadArchitecture({
        ...item,
        architecture: item.architecture || item
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mode === 'save' ? <Save size={20} color="#818cf8" /> : <FolderOpen size={20} color="#818cf8" />}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {mode === 'save' ? 'Save Project to Architecture Library' : 'Project Library'}
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {mode === 'save' ? (
            <form onSubmit={handleSaveCurrent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                  Architecture Project Name:
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. My E-Commerce Microservice Architecture"
                  required
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    background: '#0b0f19',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                  Notes / Prompt Description:
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional notes or prompt that generated this architecture..."
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    background: '#0b0f19',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.4)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Database size={14} color="#10b981" />
                <span>
                  Saves to persistent SQLite database (<code>architecture_studio.db</code>) and local browser storage.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving || !saveName.trim()}>
                  <Save size={15} />
                  {isSaving ? 'Saving Project...' : 'Save Project'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Saved Projects ({savedItems.length})
                </span>
                <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={12} />
                  SQLite & Local Storage Synced
                </span>
              </div>

              {savedItems.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  No saved architectures found. Save your current architecture to build your library.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectToLoad(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                          {item.description ? item.description.slice(0, 60) + '...' : 'Saved architecture'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.68rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'Recent')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={11} />
                            {(item.architecture?.components || item.components || []).length} Components
                          </span>
                          <span className="opt-badge" style={{ textTransform: 'uppercase', fontSize: '0.62rem' }}>
                            {item.cloud_provider || item.cloudMode || 'Logical'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSelectToLoad(item)}
                        >
                          Load
                          <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSaved(item.id, e)}
                          className="icon-btn"
                          style={{ color: '#f43f5e' }}
                          title="Delete project"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
