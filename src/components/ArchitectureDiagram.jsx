import React, { useEffect, useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Move,
  Scan,
  Compass,
  Layers,
  Info,
  Plus,
  Trash2,
  Edit3,
  Split,
  Cloud
} from 'lucide-react';
import { generateMermaidCode, renderMermaidSvg } from '../services/mermaidService';

export function ArchitectureDiagram({
  architecture,
  scaledArchitecture = null,
  activeView = 'current', // 'current' or 'scaled'
  onViewChange,
  cloudMode = 'logical',
  onCloudModeChange,
  direction = 'LR',
  onDirectionToggle,
  architectureLevel = 'c4-container',
  onLevelChange,
  failureState = null,
  selectedComponent = null,
  onSelectComponent,
  onOpenExplainModal,
  onOpenAddComponent,
  onOpenAddConnection,
  onDeleteSelectedComponent
}) {
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Active architecture to render
  const targetArch = (activeView === 'scaled' && scaledArchitecture) ? scaledArchitecture : architecture;

  useEffect(() => {
    let isCancelled = false;

    async function updateDiagram() {
      if (!targetArch || !targetArch.components || targetArch.components.length === 0) {
        setSvgContent('');
        setRenderError(null);
        return;
      }

      const mermaidCode = generateMermaidCode(targetArch, {
        direction,
        mode: cloudMode,
        failureState,
        level: architectureLevel
      });

      const result = await renderMermaidSvg('canvas_diagram', mermaidCode);

      if (!isCancelled) {
        if (result.success) {
          setSvgContent(result.svg);
          setRenderError(null);
        } else {
          setRenderError(result.error);
        }
      }
    }

    updateDiagram();

    return () => {
      isCancelled = true;
    };
  }, [targetArch, cloudMode, direction, failureState, architectureLevel]);

  // Handle clicking on rendered SVG nodes to select component in editor & open inspector
  useEffect(() => {
    if (!containerRef.current || !onSelectComponent) return;

    const handleClick = (e) => {
      const nodeEl = e.target.closest('.node');
      if (nodeEl && nodeEl.id && targetArch?.components) {
        const elId = nodeEl.id.toLowerCase();
        let found = targetArch.components.find(c => {
          const cId = c.id.toLowerCase();
          return elId === cId || elId === `flowchart-${cId}` || elId.includes(`-${cId}-`) || elId.endsWith(`-${cId}`) || elId.startsWith(`${cId}-`);
        });
        if (!found) {
          found = targetArch.components.find(c => elId.includes(c.id.toLowerCase()));
        }
        if (found) {
          onSelectComponent(found);
        }
      }
    };

    const el = containerRef.current;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [targetArch, onSelectComponent]);

  // Mouse drag panning handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.node') || e.target.closest('button') || e.target.closest('select')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.35, z - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to screen calculation
  const handleFitToScreen = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="diagram-canvas-container"
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              height: '100vh',
              width: '100vw'
            }
          : {}
      }
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas Top Controls Toolbar */}
      <div className="diagram-toolbar">
        {/* Current vs Scaled Architecture View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="tab-row" style={{ padding: '2px' }}>
            <button
              className={`tab-btn ${activeView === 'current' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('current')}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              Current Architecture
            </button>
            <button
              className={`tab-btn ${activeView === 'scaled' ? 'active' : ''}`}
              onClick={() => onViewChange && onViewChange('scaled')}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              title={scaledArchitecture ? 'View Scaled Future Architecture' : 'Generate Scaled Architecture on Right Panel'}
            >
              Scaled Future Architecture {scaledArchitecture ? '✓' : ''}
            </button>
          </div>
        </div>

        {/* Architecture Levels Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Level:</span>
          <select
            className="select-custom"
            value={architectureLevel}
            onChange={(e) => onLevelChange && onLevelChange(e.target.value)}
            style={{ width: 'auto', padding: '3px 8px', fontSize: '0.72rem', height: '28px' }}
          >
            <option value="high-level">High-Level Overview</option>
            <option value="c4-context">C4 Context (System Boundary)</option>
            <option value="c4-container">C4 Container (Apps & DBs)</option>
            <option value="c4-component">C4 Component (Detailed Services)</option>
          </select>
        </div>

        {/* Cloud Mode & Direction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            className="select-custom"
            value={cloudMode}
            onChange={(e) => onCloudModeChange && onCloudModeChange(e.target.value)}
            style={{ width: 'auto', padding: '3px 8px', fontSize: '0.72rem', height: '28px' }}
          >
            <option value="logical">Logical View</option>
            <option value="aws">AWS Mapping</option>
            <option value="gcp">GCP Mapping</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onDirectionToggle}
            title={`Toggle Layout Flow: Currently ${direction === 'LR' ? 'Horizontal (Left to Right)' : 'Vertical (Top to Bottom)'}`}
            style={{ fontSize: '0.72rem', padding: '3px 8px', height: '28px' }}
          >
            <Split size={12} />
            <span>{direction}</span>
          </button>

          {/* Explain Architecture Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenExplainModal}
            title="Explain Architecture in Plain English"
            style={{ fontSize: '0.72rem', padding: '3px 8px', height: '28px', color: '#2563eb', borderColor: '#bfdbfe' }}
          >
            <Compass size={13} color="#2563eb" />
            <span>Explain</span>
          </button>
        </div>
      </div>

      {/* Provider Alternative Notice Banner */}
      {targetArch?.provider_notice && (
        <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '5px 14px', fontSize: '0.73rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="#2563eb" />
          <span><b>Provider Notice:</b> {targetArch.provider_notice}</span>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        className="diagram-viewport"
        ref={containerRef}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {renderError ? (
          <div
            style={{
              padding: '24px',
              maxWidth: '480px',
              textAlign: 'center',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c'
            }}
          >
            <AlertTriangle size={28} style={{ marginBottom: '8px', color: '#dc2626' }} />
            <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Diagram Rendering Notice</h4>
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>{renderError}</p>
          </div>
        ) : svgContent ? (
          <div
            className="mermaid-svg-wrapper"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isPanning ? 'none' : 'transform 0.12s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
            <p style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>
              No Architecture Diagram Generated Yet
            </p>
            <p style={{ fontSize: '0.78rem' }}>
              Speak into the microphone or enter text on the left to generate your cloud architecture.
            </p>
          </div>
        )}
      </div>

      {/* Canvas Top Quick Actions Bar */}
      <div className="canvas-actions-bar">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenAddComponent}
          title="Add a new component to this architecture"
        >
          <Plus size={12} />
          <span>Add Component</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenAddConnection}
          title="Connect two components"
        >
          <Split size={12} />
          <span>Add Connection</span>
        </button>

        {selectedComponent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 600 }}>
              Selected: {selectedComponent.name}
            </span>
            <button
              className="icon-btn"
              onClick={onDeleteSelectedComponent}
              title="Delete Selected Component"
              style={{ width: '24px', height: '24px', border: 'none', color: '#dc2626' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Floating Canvas Zoom and Pan Controls */}
      <div className="canvas-controls">
        <button className="icon-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={15} />
        </button>
        <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={15} />
        </button>
        <button className="icon-btn" onClick={handleFitToScreen} title="Fit to Screen">
          <Scan size={15} />
        </button>
        <button className="icon-btn" onClick={handleResetZoom} title="Reset View (1:1)">
          <RotateCcw size={15} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
  );
}
