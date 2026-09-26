import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, AlertTriangle, Move } from 'lucide-react';
import { generateMermaidCode, renderMermaidSvg } from '../services/mermaidService';

export function ArchitectureDiagram({
  architecture,
  cloudMode = 'logical',
  direction = 'LR',
  failureState = null,
  onSelectComponent
}) {
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function updateDiagram() {
      if (!architecture || !architecture.components || architecture.components.length === 0) {
        setSvgContent('');
        setRenderError(null);
        return;
      }

      const mermaidCode = generateMermaidCode(architecture, {
        direction,
        mode: cloudMode,
        failureState
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
  }, [architecture, cloudMode, direction, failureState]);

  // Handle clicking on rendered SVG nodes to select component in editor & open inspector
  useEffect(() => {
    if (!containerRef.current || !onSelectComponent) return;

    const handleClick = (e) => {
      const nodeEl = e.target.closest('.node');
      if (nodeEl && nodeEl.id && architecture?.components) {
        const elId = nodeEl.id.toLowerCase();
        let found = architecture.components.find(c => {
          const cId = c.id.toLowerCase();
          return elId === cId || elId === `flowchart-${cId}` || elId.includes(`-${cId}-`) || elId.endsWith(`-${cId}`) || elId.startsWith(`${cId}-`);
        });
        if (!found) {
          found = architecture.components.find(c => elId.includes(c.id.toLowerCase()));
        }
        if (found) {
          onSelectComponent(found);
        }
      }
    };

    const el = containerRef.current;
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [architecture, onSelectComponent]);

  // Mouse drag panning handlers
  const handleMouseDown = (e) => {
    // Only pan if not clicking a node or button
    if (e.target.closest('.node') || e.target.closest('button')) return;
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
  const handleZoomOut = () => setZoom(z => Math.max(0.4, z - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
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
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              color: '#fda4af'
            }}
          >
            <AlertTriangle size={32} style={{ marginBottom: '12px', color: '#f43f5e' }} />
            <h4 style={{ fontWeight: 600, marginBottom: '6px' }}>Diagram Rendering Notice</h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{renderError}</p>
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
            <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '6px' }}>
              No Architecture Diagram Generated Yet
            </p>
            <p style={{ fontSize: '0.78rem' }}>
              Speak into the microphone or enter text on the left to generate your cloud architecture.
            </p>
          </div>
        )}
      </div>

      {/* Floating Canvas Zoom and Pan Controls */}
      <div className="canvas-controls">
        <button className="icon-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button className="icon-btn" onClick={handleResetZoom} title="Reset View (Zoom & Center)">
          <RotateCcw size={16} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}
