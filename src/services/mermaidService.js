/**
 * Mermaid Diagram Generator and Renderer Service
 * Professional Developer / Cloud Architecture Light Theme
 */

import mermaid from 'mermaid';
import { COMPONENT_TYPE_CONFIG, sanitizeId } from '../utils/architectureSchema.js';
import { getCloudServiceForComponent } from '../utils/cloudMappings.js';

let mermaidInitialized = false;

export function initializeMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    themeVariables: {
      darkMode: false,
      background: '#ffffff',
      primaryColor: '#ffffff',
      primaryTextColor: '#0f172a',
      primaryBorderColor: '#2563eb',
      lineColor: '#64748b',
      secondaryColor: '#f8fafc',
      tertiaryColor: '#f1f5f9',
      mainBkg: '#ffffff',
      nodeBorder: '#2563eb',
      clusterBkg: '#f8fafc',
      clusterBorder: '#cbd5e1',
      titleColor: '#0f172a',
      edgeLabelBackground: '#ffffff',
      actorBorder: '#2563eb',
      actorBkg: '#ffffff',
      actorTextColor: '#0f172a'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      padding: 16,
      nodeSpacing: 48,
      rankSpacing: 64
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
    displayTitle = `[OUTAGE] ${displayTitle}`;
    subtitle = `OFFLINE - ${subtitle}`;
  } else if (isCascaded) {
    displayTitle = `[DEGRADED] ${displayTitle}`;
    subtitle = `IMPACTED - ${subtitle}`;
  }

  // Clean strings to prevent syntax breaking in Mermaid
  const safeTitle = displayTitle.replace(/["\n\r#;]/g, ' ').trim();
  const safeSubtitle = subtitle.replace(/["\n\r#;]/g, ' ').trim();
  const innerHtml = `<b>${safeTitle}</b><br/><small style='color:#475569;'>${safeSubtitle}</small>`;

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
    failureState = null,
    level = 'c4-container' // 'high-level', 'c4-context', 'c4-container', 'c4-component'
  } = options;

  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return 'flowchart LR\n  empty["Add or speak components to build architecture"]';
  }

  const lines = [`flowchart ${direction}`];

  // If C4 Context View: wrap within System Context boundary with User actor
  if (level === 'c4-context') {
    lines.push('  subgraph Context["System Context Boundary"]');
    lines.push('    direction LR');
    architecture.components.forEach((comp) => {
      lines.push(`    ${formatNode(comp, mode, failureState)}`);
    });
    lines.push('  end');
    lines.push('  user_actor(["👤 Active Users / Clients"]) --> Context');
  } else if (level === 'high-level') {
    // Filter to core tiers for high-level summary
    const coreComps = architecture.components.filter(c =>
      ['frontend', 'gateway', 'loadbalancer', 'backend', 'database', 'cdn'].includes(c.type)
    );
    const compsToRender = coreComps.length >= 2 ? coreComps : architecture.components;
    compsToRender.forEach((comp) => {
      lines.push(`  ${formatNode(comp, mode, failureState)}`);
    });
  } else {
    // Standard Container / Component level view
    architecture.components.forEach((comp) => {
      lines.push(`  ${formatNode(comp, mode, failureState)}`);
    });
  }

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

  // Apply professional light theme component styling classes
  lines.push('');
  architecture.components.forEach((comp) => {
    const safeId = sanitizeId(comp.id);
    const isFailed = failureState?.failedIds?.includes(comp.id);
    const isCascaded = failureState?.cascadedIds?.includes(comp.id);

    if (isFailed) {
      lines.push(`  style ${safeId} fill:#fef2f2,stroke:#ef4444,stroke-width:2px,stroke-dasharray: 4 4,color:#991b1b`);
    } else if (isCascaded) {
      lines.push(`  style ${safeId} fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#92400e`);
    } else {
      const config = COMPONENT_TYPE_CONFIG[comp.type] || COMPONENT_TYPE_CONFIG.custom;
      const strokeColor = config.color || '#2563eb';
      lines.push(`  style ${safeId} fill:#ffffff,stroke:${strokeColor},stroke-width:2px,color:#0f172a`);
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
    if (typeof document !== 'undefined') {
      const errEl = document.getElementById(`d${renderId}`);
      if (errEl) errEl.remove();
      document.querySelectorAll('[id^="dmermaid_"]').forEach(el => el.remove());
    }
    return {
      success: false,
      error: 'Unable to render this architecture diagram. Please check the architecture connections.'
    };
  }
}

/**
 * Export SVG string as a PNG data URL with crisp white background
 */
export function svgToPngDataUrl(svgString, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = svgDoc.documentElement;

      let width = parseFloat(svgEl.getAttribute('width')) || 900;
      let height = parseFloat(svgEl.getAttribute('height')) || 650;

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

      // Draw crisp clean white background for professional export
      ctx.fillStyle = '#ffffff';
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
