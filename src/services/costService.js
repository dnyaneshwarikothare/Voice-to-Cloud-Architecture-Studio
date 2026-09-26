/**
 * Cost Estimation Engine for AWS and GCP
 * Uses transparent parameter assumptions and modular service pricing calculation.
 */

import { PRICING_RATES } from '../data/mockPricing.js';
import { getCloudServiceForComponent } from '../utils/cloudMappings.js';
import { COMPONENT_TYPES } from '../utils/architectureSchema.js';

/**
 * Calculates monthly AWS cost for a specific component based on active assumptions
 */
export function getAwsCost(component, assumptions) {
  const rates = PRICING_RATES.aws;
  const cloudInfo = getCloudServiceForComponent(component, 'aws');
  const type = component.type || 'custom';
  let monthlyCost = 0;
  let calculationDetails = '';

  const {
    monthlyRequests = 1000000,
    computeTier = 'medium',
    computeInstances = 2,
    databaseStorageGb = 50,
    databaseTier = 'medium',
    databaseMultiAz = false,
    cacheMemoryGb = 2,
    trafficOutGb = 100,
    storageGb = 25,
    monthlyUsers = 50000
  } = assumptions;

  switch (type) {
    case COMPONENT_TYPES.FRONTEND: {
      // S3 static hosting + CloudFront CDN
      const s3StorageCost = storageGb * rates.storage.perGb;
      const cdnTrafficGb = Math.max(0, trafficOutGb - rates.cdn.freeTierGb);
      const cdnCost = cdnTrafficGb * rates.cdn.perGb;
      monthlyCost = s3StorageCost + cdnCost + 1.50; // DNS & request baseline
      calculationDetails = `S3 (${storageGb}GB: $${s3StorageCost.toFixed(2)}) + CloudFront free tier (<1TB)`;
      break;
    }

    case COMPONENT_TYPES.BACKEND: {
      if (component.tier === 'serverless') {
        const millions = monthlyRequests / 1000000;
        monthlyCost = millions * rates.compute.serverless.perMillionRequests;
        calculationDetails = `AWS Lambda (${millions}M invocations @ $0.20/M)`;
      } else {
        const tierRate = rates.compute[computeTier] || rates.compute.medium;
        monthlyCost = tierRate.monthly * computeInstances;
        calculationDetails = `${computeInstances}x ${tierRate.label} @ $${tierRate.monthly.toFixed(2)}/mo`;
      }
      break;
    }

    case COMPONENT_TYPES.DATABASE: {
      const dbTierRate = rates.database[databaseTier] || rates.database.medium;
      let base = dbTierRate.monthlyBase;
      if (databaseMultiAz) {
        base *= rates.database.multiAzMultiplier;
      }
      const storageCost = databaseStorageGb * rates.database.storagePerGb;
      monthlyCost = base + storageCost;
      calculationDetails = `${dbTierRate.label} ($${base.toFixed(2)}${databaseMultiAz ? ' Multi-AZ' : ''}) + ${databaseStorageGb}GB gp3 ($${storageCost.toFixed(2)})`;
      break;
    }

    case COMPONENT_TYPES.CACHE: {
      const cacheTier = rates.cache[cacheMemoryGb] || rates.cache[2];
      monthlyCost = cacheTier.monthly;
      calculationDetails = `ElastiCache Redis ${cacheTier.label}`;
      break;
    }

    case COMPONENT_TYPES.LOADBALANCER: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = rates.loadbalancer.baseMonthly + (millions * rates.loadbalancer.perMillionLcu);
      calculationDetails = `ALB base ($${rates.loadbalancer.baseMonthly}) + LCU for ${millions}M requests`;
      break;
    }

    case COMPONENT_TYPES.GATEWAY: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = millions * rates.gateway.perMillion;
      calculationDetails = `API Gateway HTTP API (${millions}M reqs @ $1.00/M)`;
      break;
    }

    case COMPONENT_TYPES.CDN: {
      const billableTraffic = Math.max(0, trafficOutGb - rates.cdn.freeTierGb);
      monthlyCost = billableTraffic * rates.cdn.perGb;
      calculationDetails = `CloudFront (${trafficOutGb}GB transfer, 1TB free tier)`;
      break;
    }

    case COMPONENT_TYPES.QUEUE: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = Math.max(0, (millions - 1) * rates.queue.perMillion);
      calculationDetails = `Amazon SQS (First 1M requests/mo free, then $0.40/M)`;
      break;
    }

    case COMPONENT_TYPES.STORAGE: {
      monthlyCost = storageGb * rates.storage.perGb;
      calculationDetails = `S3 Standard Storage (${storageGb}GB @ $0.023/GB)`;
      break;
    }

    case COMPONENT_TYPES.AUTH: {
      const billableUsers = Math.max(0, monthlyUsers - rates.auth.freeTierMau);
      monthlyCost = (billableUsers / 1000) * rates.auth.perThousandMau;
      calculationDetails = `Cognito User Pool (${monthlyUsers.toLocaleString()} MAU, first 50k free)`;
      break;
    }

    case COMPONENT_TYPES.MONITORING: {
      monthlyCost = rates.monitoring.baseMonthly;
      calculationDetails = `CloudWatch Metrics, Dashboards & Log Ingestion`;
      break;
    }

    default: {
      // Custom / generic component
      const tierRate = rates.compute[computeTier] || rates.compute.small;
      monthlyCost = tierRate.monthly;
      calculationDetails = `Custom Workload on EC2 (${tierRate.label})`;
    }
  }

  return {
    provider: 'aws',
    componentId: component.id,
    componentName: component.name,
    cloudService: cloudInfo ? cloudInfo.service : 'AWS Custom Workload',
    category: cloudInfo ? cloudInfo.category : 'Compute',
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    details: calculationDetails
  };
}

