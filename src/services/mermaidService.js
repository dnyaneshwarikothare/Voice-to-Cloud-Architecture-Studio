/**
 * Mermaid Diagram Generator and Renderer Service
 */

import mermaid from 'mermaid';
import { COMPONENT_TYPE_CONFIG, sanitizeId } from '../utils/architectureSchema.js';
import { getCloudServiceForComponent } from '../utils/cloudMappings.js';

// Initialize Mermaid once with high-contrast developer dark theme
let mermaidInitialized = false;

export function initializeMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
      darkMode: true,
      background: '#0d131f',
      primaryColor: '#1e293b',
      primaryTextColor: '#f8fafc',
      primaryBorderColor: '#38bdf8',
      lineColor: '#60a5fa',
      secondaryColor: '#0f172a',
      tertiaryColor: '#1e1e38',
      mainBkg: '#0f172a',
      nodeBorder: '#3b82f6',
      clusterBkg: '#111827',
      clusterBorder: '#374151',
      titleColor: '#f1f5f9',
      edgeLabelBackground: '#0b0f19',
      actorBorder: '#6366f1',
      actorBkg: '#1e293b',
      actorTextColor: '#f8fafc'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      padding: 18,
      nodeSpacing: 45,
      rankSpacing: 60
    }
  });
  mermaidInitialized = true;
}

/**
 * Format a single node based on mode ('logical', 'aws', 'gcp')
 */
function formatNode(comp, mode = 'logical', failureState = null) {
  const type = comp.type || 'custom';
  const rawName = comp.name || comp.id;
  const config = COMPONENT_TYPE_CONFIG[type] || COMPONENT_TYPE_CONFIG.custom;
  const safeId = sanitizeId(comp.id);

  let displayTitle = rawName;
  let subtitle = config.label;

  if (mode === 'aws' || mode === 'gcp') {
    const cloudMapping = getCloudServiceForComponent(comp, mode);
    if (cloudMapping) {
      displayTitle = cloudMapping.service;
      subtitle = `${rawName} (${cloudMapping.category})`;
    }
  }

  const isFailed = failureState?.failedIds?.includes(comp.id);
  const isCascaded = failureState?.cascadedIds?.includes(comp.id);

  if (isFailed) {
    displayTitle = `❌ [FAILED] ${displayTitle}`;
    subtitle = `OUTAGE - ${subtitle}`;
  } else if (isCascaded) {
    displayTitle = `⚠️ [IMPACTED] ${displayTitle}`;
    subtitle = `DEGRADED - ${subtitle}`;
  }

  // Clean strings to prevent syntax breaking in Mermaid
  const safeTitle = displayTitle.replace(/["\n\r#;]/g, ' ').trim();
  const safeSubtitle = subtitle.replace(/["\n\r#;]/g, ' ').trim();
  const innerHtml = `<b>${safeTitle}</b><br/><small style='color:#94a3b8;'>${safeSubtitle}</small>`;

  switch (config.shape) {
    case 'cylinder':
      return `${safeId}[("${innerHtml}")]`;
    case 'hexagon':
      return `${safeId}{{"${innerHtml}"}}`;
    case 'subroutine':
      return `${safeId}[["${innerHtml}"]]`;
    case 'stadium':
      return `${safeId}(["${innerHtml}"])`;
    case 'rhombus':
      return `${safeId}{"${innerHtml}"}`;
    default:
      return `${safeId}["${innerHtml}"]`;
  }
}

/**
 * Generate Mermaid Flowchart syntax from Architecture JSON
 */
export function generateMermaidCode(architecture, options = {}) {
  const {
    direction = 'LR', // 'LR' or 'TD'
    mode = 'logical', // 'logical', 'aws', 'gcp'
    failureState = null
  } = options;

  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return 'flowchart LR\n  empty["Add or speak components to build architecture"]';
  }

  const lines = [`flowchart ${direction}`];

  // Render components
  architecture.components.forEach((comp) => {
    lines.push(`  ${formatNode(comp, mode, failureState)}`);
  });

  lines.push('');

  // Render connections
  if (Array.isArray(architecture.connections)) {
    architecture.connections.forEach((conn) => {
      if (!conn.from || !conn.to) return;
      const safeFrom = sanitizeId(conn.from);
      const safeTo = sanitizeId(conn.to);
      if (conn.label) {
        const safeLabel = conn.label.replace(/["\n\r|#;]/g, ' ').trim();
        lines.push(`  ${safeFrom} -->|"${safeLabel}"| ${safeTo}`);
      } else {
        lines.push(`  ${safeFrom} --> ${safeTo}`);
      }
    });
  }

  // Apply component styling classes
  lines.push('');
  architecture.components.forEach((comp) => {
    const safeId = sanitizeId(comp.id);
    const isFailed = failureState?.failedIds?.includes(comp.id);
    const isCascaded = failureState?.cascadedIds?.includes(comp.id);

    if (isFailed) {
      lines.push(`  style ${safeId} fill:#450a0a,stroke:#f43f5e,stroke-width:3px,stroke-dasharray: 5 5,color:#fda4af`);
    } else if (isCascaded) {
      lines.push(`  style ${safeId} fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fed7aa`);
    } else {
      const config = COMPONENT_TYPE_CONFIG[comp.type] || COMPONENT_TYPE_CONFIG.custom;
      const strokeColor = config.color || '#38bdf8';
      lines.push(`  style ${safeId} fill:#111827,stroke:${strokeColor},stroke-width:2px,color:#f8fafc`);
    }
  });

  return lines.join('\n');
}

/**
 * Render Mermaid code into an SVG element
 */
export async function renderMermaidSvg(containerId, code) {
  initializeMermaid();
  const renderId = `mermaid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const { svg } = await mermaid.render(renderId, code);
    return { success: true, svg };
  } catch (error) {
    console.error('Mermaid render error:', error);
    // Cleanup any orphaned Mermaid error containers in DOM
    if (typeof document !== 'undefined') {
      const errEl = document.getElementById(`d${renderId}`);
      if (errEl) errEl.remove();
      document.querySelectorAll('[id^="dmermaid_"]').forEach(el => el.remove());
    }
    return {
      success: false,
      error: error.message || 'Failed to render Mermaid diagram'
    };
  }
}

/**
 * Export SVG string as a PNG data URL
 */
export function svgToPngDataUrl(svgString, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = svgDoc.documentElement;

      let width = parseFloat(svgEl.getAttribute('width')) || 800;
      let height = parseFloat(svgEl.getAttribute('height')) || 600;

      // Handle viewBox if width/height missing
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(parseFloat);
        if (parts.length === 4) {
          width = parts[2];
          height = parts[3];
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      // Draw dark background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG into image for canvas rasterization'));
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}
