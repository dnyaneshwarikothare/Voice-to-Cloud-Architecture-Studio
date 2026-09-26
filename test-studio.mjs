import { parseArchitectureFromText } from './src/services/parserService.js';
import { generateMermaidCode } from './src/services/mermaidService.js';
import { analyzeArchitectureHealth } from './src/services/healthService.js';
import { calculateArchitectureCosts, getAwsCost, getGcpCost } from './src/services/costService.js';
import { getArchitectureOptimizations } from './src/services/optimizationService.js';
import { PRICING_ASSUMPTIONS_DEFAULT } from './src/data/mockPricing.js';
import { PRESET_ARCHITECTURES } from './src/data/presetArchitectures.js';

console.log('🧪 Starting Voice-to-Cloud Architecture Studio Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Test Natural Language Parser
console.log('--- 1. Testing Natural Language Parser ---');
const sampleInput = 'React frontend connected to FastAPI backend. The backend uses Redis for caching and PostgreSQL for the database.';
const parsed = parseArchitectureFromText(sampleInput);

assert(parsed.components.length === 4, `Extracted 4 components (got ${parsed.components.length})`);
assert(parsed.components.some(c => c.name === 'React' && c.type === 'frontend'), 'Identified React Frontend');
assert(parsed.components.some(c => c.name === 'FastAPI' && c.type === 'backend'), 'Identified FastAPI Backend');
assert(parsed.components.some(c => c.name === 'Redis' && c.type === 'cache'), 'Identified Redis Cache');
assert(parsed.components.some(c => c.name === 'PostgreSQL' && c.type === 'database'), 'Identified PostgreSQL Database');
assert(parsed.connections.length >= 3, `Inferred ${parsed.connections.length} connections`);

// Test Custom Component Parsing
const customInput = 'Mobile app connected to Stripe Payment Service and Fraud Detection Engine';
const parsedCustom = parseArchitectureFromText(customInput);
assert(parsedCustom.components.length >= 2, 'Identified custom components without crashing');

// Test Generic Non-Technical Prompt (Bug Fix verification)
const genericShopping = 'I want to build a shopping website';
const parsedShopping = parseArchitectureFromText(genericShopping);
assert(parsedShopping.components.length >= 6, `Generic shopping prompt generated ${parsedShopping.components.length} components (not single Custom box)`);
assert(parsedShopping.components.some(c => c.name.includes('Storefront') || c.name.includes('Product')), 'Identified E-commerce storefront/product services');


// 2. Test Mermaid Code Generation
console.log('\n--- 2. Testing Mermaid Generator ---');
const mermaidLogical = generateMermaidCode(parsed, { direction: 'LR', mode: 'logical' });
assert(mermaidLogical.includes('flowchart LR'), 'Generated flowchart LR header');
assert(mermaidLogical.includes('React'), 'Contains React node');
assert(mermaidLogical.includes('PostgreSQL'), 'Contains PostgreSQL database node');

const mermaidAws = generateMermaidCode(parsed, { direction: 'LR', mode: 'aws' });
assert(mermaidAws.includes('CloudFront') || mermaidAws.includes('S3'), 'AWS mode maps frontend to CloudFront/S3');
assert(mermaidAws.includes('RDS'), 'AWS mode maps PostgreSQL to Amazon RDS');

const mermaidGcp = generateMermaidCode(parsed, { direction: 'LR', mode: 'gcp' });
assert(mermaidGcp.includes('Cloud Run'), 'GCP mode maps FastAPI to Cloud Run');
assert(mermaidGcp.includes('Cloud SQL'), 'GCP mode maps PostgreSQL to Cloud SQL');

// 3. Test Architecture Health Checker
console.log('\n--- 3. Testing Architecture Health Checker ---');
const health = analyzeArchitectureHealth(parsed);
assert(typeof health.overallScore === 'number' && health.overallScore > 0, `Computed overall score: ${health.overallScore}`);
assert(health.pillars.security.score > 0, 'Security pillar scored');
assert(health.pillars.availability.findings.length > 0, 'Identified single backend instance availability consideration');
assert(health.pillars.performance.findings.length > 0, 'Identified missing frontend CDN');

// 4. Test Cost Estimation Engine
console.log('\n--- 4. Testing Cost Estimation Engine ---');
const costs = calculateArchitectureCosts(parsed, PRICING_ASSUMPTIONS_DEFAULT);
assert(costs.aws.totalMonthly > 0, `AWS monthly cost calculated: $${costs.aws.totalMonthly}`);
assert(costs.gcp.totalMonthly > 0, `GCP monthly cost calculated: $${costs.gcp.totalMonthly}`);
assert(['AWS', 'GCP', 'Tie'].includes(costs.cheaperProvider), `Identified cheaper provider: ${costs.cheaperProvider}`);
assert(costs.aws.items.length === 4, '4 AWS line-item breakdowns generated');

// 5. Test Architecture Optimizer & Before/After
console.log('\n--- 5. Testing Architecture Optimizer ---');
const opts = getArchitectureOptimizations(parsed);
assert(opts.length > 0, `Generated ${opts.length} architectural optimization suggestions`);

const cdnOpt = opts.find(o => o.id === 'opt_add_cdn');
assert(Boolean(cdnOpt), 'Found "Add CDN" optimization');

if (cdnOpt) {
  const optimizedArch = cdnOpt.apply(parsed);
  assert(optimizedArch.components.length === parsed.components.length + 1, 'Applied optimization added CDN component');
  const optimizedHealth = analyzeArchitectureHealth(optimizedArch);
  assert(optimizedHealth.overallScore >= health.overallScore, 'Optimized architecture improved health score');
}

// 6. Test Demo Presets
console.log('\n--- 6. Testing Demo Presets ---');
assert(PRESET_ARCHITECTURES.length === 9, '9 Preset architectures configured (all domains)');
PRESET_ARCHITECTURES.forEach(p => {
  const pHealth = analyzeArchitectureHealth(p);
  const pCost = calculateArchitectureCosts(p, PRICING_ASSUMPTIONS_DEFAULT);
  assert(pHealth.overallScore > 0 && pCost.aws.totalMonthly > 0, `Preset '${p.name}' is valid (Health: ${pHealth.overallScore}, AWS: $${pCost.aws.totalMonthly}/mo)`);
});

// 7. Test What-If Scenario Simulator
console.log('\n--- 7. Testing What-If Scenario Simulator ---');
import {
  runWhatIfApi,
  analyzeImpactApi,
  simulateGrowthApi,
  compareArchitecturesApi,
  conversationalCommandApi,
  getDecisionsApi,
  addDecisionApi
} from './src/services/apiService.js';

const whatIfRes = await runWhatIfApi(parsed, '10x Traffic Surge', 'traffic_increase', { multiplier: 10 });
assert(whatIfRes.simulated_summary.users === 100000, 'What-If: Scaled users to 100,000 under 10x multiplier');
assert(whatIfRes.traffic_impact.projected_rps === 1000, 'What-If: Scaled projected RPS to 1,000');
assert(whatIfRes.recommendations.length > 0, 'What-If: Generated actionable scaling recommendations');
assert(whatIfRes.disclaimer.includes('Scenario-based'), 'What-If: Explicitly labeled as scenario-based simulation');

// 8. Test Impact Analyzer
console.log('\n--- 8. Testing Change Impact Analyzer ---');
const impactRes = await analyzeImpactApi(parsed, 'remove', 'redis');
assert(impactRes.overall_impact_level === 'HIGH IMPACT', 'Impact Analyzer: Removing Redis marked as HIGH IMPACT');
assert(impactRes.affected_components.some(a => /database|postgres|sql/i.test(a.affected_component_name) || /db|postgres|sql/i.test(a.affected_component_id)), 'Impact Analyzer: Database identified as affected when Redis removed');
assert(impactRes.dependency_graph.length === parsed.components.length, 'Impact Analyzer: Graph built for all nodes');

// 9. Test Growth Simulator
console.log('\n--- 9. Testing Growth Simulator ---');
const growthRes = await simulateGrowthApi(parsed, 10000, 15, 12);
assert(growthRes.timeline.length >= 4, `Growth Simulator: Generated ${growthRes.timeline.length} period milestones`);
assert(growthRes.timeline[growthRes.timeline.length - 1].projected_users > 10000, 'Growth Simulator: Month 12 users higher than starting users');

// 10. Test Multi-Architecture Comparison
console.log('\n--- 10. Testing Multi-Architecture Comparison ---');
const compareRes = await compareArchitecturesApi([parsed, PRESET_ARCHITECTURES[1]]);
assert(compareRes.profiles.length === 2, 'Compare: 2 architecture profiles evaluated');
assert(compareRes.metrics.length >= 4, 'Compare: Multi-metric rows generated');
assert(!compareRes.summary.includes('Winner:'), 'Compare: Does not declare an artificial winner');

// 11. Test Conversational Commands
console.log('\n--- 11. Testing Conversational Architecture Commands ---');
const addRes = await conversationalCommandApi('Add Redis', { components: [{ id: 'backend', name: 'FastAPI Backend', type: 'backend' }], connections: [] });
assert(addRes.intent === 'add_component', 'Conversational: Parsed Add Redis command');
assert(addRes.updated_architecture.components.some(c => c.id === 'redis_cache'), 'Conversational: Redis added to architecture');

const removeRes = await conversationalCommandApi('Remove Redis', addRes.updated_architecture);
assert(removeRes.intent === 'remove_component', 'Conversational: Parsed Remove Redis command');
assert(!removeRes.updated_architecture.components.some(c => c.id === 'redis_cache'), 'Conversational: Redis removed from architecture');

// 12. Test Architecture Decision Memory (ADR)
console.log('\n--- 12. Testing Architecture Decision Records (ADRs) ---');
const decisions = await getDecisionsApi();
assert(decisions.length >= 3, `Decisions: Retrieved ${decisions.length} recorded architectural decisions`);
assert(decisions.some(d => d.component_id.includes('postgres')), 'Decisions: PostgreSQL ADR registered');

console.log(`\n========================================`);
console.log(`Results: ${passedTests} passed, ${failedTests} failed.`);
console.log(`========================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All core engine tests passed successfully!');
  process.exit(0);
}