/**
 * Calculates monthly GCP cost for a specific component based on active assumptions
 */
export function getGcpCost(component, assumptions) {
  const rates = PRICING_RATES.gcp;
  const cloudInfo = getCloudServiceForComponent(component, 'gcp');
  const type = component.type || 'custom';
  let monthlyCost = 0;
  let calculationDetails = '';

  const {
    monthlyRequests = 1000000,
    computeTier = 'medium',
    computeInstances = 2,
    databaseStorageGb = 50,
    databaseTier = 'medium',
    databaseMultiAz = false,
    cacheMemoryGb = 2,
    trafficOutGb = 100,
    storageGb = 25,
    monthlyUsers = 50000
  } = assumptions;

  switch (type) {
    case COMPONENT_TYPES.FRONTEND: {
      // Cloud Storage + Cloud CDN
      const gcsCost = storageGb * rates.storage.perGb;
      const cdnTrafficGb = Math.max(0, trafficOutGb - rates.cdn.freeTierGb);
      const cdnCost = cdnTrafficGb * rates.cdn.perGb;
      monthlyCost = gcsCost + cdnCost + 1.20;
      calculationDetails = `Cloud Storage (${storageGb}GB: $${gcsCost.toFixed(2)}) + Cloud CDN`;
      break;
    }

    case COMPONENT_TYPES.BACKEND: {
      if (component.tier === 'serverless') {
        const millions = monthlyRequests / 1000000;
        monthlyCost = millions * rates.compute.serverless.perMillionRequests;
        calculationDetails = `Cloud Run Serverless (${millions}M invocations)`;
      } else {
        const tierRate = rates.compute[computeTier] || rates.compute.medium;
        monthlyCost = tierRate.monthly * computeInstances;
        calculationDetails = `${computeInstances}x Compute Engine ${tierRate.label} @ $${tierRate.monthly.toFixed(2)}/mo`;
      }
      break;
    }

    case COMPONENT_TYPES.DATABASE: {
      const dbTierRate = rates.database[databaseTier] || rates.database.medium;
      let base = dbTierRate.monthlyBase;
      if (databaseMultiAz) {
        base *= rates.database.multiAzMultiplier;
      }
      const storageCost = databaseStorageGb * rates.database.storagePerGb;
      monthlyCost = base + storageCost;
      calculationDetails = `Cloud SQL ${dbTierRate.label} ($${base.toFixed(2)}${databaseMultiAz ? ' HA' : ''}) + ${databaseStorageGb}GB SSD ($${storageCost.toFixed(2)})`;
      break;
    }

    case COMPONENT_TYPES.CACHE: {
      const cacheTier = rates.cache[cacheMemoryGb] || rates.cache[2];
      monthlyCost = cacheTier.monthly;
      calculationDetails = `Memorystore Redis ${cacheTier.label}`;
      break;
    }

    case COMPONENT_TYPES.LOADBALANCER: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = rates.loadbalancer.baseMonthly + (millions * rates.loadbalancer.perMillionLcu);
      calculationDetails = `Cloud Load Balancing base ($${rates.loadbalancer.baseMonthly}) + ingress forwarding`;
      break;
    }

    case COMPONENT_TYPES.GATEWAY: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = millions * rates.gateway.perMillion;
      calculationDetails = `GCP API Gateway (${millions}M requests)`;
      break;
    }

    case COMPONENT_TYPES.CDN: {
      const billableTraffic = Math.max(0, trafficOutGb - rates.cdn.freeTierGb);
      monthlyCost = billableTraffic * rates.cdn.perGb;
      calculationDetails = `Cloud CDN (${trafficOutGb}GB outbound cache)`;
      break;
    }

    case COMPONENT_TYPES.QUEUE: {
      const millions = monthlyRequests / 1000000;
      monthlyCost = Math.max(0, (millions - 1) * rates.queue.perMillion);
      calculationDetails = `Cloud Pub/Sub (10GB free / mo, $0.40/M events)`;
      break;
    }

    case COMPONENT_TYPES.STORAGE: {
      monthlyCost = storageGb * rates.storage.perGb;
      calculationDetails = `Google Cloud Storage Standard (${storageGb}GB @ $0.020/GB)`;
      break;
    }

    case COMPONENT_TYPES.AUTH: {
      const billableUsers = Math.max(0, monthlyUsers - rates.auth.freeTierMau);
      monthlyCost = (billableUsers / 1000) * rates.auth.perThousandMau;
      calculationDetails = `Firebase Auth / Identity Platform (First 50k MAU free)`;
      break;
    }

    case COMPONENT_TYPES.MONITORING: {
      monthlyCost = rates.monitoring.baseMonthly;
      calculationDetails = `Cloud Monitoring & Logging metrics suite`;
      break;
    }

    default: {
      const tierRate = rates.compute[computeTier] || rates.compute.small;
      monthlyCost = tierRate.monthly;
      calculationDetails = `Custom Workload on Compute Engine (${tierRate.label})`;
    }
  }

  return {
    provider: 'gcp',
    componentId: component.id,
    componentName: component.name,
    cloudService: cloudInfo ? cloudInfo.service : 'GCP Custom Workload',
    category: cloudInfo ? cloudInfo.category : 'Compute',
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    details: calculationDetails
  };
}

