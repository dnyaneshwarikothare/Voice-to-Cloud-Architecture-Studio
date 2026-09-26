/**
 * Architecture Schema and Validators for Voice-to-Cloud Architecture Studio
 */

export const COMPONENT_TYPES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DATABASE: 'database',
  CACHE: 'cache',
  QUEUE: 'queue',
  GATEWAY: 'gateway',
  LOADBALANCER: 'loadbalancer',
  CDN: 'cdn',
  STORAGE: 'storage',
  AUTH: 'auth',
  MONITORING: 'monitoring',
  CUSTOM: 'custom'
};

export const COMPONENT_TYPE_CONFIG = {
  frontend: {
    label: 'Frontend',
    shape: 'rect', // [label]
    color: '#3b82f6',
    icon: 'Layout',
    defaultTier: 'standard'
  },
  backend: {
    label: 'Backend Service',
    shape: 'rect',
    color: '#8b5cf6',
    icon: 'Server',
    defaultTier: 'compute-medium'
  },
  database: {
    label: 'Database',
    shape: 'cylinder', // [(label)]
    color: '#10b981',
    icon: 'Database',
    defaultTier: 'db-medium'
  },
  cache: {
    label: 'Cache Store',
    shape: 'hexagon', // {{label}}
    color: '#f59e0b',
    icon: 'Zap',
    defaultTier: 'cache-small'
  },
  queue: {
    label: 'Message Queue / Broker',
    shape: 'subroutine', // [[label]]
    color: '#ec4899',
    icon: 'Layers',
    defaultTier: 'standard'
  },
  gateway: {
    label: 'API Gateway',
    shape: 'subroutine',
    color: '#6366f1',
    icon: 'Waypoints',
    defaultTier: 'standard'
  },
  loadbalancer: {
    label: 'Load Balancer',
    shape: 'rhombus', // {label}
    color: '#06b6d4',
    icon: 'Split',
    defaultTier: 'standard'
  },
  cdn: {
    label: 'Content Delivery Network',
    shape: 'stadium', // ([label])
    color: '#14b8a6',
    icon: 'Globe',
    defaultTier: 'standard'
  },
  storage: {
    label: 'Object Storage',
    shape: 'cylinder',
    color: '#f97316',
    icon: 'HardDrive',
    defaultTier: 'storage-standard'
  },
  auth: {
    label: 'Authentication / Identity',
    shape: 'rect',
    color: '#e11d48',
    icon: 'ShieldCheck',
    defaultTier: 'standard'
  },
  monitoring: {
    label: 'Observability & Monitoring',
    shape: 'rect',
    color: '#a855f7',
    icon: 'Activity',
    defaultTier: 'standard'
  },
  custom: {
    label: 'Custom Component',
    shape: 'rect',
    color: '#64748b',
    icon: 'Cpu',
    defaultTier: 'standard'
  }
};

/**
 * Creates a unique sanitized component ID
 */
export function sanitizeId(name) {
  if (!name) return `comp_${Date.now()}`;
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

/**
 * Validate an architecture JSON structure
 */
export function validateArchitecture(arch) {
  const errors = [];
  const warnings = [];

  if (!arch || typeof arch !== 'object') {
    return {
      isValid: false,
      errors: ['Architecture must be an object with components and connections.'],
      warnings: []
    };
  }

  const components = Array.isArray(arch.components) ? arch.components : [];
  const connections = Array.isArray(arch.connections) ? arch.connections : [];

  if (components.length === 0) {
    warnings.push('Architecture has no components.');
  }

  const compIdMap = new Map();
  components.forEach((comp, idx) => {
    if (!comp.id) {
      errors.push(`Component at index ${idx} is missing an 'id'.`);
    } else if (compIdMap.has(comp.id)) {
      errors.push(`Duplicate component ID detected: '${comp.id}'.`);
    } else {
      compIdMap.set(comp.id, comp);
    }

    if (!comp.name) {
      warnings.push(`Component '${comp.id || idx}' is missing a 'name'.`);
    }

    if (comp.type && !COMPONENT_TYPES[comp.type.toUpperCase()]) {
      // It's an unrecognized type, we will treat it as custom
    }
  });

  const connectedIds = new Set();

  connections.forEach((conn, idx) => {
    if (!conn.from || !conn.to) {
      errors.push(`Connection at index ${idx} must specify both 'from' and 'to'.`);
      return;
    }

    if (!compIdMap.has(conn.from)) {
      errors.push(`Connection references unknown source ID: '${conn.from}'.`);
    } else {
      connectedIds.add(conn.from);
    }

    if (!compIdMap.has(conn.to)) {
      errors.push(`Connection references unknown target ID: '${conn.to}'.`);
    } else {
      connectedIds.add(conn.to);
    }

    if (conn.from === conn.to) {
      warnings.push(`Self-referencing loop detected on '${conn.from}'.`);
    }
  });

  // Check for orphan components if there are 2 or more components
  if (components.length > 1) {
    components.forEach((c) => {
      if (!connectedIds.has(c.id) && c.type !== 'monitoring') {
        warnings.push(`Component '${c.name || c.id}' is disconnected from the rest of the architecture.`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
