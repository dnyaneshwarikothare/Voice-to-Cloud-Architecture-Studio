/**
 * Baseline Mock / Demo Pricing Catalog for AWS & GCP
 * Used for transparent estimation when live cloud billing APIs are not connected.
 * Rates are modeled after standard US East / Central multi-tenant production regions.
 */

export const PRICING_ASSUMPTIONS_DEFAULT = {
  region: 'us-east-1', // or us-central1
  monthlyUsers: 50000,
  monthlyRequests: 1000000, // 1M requests
  computeTier: 'medium', // small, medium, large, serverless
  computeInstances: 2,
  databaseStorageGb: 50,
  databaseTier: 'medium', // small, medium, large
  databaseMultiAz: false,
  cacheMemoryGb: 2, // 1, 2, 4, 8
  trafficOutGb: 100, // Outbound data transfer
  storageGb: 25 // S3 / GCS
};

export const PRICING_RATES = {
  aws: {
    providerName: 'Amazon Web Services (AWS)',
    compute: {
      small: { hourly: 0.0416, monthly: 30.37, label: 't4g.small (2 vCPU, 2GB)' },
      medium: { hourly: 0.0832, monthly: 60.74, label: 't4g.medium (2 vCPU, 4GB)' },
      large: { hourly: 0.1664, monthly: 121.47, label: 't4g.large (2 vCPU, 8GB)' },
      serverless: { perMillionRequests: 0.20, label: 'AWS Lambda (1M inv + 1GB-sec)' }
    },
    database: {
      small: { monthlyBase: 25.50, label: 'db.t4g.micro' },
      medium: { monthlyBase: 58.40, label: 'db.t4g.medium' },
      large: { monthlyBase: 135.00, label: 'db.r6g.large' },
      storagePerGb: 0.115, // gp3
      multiAzMultiplier: 1.85
    },
    cache: {
      1: { monthly: 13.50, label: 'cache.t4g.micro (0.5GB)' },
      2: { monthly: 27.20, label: 'cache.t4g.small (1.3GB)' },
      4: { monthly: 54.40, label: 'cache.t4g.medium (3.1GB)' },
      8: { monthly: 108.80, label: 'cache.m6g.large (6.3GB)' }
    },
    loadbalancer: {
      baseMonthly: 16.20,
      perMillionLcu: 5.84
    },
    cdn: {
      perGb: 0.085,
      freeTierGb: 1000
    },
    storage: {
      perGb: 0.023
    },
    queue: {
      perMillion: 0.40
    },
    gateway: {
      perMillion: 1.00
    },
    auth: {
      perThousandMau: 5.50,
      freeTierMau: 50000
    },
    monitoring: {
      baseMonthly: 12.00
    }
  },
  gcp: {
    providerName: 'Google Cloud Platform (GCP)',
    compute: {
      small: { hourly: 0.0385, monthly: 28.10, label: 'e2-small (2 vCPU, 2GB)' },
      medium: { hourly: 0.0770, monthly: 56.21, label: 'e2-medium (2 vCPU, 4GB)' },
      large: { hourly: 0.1540, monthly: 112.42, label: 'e2-standard-2 (2 vCPU, 8GB)' },
      serverless: { perMillionRequests: 0.18, label: 'Cloud Run (1M reqs)' }
    },
    database: {
      small: { monthlyBase: 22.80, label: 'db-f1-micro' },
      medium: { monthlyBase: 52.60, label: 'db-custom-2-7680' },
      large: { monthlyBase: 124.00, label: 'db-custom-4-15360' },
      storagePerGb: 0.170, // SSD
      multiAzMultiplier: 1.90 // HA configuration
    },
    cache: {
      1: { monthly: 12.80, label: 'Memorystore Basic 1GB' },
      2: { monthly: 24.50, label: 'Memorystore Basic 2GB' },
      4: { monthly: 49.00, label: 'Memorystore Basic 4GB' },
      8: { monthly: 98.00, label: 'Memorystore Standard 8GB' }
    },
    loadbalancer: {
      baseMonthly: 18.00,
      perMillionLcu: 4.50
    },
    cdn: {
      perGb: 0.080,
      freeTierGb: 100
    },
    storage: {
      perGb: 0.020
    },
    queue: {
      perMillion: 0.40
    },
    gateway: {
      perMillion: 1.00
    },
    auth: {
      perThousandMau: 5.50,
      freeTierMau: 50000
    },
    monitoring: {
      baseMonthly: 10.00
    }
  }
};

export const AVAILABLE_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia / us-central1)', awsId: 'us-east-1', gcpId: 'us-central1' },
  { id: 'us-west-2', name: 'US West (Oregon / us-west1)', awsId: 'us-west-2', gcpId: 'us-west1' },
  { id: 'eu-west-1', name: 'Europe (Ireland / europe-west1)', awsId: 'eu-west-1', gcpId: 'europe-west1' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore / asia-southeast1)', awsId: 'ap-southeast-1', gcpId: 'asia-southeast1' }
];