/**
 * Computes complete architecture monthly breakdown for AWS, GCP, or both
 */
export function calculateArchitectureCosts(architecture, assumptions) {
  if (!architecture || !Array.isArray(architecture.components) || architecture.components.length === 0) {
    return {
      aws: { totalMonthly: 0, items: [] },
      gcp: { totalMonthly: 0, items: [] },
      assumptions,
      cheaperProvider: null,
      savingsDelta: 0
    };
  }

  const awsItems = architecture.components.map(comp => getAwsCost(comp, assumptions));
  const gcpItems = architecture.components.map(comp => getGcpCost(comp, assumptions));

  const awsTotal = Math.round(awsItems.reduce((acc, curr) => acc + curr.monthlyCost, 0) * 100) / 100;
  const gcpTotal = Math.round(gcpItems.reduce((acc, curr) => acc + curr.monthlyCost, 0) * 100) / 100;

  const cheaperProvider = awsTotal < gcpTotal ? 'AWS' : gcpTotal < awsTotal ? 'GCP' : 'Tie';
  const savingsDelta = Math.round(Math.abs(awsTotal - gcpTotal) * 100) / 100;

  return {
    aws: {
      providerName: 'AWS (Amazon Web Services)',
      totalMonthly: awsTotal,
      items: awsItems
    },
    gcp: {
      providerName: 'GCP (Google Cloud Platform)',
      totalMonthly: gcpTotal,
      items: gcpItems
    },
    assumptions,
    cheaperProvider,
    savingsDelta
  };
}
