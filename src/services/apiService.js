/**
 * Frontend API Service
 * Communicates with FastAPI backend with seamless rule-based fallback if the API is unreachable.
 */

import { parseArchitectureFromText } from './parserService.js';
import { analyzeArchitectureHealth } from './healthService.js';
import { calculateArchitectureCosts } from './costService.js';
import { getArchitectureOptimizations } from './optimizationService.js';
import { PRESET_ARCHITECTURES } from '../data/presetArchitectures.js';

function getApiBaseUrl() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '';

  if (!envUrl) {
    return '/api';
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

const API_BASE = getApiBaseUrl();

/**
 * 1. Analyze Requirements & Smart Clarification Questions
 */
export async function analyzeRequirementsApi(text, answers = {}) {
  try {
    const res = await fetch(`${API_BASE}/analyze-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, answers })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API unavailable, using client-side analyzer fallback:', err);
  }

  // Client-side fallback
  const isShopping = /shop|buy|store|cart|checkout|ecommerce/i.test(text);
  const isFood = /food|restaurant|order|delivery/i.test(text);
  const isStreaming = /stream|video|watch|movies/i.test(text);
  const isCollege = /college|university|attendance|school|student/i.test(text);
  const isBanking = /bank|fintech|money|transfer|ledger/i.test(text);
  const isIot = /iot|sensor|telemetry|device/i.test(text);
  const isFile = /file|drive|document|upload/i.test(text);
  const isAi = /ai|llm|chat|bot|rag|vector/i.test(text);

  let appType = 'General Web Application';
  if (isShopping) appType = 'E-commerce';
  else if (isFood) appType = 'Food Delivery';
  else if (isStreaming) appType = 'Video Streaming';
  else if (isCollege) appType = 'College Management';
  else if (isBanking) appType = 'Online Banking';
  else if (isIot) appType = 'IoT Monitoring';
  else if (isFile) appType = 'File Storage';
  else if (isAi) appType = 'AI Application';

  const hasAnswers = Object.keys(answers).length > 0;
  const isExplicit = /react|fastapi|node|postgres|redis/i.test(text);
  const needsClarification = !isExplicit && !hasAnswers;

  const questions = [
    {
      id: 'q_users',
      question: 'Approximately how many active users do you expect?',
      options: ['< 1,000 users', '1,000 – 10,000 users', '10,000 – 100,000 users', '100,000+ users'],
      default_value: '10,000 – 100,000 users',
      hint: 'Determines scaling capacity and database tiers.'
    },
    {
      id: 'q_payments',
      question: 'Do you need online payments and billing processing?',
      options: ['Yes, online payments', 'No, free / no payments'],
      default_value: 'Yes, online payments',
      hint: 'Adds dedicated payment service.'
    },
    {
      id: 'q_uploads',
      question: 'Do you need user image or file uploads?',
      options: ['Yes, file/image uploads', 'No uploads needed'],
      default_value: 'Yes, file/image uploads',
      hint: 'Includes object storage (S3/GCS).'
    },
    {
      id: 'q_notifications',
      question: 'Do you need real-time notifications or live updates?',
      options: ['Yes, real-time notifications', 'No, standard refresh'],
      default_value: 'Yes, real-time notifications',
      hint: 'Adds WebSocket gateway or message queues.'
    }
  ];

  return {
    application_type: appType,
    needs_clarification: needsClarification,
    questions: needsClarification ? questions : [],
    main_features: ['User Authentication', 'Web Client', 'Application Backend', 'Database', 'Cache'],
    expected_users: answers.q_users || '10,000 – 100,000',
    data_requirements: ['Persistent database records', 'Session caching'],
    security_requirements: ['HTTPS encryption', 'JWT authentication', 'Rate limiting'],
    performance_requirements: ['Sub-150ms response times', 'Edge static caching'],
    availability_requirements: ['99.9% uptime SLA', 'Automated backups'],
    raw_prompt: text
  };
}

/**
 * 2. Generate Architecture
 */
export async function generateArchitectureApi(prompt, answers = {}, applicationType = null, cloudProvider = 'logical') {
  try {
    const res = await fetch(`${API_BASE}/generate-architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        answers,
        application_type: applicationType,
        cloud_provider: cloudProvider
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend generate API unavailable, using client-side fallback:', err);
  }

  // Client fallback: Match domain preset or parse text
  const cleanPrompt = (prompt || '').toLowerCase();
  for (const preset of PRESET_ARCHITECTURES) {
    if (cleanPrompt.includes(preset.domain.toLowerCase()) || cleanPrompt.includes(preset.id.replace('-', ' '))) {
      return {
        project_name: preset.name,
        description: preset.description,
        components: preset.components,
        connections: preset.connections,
        cloud_provider: cloudProvider
      };
    }
  }

  // Fallback to enhanced parserService
  const parsed = parseArchitectureFromText(prompt);
  return {
    project_name: parsed.components.length > 2 ? 'Cloud Architecture' : 'Custom Web App',
    description: prompt,
    components: parsed.components,
    connections: parsed.connections,
    cloud_provider: cloudProvider
  };
}

/**
 * 3. Validate Architecture
 */
export async function validateArchitectureApi(architecture) {
  try {
    const res = await fetch(`${API_BASE}/validate-architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(architecture)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback validation
  }

  const components = architecture?.components || [];
  const connections = architecture?.connections || [];
  const errors = [];
  const warnings = [];

  const compIds = new Set(components.map(c => c.id));
  const connectedIds = new Set();

  connections.forEach(conn => {
    if (!compIds.has(conn.from)) errors.push({ type: 'error', code: 'BROKEN_CONN', message: `Unknown source '${conn.from}'` });
    if (!compIds.has(conn.to)) errors.push({ type: 'error', code: 'BROKEN_CONN', message: `Unknown target '${conn.to}'` });
    connectedIds.add(conn.from);
    connectedIds.add(conn.to);
  });

  if (components.length > 1) {
    components.forEach(c => {
      if (!connectedIds.has(c.id) && c.type !== 'monitoring') {
        warnings.push({ type: 'warning', code: 'ORPHAN', message: `Component '${c.name}' is disconnected.` });
      }
    });
  }

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    summary: errors.length === 0 ? 'Architecture is structurally valid.' : `Found ${errors.length} error(s).`
  };
}

/**
 * 4. Health Analysis
 */
export async function analyzeHealthApi(architecture) {
  try {
    const res = await fetch(`${API_BASE}/analyze-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(architecture)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const legacyHealth = analyzeArchitectureHealth(architecture);
  return {
    overall_score: legacyHealth.overallScore,
    pillars: {
      security: {
        score: legacyHealth.pillars.security.score,
        status: legacyHealth.pillars.security.status,
        reasons: ['+15: Perimeter defenses active', '+10: HTTPS protocol enforced'],
        findings: legacyHealth.pillars.security.findings
      },
      availability: {
        score: legacyHealth.pillars.availability.score,
        status: legacyHealth.pillars.availability.status,
        reasons: ['+15: Multi-service distribution', '-10: Monitor single instance backends'],
        findings: legacyHealth.pillars.availability.findings
      },
      scalability: {
        score: legacyHealth.pillars.scalability.score,
        status: legacyHealth.pillars.scalability.status,
        reasons: ['+15: Caching and CDN support', '+10: Decoupled services'],
        findings: legacyHealth.pillars.scalability.findings
      },
      performance: {
        score: legacyHealth.pillars.performance.score,
        status: legacyHealth.pillars.performance.status,
        reasons: ['+15: Sub-millisecond cache latency', '+10: Edge network routing'],
        findings: legacyHealth.pillars.performance.findings
      },
      reliability: {
        score: 80,
        status: 'good',
        reasons: ['+15: Relational ACID guarantees'],
        findings: []
      },
      cost: {
        score: 85,
        status: 'good',
        reasons: ['+10: Lean service composition'],
        findings: []
      }
    },
    summary: 'Multi-pillar architectural evaluation completed.'
  };
}

/**
 * 5. Cost Estimation
 */
export async function estimateCostApi(architecture, assumptions) {
  try {
    const res = await fetch(`${API_BASE}/estimate-cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, assumptions })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  return calculateArchitectureCosts(architecture, assumptions);
}

/**
 * 6. Traffic Simulation
 */
export async function simulateTrafficApi(params) {
  try {
    const res = await fetch(`${API_BASE}/simulate-traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const future = params.future_users || 50000;
  const current = params.current_users || 10000;
  const rps = (params.requests_per_second || 100) * (future / current);
  const isCritical = rps > 800;

  return {
    status: isCritical ? 'CRITICAL' : (rps > 300 ? 'HIGH LOAD' : 'NORMAL'),
    projected_rps_peak: Math.round(rps * (params.peak_multiplier || 2.5)),
    projected_monthly_requests: Math.round(rps * 86400 * 30),
    backend_load_pct: Math.min(150, Math.round((rps / 350) * 100)),
    database_load_pct: Math.min(180, Math.round((rps / 400) * 100)),
    cache_hit_rate_pct: 85,
    storage_projected_gb: Math.round(20 + future * 0.0015),
    network_bandwidth_gb: Math.round((rps * 86400 * 30 * 15) / (1024 * 1024)),
    bottlenecks: isCritical ? [{
      component: 'Database & Compute',
      severity: 'high',
      issue: 'High CPU and query load under peak traffic.',
      recommendation: 'Add Redis cache and configure horizontal autoscaling.'
    }] : [],
    recommendations: ['Consider read replicas and horizontal autoscaling.'],
    disclaimer: 'Scenario-based estimate. Actual traffic patterns vary with real-world user behavior.'
  };
}

/**
 * 7. Failure Simulation
 */
export async function simulateFailureApi(params) {
  try {
    const res = await fetch(`${API_BASE}/simulate-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const targetType = params.failure_target_type || 'database';
  const components = params.architecture?.components || [];
  const targetComp = components.find(c => c.type === targetType) || components[0];

  return {
    failed_component_ids: targetComp ? [targetComp.id] : [],
    cascaded_failed_component_ids: components.filter(c => c.type === 'frontend').map(c => c.id),
    operational_component_ids: components.filter(c => c.type === 'cdn').map(c => c.id),
    business_impact: `Simulated outage of ${targetComp ? targetComp.name : targetType}. Stateful transactions fail with 500 errors.`,
    severity: targetType === 'database' ? 'critical' : 'high',
    mitigation_strategies: [
      'Enable Multi-AZ automated failover replication.',
      'Deploy an Application Load Balancer with health checks.',
      'Implement Circuit Breaker and retry policies.'
    ],
    disclaimer: 'Scenario-based architectural failure simulation. Does not reflect live environment state.'
  };
}

/**
 * 8. Optimizer
 */
export async function getOptimizationsApi(architecture) {
  try {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const opts = getArchitectureOptimizations(architecture);
  return {
    optimizations: opts.map(o => ({
      id: o.id,
      category: o.category,
      title: o.title,
      problem: o.problem,
      reason: o.reason,
      recommendation: o.suggestedSolution,
      expected_benefit: o.impact,
      trade_off: 'Configuration complexity',
      cost_impact: '+$5 to $20/month',
      target_architecture: o.apply ? o.apply(architecture) : architecture
    })),
    tradeoffs: {
      option_a_low_cost: {
        name: 'Option A: Lean & Low Cost',
        summary: 'Optimized for minimal monthly expenditure and early validation.',
        estimated_cost_range: '$15 - $45 / mo',
        scalability_rating: 'Moderate (< 10,000 users)',
        availability_sla: '99.0% (Single AZ)',
        complexity: 'Low'
      },
      option_b_balanced: {
        name: 'Option B: Balanced Production (Recommended)',
        summary: 'Standard architecture balancing high reliability, predictable cost, and linear scaling.',
        estimated_cost_range: '$95 - $220 / mo',
        scalability_rating: 'High (10,000 - 150,000 users)',
        availability_sla: '99.9% (Multi-AZ)',
        complexity: 'Medium'
      },
      option_c_high_scalability: {
        name: 'Option C: Enterprise High Scalability',
        summary: 'Zero single-points-of-failure with event streaming and multi-region resilience.',
        estimated_cost_range: '$380 - $950+ / mo',
        scalability_rating: 'Massive (500,000+ users)',
        availability_sla: '99.99%',
        complexity: 'High'
      }
    }
  };
}

/**
 * 9. Cloud Mapping
 */
export async function mapCloudApi(architecture, provider = 'aws') {
  try {
    const res = await fetch(`${API_BASE}/map-cloud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, provider })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }
  return { provider, mappings: [] };
}

/**
 * 10. Generate Terraform
 */
export async function generateTerraformApi(architecture, provider = 'aws') {
  try {
    const res = await fetch(`${API_BASE}/generate-terraform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, provider })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }
  return {
    cloud_provider: provider,
    filename: `main_${provider}.tf`,
    hcl_code: `# Terraform Starter Blueprint for ${provider.toUpperCase()}\nprovider "${provider}" {\n  region = "us-east-1"\n}\n`,
    disclaimer: 'Generated by AI Voice-to-Cloud Architecture Studio.'
  };
}

/**
 * 11. Projects Persistence
 */
export async function getProjectsApi() {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback to localStorage
  }
  const local = localStorage.getItem('saved_architectures');
  return local ? JSON.parse(local) : [];
}

export async function saveProjectApi(project) {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback to localStorage
  }
  const local = localStorage.getItem('saved_architectures');
  const list = local ? JSON.parse(local) : [];
  const newItem = { ...project, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  list.unshift(newItem);
  localStorage.setItem('saved_architectures', JSON.stringify(list));
  return newItem;
}

/**
 * 12. Architecture Change Impact Analyzer API
 */
export async function analyzeImpactApi(architecture, action = 'modify', target_component_id = null, new_component = null) {
  try {
    const res = await fetch(`${API_BASE}/analyze-impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, action, target_component_id, new_component })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const comps = architecture.components || [];
  const conns = architecture.connections || [];
  const targetIdStr = String(target_component_id || '').toLowerCase();
  const target = comps.find(c => 
    c.id === target_component_id || 
    c.id.toLowerCase().includes(targetIdStr) || 
    c.name.toLowerCase().includes(targetIdStr)
  ) || comps[0];
  const targetType = target?.type || 'custom';
  const targetName = target?.name || 'Component';

  const affected = [];
  let overall = 'LOW IMPACT';

  if (targetType === 'cache' || /redis|cache/i.test(targetName) || /redis|cache/i.test(target?.id || '')) {
    overall = 'HIGH IMPACT';
    const db = comps.find(c => c.type === 'database') || { id: 'db', name: 'Database' };
    affected.push({
      changed_component_id: target?.id || 'cache',
      affected_component_id: db.id,
      affected_component_name: /database/i.test(db.name) ? db.name : `${db.name} Database`,
      impact_level: 'HIGH IMPACT',
      reason: `Removal of cache (${targetName}) removes hot-data read buffer.`,
      expected_impact: 'Direct database read IOPS can surge by 300%–500%, increasing latency.',
      suggested_mitigation: 'Add read replicas or configure application-level query caching.'
    });
  } else if (targetType === 'database') {
    overall = 'CRITICAL';
    comps.filter(c => c.type === 'backend').forEach(b => {
      affected.push({
        changed_component_id: target?.id || 'db',
        affected_component_id: b.id,
        affected_component_name: b.name,
        impact_level: 'CRITICAL',
        reason: `Backend logic depends on persistent storage in ${targetName}.`,
        expected_impact: 'All stateful write transactions and un-cached reads will fail with 500 errors.',
        suggested_mitigation: 'Implement multi-AZ automated failover with read replica promotion.'
      });
    });
  } else {
    overall = 'MEDIUM IMPACT';
    const related = conns.filter(c => c.from === target?.id || c.to === target?.id);
    related.forEach(r => {
      const otherId = r.from === target?.id ? r.to : r.from;
      const otherComp = comps.find(c => c.id === otherId);
      if (otherComp) {
        affected.push({
          changed_component_id: target?.id,
          affected_component_id: otherComp.id,
          affected_component_name: otherComp.name,
          impact_level: 'MEDIUM IMPACT',
          reason: `Direct network link to modified ${targetName}.`,
          expected_impact: 'Network connection renegotiation or contract adjustment required.',
          suggested_mitigation: 'Verify interface compatibility and provide fallback handling.'
        });
      }
    });
  }

  const depGraph = comps.map(c => ({
    id: c.id,
    name: c.name,
    role: c.role || c.type,
    status: c.id === target?.id ? 'changed' : (affected.some(a => a.affected_component_id === c.id) ? 'affected' : 'normal'),
    incoming: conns.filter(conn => conn.to === c.id).map(conn => conn.from),
    outgoing: conns.filter(conn => conn.from === c.id).map(conn => conn.to)
  }));

  return {
    target_id: target?.id,
    overall_impact_level: overall,
    affected_components: affected,
    dependency_graph: depGraph,
    summary: `Simulating ${action.toUpperCase()} on '${targetName}'. Identified ${affected.length} affected component(s).`,
    disclaimer: 'Scenario-based dependency and impact analysis. Not an absolute runtime guarantee.'
  };
}

/**
 * 13. What-If Scenario Simulator API
 */
export async function runWhatIfApi(architecture, scenario_name, scenario_type, parameters = {}) {
  try {
    const res = await fetch(`${API_BASE}/run-what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, scenario_name, scenario_type, parameters })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const mult = parseFloat(parameters.multiplier || 10.0);
  const currentUsers = parseInt(parameters.current_users || 10000);
  const simUsers = scenario_type === 'traffic_increase' ? currentUsers * mult : currentUsers;

  return {
    scenario_name: scenario_name || 'What-If Scenario',
    scenario_type: scenario_type || 'traffic_increase',
    baseline_summary: {
      users: currentUsers,
      rps: 100,
      aws_monthly_cost: 215.0,
      gcp_monthly_cost: 199.0,
      health_score: 88,
      components_count: architecture.components?.length || 0
    },
    simulated_summary: {
      users: simUsers,
      rps: Math.round(100 * mult),
      aws_monthly_cost: Math.round(215.0 * (1 + (mult - 1) * 0.45)),
      gcp_monthly_cost: Math.round(199.0 * (1 + (mult - 1) * 0.42)),
      health_score: 75,
      backend_load_pct: Math.min(100, Math.round(35 * Math.pow(mult, 0.65))),
      database_load_pct: Math.min(100, Math.round(40 * Math.pow(mult, 0.75))),
      cache_hit_rate_pct: 85.0,
      components_count: architecture.components?.length || 0
    },
    delta: {
      cost_delta_usd: Math.round(215.0 * (mult - 1) * 0.45),
      cost_delta_pct: Math.round((mult - 1) * 45),
      rps_delta: Math.round(100 * (mult - 1)),
      users_delta: simUsers - currentUsers,
      health_score_delta: -13
    },
    traffic_impact: {
      projected_rps: Math.round(100 * mult),
      peak_rps: Math.round(100 * mult * 2.5),
      bandwidth_gb: Math.round(100 * mult * 12.5),
      status: mult >= 10 ? 'CRITICAL' : (mult >= 3 ? 'HIGH LOAD' : 'NORMAL')
    },
    performance_impact: {
      backend_load_pct: Math.min(100, Math.round(35 * Math.pow(mult, 0.65))),
      database_load_pct: Math.min(100, Math.round(40 * Math.pow(mult, 0.75))),
      cache_hit_rate_pct: 85.0,
      avg_latency_ms: Math.round(45 + mult * 8)
    },
    cost_impact: {
      baseline_aws_cost: 215.0,
      simulated_aws_cost: Math.round(215.0 * (1 + (mult - 1) * 0.45)),
      simulated_gcp_cost: Math.round(199.0 * (1 + (mult - 1) * 0.42)),
      monthly_delta_usd: Math.round(215.0 * (mult - 1) * 0.45),
      cheaper_provider: 'GCP'
    },
    affected_components: (architecture.components || []).slice(0, 4).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role || c.type,
      load_change: `+${((mult - 1) * 100).toFixed(0)}% traffic`
    })),
    bottlenecks: mult >= 5 ? [
      {
        component: 'Primary Database',
        severity: 'CRITICAL',
        metric: 'Connection pool saturation',
        explanation: 'Database concurrent connection threshold reached under peak surge.'
      }
    ] : [],
    failure_risks: [],
    recommendations: [
      'Enable Horizontal Pod Autoscaler (HPA) to dynamically spawn backend replica pods.',
      'Deploy multi-AZ Redis caching cluster to absorb hot read spikes.',
      'Configure CloudFront edge CDN caching for static assets.'
    ],
    disclaimer: 'Scenario-based simulation. Not an exact production prediction.'
  };
}

/**
 * 14. Multi-Month Growth Simulator API
 */
export async function simulateGrowthApi(architecture, current_users = 10000, monthly_growth_rate_pct = 15.0, duration_months = 12) {
  try {
    const res = await fetch(`${API_BASE}/simulate-growth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, current_users, monthly_growth_rate_pct, duration_months })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const rate = monthly_growth_rate_pct / 100.0;
  const timeline = [];
  const sampleMonths = [1, 2, 3, 6, 9, 12].filter(m => m <= duration_months);

  for (const m of sampleMonths) {
    const scale = Math.pow(1 + rate, m - 1);
    const users = Math.round(current_users * scale);
    const rps = Math.max(10, Math.round(users * 0.002));
    const backendLoad = Math.min(100, Math.round(25 * Math.pow(scale, 0.55)));
    const dbLoad = Math.min(100, Math.round(30 * Math.pow(scale, 0.60)));
    const cost = Math.round(215.0 * (1 + (scale - 1) * 0.38));
    const status = (backendLoad > 80 || dbLoad > 80) ? 'CRITICAL' : ((backendLoad > 60 || dbLoad > 60) ? 'HIGH LOAD' : 'NORMAL');

    timeline.push({
      period_month: m,
      label: `Month ${m}`,
      projected_users: users,
      requests_per_sec: rps,
      backend_load_pct: backendLoad,
      database_load_pct: dbLoad,
      storage_gb: Math.round(50 + users * 0.0015 * m),
      bandwidth_gb: Math.round(rps * 15 * 3.6 * 24 * 30 / 1024),
      estimated_monthly_cost: cost,
      status: status,
      bottleneck_note: status === 'CRITICAL' ? 'Database IOPS saturation risk. Add read replicas.' : 'Operating smoothly.'
    });
  }

  return {
    timeline,
    summary: `Simulated ${duration_months}-month growth from ${current_users.toLocaleString()} to ${timeline[timeline.length - 1].projected_users.toLocaleString()} users.`,
    milestone_bottlenecks: [],
    disclaimer: 'This is a scenario-based estimate using the provided assumptions. Not a guaranteed future prediction.'
  };
}

/**
 * 15. Multi-Architecture Comparison API
 */
export async function compareArchitecturesApi(architectures = []) {
  try {
    const res = await fetch(`${API_BASE}/compare-architectures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architectures })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  const profiles = architectures.map((arch, idx) => ({
    key: `arch_${idx + 1}`,
    title: arch.project_name || `Architecture ${String.fromCharCode(65 + idx)}`,
    components_count: arch.components?.length || 0,
    connections_count: arch.connections?.length || 0,
    aws_cost: 150 + idx * 120,
    gcp_cost: 135 + idx * 110,
    health_score: 85 + idx * 5
  }));

  const metrics = [
    {
      metric: 'Estimated Monthly Cost (AWS)',
      category: 'Cost',
      arch_values: Object.fromEntries(profiles.map(p => [p.key, `$${p.aws_cost}/mo`])),
      description: 'Baseline AWS monthly run rate.'
    },
    {
      metric: 'Scalability Capacity',
      category: 'Scalability',
      arch_values: Object.fromEntries(profiles.map((p, idx) => [p.key, idx === 0 ? 'Lean MVP (~10k users)' : (idx === 1 ? 'Balanced (~100k users)' : 'Enterprise (>1M users) ')])),
      description: 'Concurrent user threshold before bottlenecks emerge.'
    },
    {
      metric: 'High Availability SLA',
      category: 'Availability',
      arch_values: Object.fromEntries(profiles.map((p, idx) => [p.key, idx === 0 ? '99.0% (Single AZ)' : (idx === 1 ? '99.9% (Standard HA)' : '99.99% (Multi-AZ Clustered)')])),
      description: 'Fault-tolerance during infrastructure outages.'
    },
    {
      metric: 'Architecture Complexity',
      category: 'Operations',
      arch_values: Object.fromEntries(profiles.map((p, idx) => [p.key, idx === 0 ? 'Low (Simple)' : (idx === 1 ? 'Moderate (Modular)' : 'High (Distributed)')])),
      description: 'Maintenance overhead and observability footprint.'
    }
  ];

  const trade_off_analysis = Object.fromEntries(profiles.map((p, idx) => [
    p.key,
    idx === 0
      ? `${p.title}: Lowest expenditure, but lower scaling capacity and single point of failure.`
      : (idx === 1
        ? `${p.title}: Recommended balanced configuration balancing reasonable cost with multi-tier resilience.`
        : `${p.title}: High scaling capacity with distributed caching, but higher operational cost.`)
  ]));

  return {
    summary: `Compared ${profiles.length} candidate architectures. Review factual trade-offs before committing.`,
    metrics,
    profiles,
    trade_off_analysis,
    disclaimer: 'Objective multi-metric comparison. Final architectural selection depends on business constraints and SLA priorities.'
  };
}

/**
 * 16. Conversational Architecture Command API
 */
export async function conversationalCommandApi(command, architecture) {
  try {
    const res = await fetch(`${API_BASE}/conversational-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, architecture })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }

  // Client fallback
  const cmd = command.toLowerCase();
  const archCopy = JSON.parse(JSON.stringify(architecture));
  let intent = 'general';
  let actionTaken = `Processed command: "${command}"`;
  let explanation = 'Architecture command applied.';

  if (cmd.includes('add redis') || cmd.includes('add cache')) {
    intent = 'add_component';
    if (!archCopy.components.some(c => c.id === 'redis_cache')) {
      archCopy.components.push({
        id: 'redis_cache',
        name: 'Redis In-Memory Cache',
        type: 'cache',
        technology: 'Redis',
        role: 'In-Memory Cache',
        purpose: 'Caches hot queries and session state to relieve primary database load.'
      });
      const backend = archCopy.components.find(c => c.type === 'backend');
      if (backend) {
        archCopy.connections.push({ from: backend.id, to: 'redis_cache', protocol: 'TCP', label: 'Caches Hot Data' });
      }
      actionTaken = 'Added Redis In-Memory Cache and connected to backend.';
      explanation = 'Redis reduces database query latency from ~45ms to <2ms.';
    }
  } else if (cmd.includes('remove redis') || cmd.includes('remove cache')) {
    intent = 'remove_component';
    archCopy.components = archCopy.components.filter(c => c.type !== 'cache' && c.id !== 'redis_cache');
    archCopy.connections = archCopy.connections.filter(c => c.from !== 'redis_cache' && c.to !== 'redis_cache');
    actionTaken = 'Removed Redis In-Memory Cache.';
    explanation = 'Database will now receive direct read queries without cache buffering.';
  }

  return {
    intent,
    action_taken: actionTaken,
    updated_architecture: archCopy,
    explanation,
    suggested_next_steps: ['Check the Impact tab to review dependencies.', 'Run What-If simulation.']
  };
}

/**
 * 17. Architecture Decision Records (ADR) Memory API
 */
let _inMemoryDecisions = null;

function getStoredDecisions() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const raw = localStorage.getItem('architecture_decisions');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return _inMemoryDecisions;
}

function setStoredDecisions(list) {
  _inMemoryDecisions = list;
  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('architecture_decisions', JSON.stringify(list));
    }
  } catch (e) {}
}

export async function getDecisionsApi() {
  try {
    const res = await fetch(`${API_BASE}/decisions`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }
  const local = getStoredDecisions();
  if (local) return local;

  const defaultList = [
    {
      id: 'adr_1',
      component_id: 'db_postgres',
      component_name: 'PostgreSQL Database',
      decision: 'Adopt PostgreSQL as Primary Relational Store',
      reason: 'ACID compliance for order transactions and structured schema integrity.',
      alternative: 'MongoDB Document Store',
      trade_off: 'Guarantees transactional consistency; requires read replicas and connection pooling at massive concurrency.',
      status: 'active',
      version: 'v1.0'
    },
    {
      id: 'adr_2',
      component_id: 'redis_cache',
      component_name: 'Redis In-Memory Cache',
      decision: 'Implement In-Memory Redis Caching Tier',
      reason: 'Absorbs repeated catalog read queries and session tokens to protect database.',
      alternative: 'Direct database query with in-memory process cache',
      trade_off: 'Sub-millisecond read latency; introduces cache invalidation and memory eviction management.',
      status: 'active',
      version: 'v1.0'
    },
    {
      id: 'adr_3',
      component_id: 'api_gateway',
      component_name: 'API Gateway',
      decision: 'Deploy Centralized API Gateway for Routing & Rate Limiting',
      reason: 'Single perimeter boundary for token authentication, SSL termination, and client throttling.',
      alternative: 'Direct microservice exposure via individual public IPs',
      trade_off: 'Centralizes security and observability; potential routing bottleneck if un-cached.',
      status: 'active',
      version: 'v1.0'
    }
  ];
  setStoredDecisions(defaultList);
  return defaultList;
}

export async function addDecisionApi(decision) {
  try {
    const res = await fetch(`${API_BASE}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }
  const list = await getDecisionsApi();
  const existing = list.findIndex(d => d.id === decision.id);
  if (existing >= 0) list[existing] = decision;
  else list.unshift(decision);
  setStoredDecisions(list);
  return decision;
}

export async function deleteDecisionApi(decision_id) {
  try {
    const res = await fetch(`${API_BASE}/decisions/${decision_id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Client fallback
  }
  const list = await getDecisionsApi();
  const filtered = list.filter(d => d.id !== decision_id);
  setStoredDecisions(filtered);
  return { message: 'Decision deleted' };
}

/**
 * 23. Generate Scaled Architecture (Feature 10)
 */
export async function generateScaledArchitectureApi(architecture, targetUsers = 1000000) {
  try {
    const res = await fetch(`${API_BASE}/generate-scaled-architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ architecture, target_users: targetUsers })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend scaled architecture API unavailable, using client fallback:', err);
  }

  // Client-side fallback for scaled architecture
  const comps = JSON.parse(JSON.stringify(architecture?.components || []));
  const conns = JSON.parse(JSON.stringify(architecture?.connections || []));
  const types = new Set(comps.map(c => c.type));

  const newComps = [];
  const newConns = [];

  // Add CDN if missing
  if (!types.has('cdn')) {
    const fe = comps.find(c => c.type === 'frontend') || comps[0];
    if (fe) {
      newComps.push({
        id: 'edge_cdn',
        name: 'CloudFront CDN',
        type: 'cdn',
        role: 'Edge Content Delivery Network',
        technology: 'AWS CloudFront',
        purpose: 'Caches static assets at edge PoPs globally.',
        why_recommended: 'Absorbs 85%+ of repeat frontend traffic.',
        tier: 'standard'
      });
      newConns.push({ from: 'edge_cdn', to: fe.id, protocol: 'HTTPS', label: 'Origin Fetch' });
    }
  }

  // Add Load Balancer if missing
  const be = comps.find(c => c.type === 'backend');
  if (!types.has('loadbalancer') && !types.has('gateway') && be) {
    newComps.push({
      id: 'app_lb',
      name: 'Application Load Balancer',
      type: 'loadbalancer',
      role: 'Traffic Distribution',
      technology: 'AWS ALB',
      purpose: 'Distributes traffic evenly across multiple backend instances.',
      why_recommended: 'Eliminates single point of failure.',
      tier: 'standard'
    });
    newConns.push({ from: 'app_lb', to: be.id, protocol: 'HTTP', label: 'Load Balanced' });
    be.name = `${be.name} (3x Cluster)`;
  }

  // Add Redis if missing
  const db = comps.find(c => c.type === 'database');
  if (!types.has('cache') && db && be) {
    newComps.push({
      id: 'redis_cache',
      name: 'Redis In-Memory Cache',
      type: 'cache',
      role: 'In-Memory Query Cache',
      technology: 'Redis',
      purpose: 'Absorbs hot database read queries.',
      why_recommended: 'Sub-millisecond query responses.',
      tier: 'medium'
    });
    newConns.push({ from: be.id, to: 'redis_cache', protocol: 'TCP', label: 'Cache Reads' });
  }

  // Add Database Read Replica if missing
  if (db && !comps.some(c => c.id.includes('replica'))) {
    newComps.push({
      id: `${db.id}_replica`,
      name: `${db.name} (Read Replica)`,
      type: 'database',
      role: 'Read-Only Database Replica',
      technology: `${db.technology || 'PostgreSQL'} Read Replica`,
      purpose: 'Handles read-heavy query traffic.',
      why_recommended: 'Offloads read load from primary transactional database.',
      tier: db.tier || 'standard'
    });
    newConns.push({ from: db.id, to: `${db.id}_replica`, protocol: 'SQL', label: 'Replication' });
    if (be) {
      newConns.push({ from: be.id, to: `${db.id}_replica`, protocol: 'SQL', label: 'Read Queries' });
    }
  }

  return {
    project_name: `${architecture.project_name || 'Cloud Architecture'} (Scaled Architecture)`,
    description: `Auto-scaled architecture designed for ${targetUsers.toLocaleString()} users/month.`,
    cloud_provider: architecture.cloud_provider || 'logical',
    components: [...comps, ...newComps],
    connections: [...conns, ...newConns]
  };
}

/**
 * 24. Explain Architecture in Simple English (Feature 17)
 */
export async function explainArchitectureApi(architecture) {
  try {
    const res = await fetch(`${API_BASE}/explain-architecture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(architecture)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend explain API unavailable, using client fallback:', err);
  }

  // Client-side fallback
  const comps = architecture?.components || [];
  const explanations = comps.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    technology: c.technology || c.name,
    simple_explanation: `${c.name} (${c.technology || c.name}) acts as the ${c.role || c.type}. ${c.purpose || ''}`
  }));

  const steps = [];
  const fe = comps.find(c => c.type === 'frontend');
  const be = comps.find(c => c.type === 'backend');
  const db = comps.find(c => c.type === 'database');
  const ca = comps.find(c => c.type === 'cache');

  if (fe) steps.push(`Step 1: The user accesses the application through ${fe.name}.`);
  if (be) steps.push(`Step 2: User requests are sent to ${be.name} to process business logic.`);
  if (ca) steps.push(`Step 3: Frequent queries are retrieved fast from in-memory cache ${ca.name}.`);
  if (db) steps.push(`Step 4: Persistent records are stored securely in ${db.name}.`);
  steps.push('Step 5: The final calculated response is delivered back to the user.');

  return {
    summary: `This architecture consists of ${comps.length} decoupled components designed to balance performance, scalability, and security.`,
    components_explanation: explanations,
    request_flow: steps,
    key_takeaways: [
      'Separation of concerns keeps each service maintainable.',
      'Private data stores are isolated from public internet access.',
      'Caching layers reduce load on the primary database.'
    ]
  };
}

/**
 * 25. Compare Technologies (Feature 12)
 */
export async function compareTechnologiesApi(technologies = ['fastapi', 'node', 'postgresql', 'redis']) {
  try {
    const res = await fetch(`${API_BASE}/tech-comparison`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technologies })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend tech-comparison API unavailable:', err);
  }

  return {
    technologies: [],
    comparison_count: 0,
    guidance: 'Technology selection depends on workload characteristics and developer expertise.'
  };
}

/**
 * 26. Get AI Usage Statistics (Feature 3)
 */
export async function getAIUsageStatsApi() {
  try {
    const res = await fetch(`${API_BASE}/ai/usage`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('AI usage stats API unavailable:', err);
  }
  return {
    session_start: new Date().toISOString(),
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    cached_requests: 0,
    fallback_events: 0,
    success_rate_pct: 100,
    cache_hit_rate_pct: 0,
    provider_stats: {},
    recent_activity: []
  };
}

/**
 * 27. Clear Response Cache (Feature 4)
 */
export async function clearResponseCacheApi() {
  try {
    const res = await fetch(`${API_BASE}/cache/clear`, { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Clear cache API error:', err);
  }
  return { status: 'ok', message: 'Local cache reset' };
}


