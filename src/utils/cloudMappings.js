/**
 * Cloud Service Mappings: Logical components mapped to AWS and GCP equivalents
 */

export const CLOUD_MAPPINGS = {
  // Frontends
  react: {
    aws: { service: 'AWS CloudFront + S3', category: 'CDN & Storage', code: 'S3_CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN + Cloud Storage', category: 'CDN & Storage', code: 'GCS_CDN' }
  },
  nextjs: {
    aws: { service: 'AWS Amplify / ECS Fargate', category: 'SSR Hosting', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  vue: {
    aws: { service: 'AWS CloudFront + S3', category: 'CDN & Storage', code: 'S3_CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN + Cloud Storage', category: 'CDN & Storage', code: 'GCS_CDN' }
  },
  angular: {
    aws: { service: 'AWS CloudFront + S3', category: 'CDN & Storage', code: 'S3_CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN + Cloud Storage', category: 'CDN & Storage', code: 'GCS_CDN' }
  },
  svelte: {
    aws: { service: 'AWS CloudFront + S3', category: 'CDN & Storage', code: 'S3_CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN + Cloud Storage', category: 'CDN & Storage', code: 'GCS_CDN' }
  },

  // Backends
  fastapi: {
    aws: { service: 'AWS ECS Fargate / EC2', category: 'Container Compute', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  nodejs: {
    aws: { service: 'AWS ECS Fargate / App Runner', category: 'Container Compute', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run / App Engine', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  express: {
    aws: { service: 'AWS ECS Fargate', category: 'Container Compute', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  django: {
    aws: { service: 'AWS EC2 / ECS Fargate', category: 'Compute', code: 'EC2_INSTANCE' },
    gcp: { service: 'GCP Compute Engine / Cloud Run', category: 'Compute', code: 'COMPUTE_ENGINE' }
  },
  springboot: {
    aws: { service: 'AWS ECS Fargate / EKS', category: 'Microservice Container', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP GKE / Cloud Run', category: 'Kubernetes Engine', code: 'GKE' }
  },
  go: {
    aws: { service: 'AWS ECS Fargate / Lambda', category: 'Container / Serverless', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  lambda: {
    aws: { service: 'AWS Lambda', category: 'Serverless Function', code: 'LAMBDA' },
    gcp: { service: 'GCP Cloud Functions', category: 'Serverless Function', code: 'CLOUD_FUNCTIONS' }
  },

  // Databases
  postgresql: {
    aws: { service: 'Amazon RDS for PostgreSQL', category: 'Managed Relational DB', code: 'RDS_POSTGRES' },
    gcp: { service: 'GCP Cloud SQL for PostgreSQL', category: 'Managed Relational DB', code: 'CLOUDSQL_POSTGRES' }
  },
  mysql: {
    aws: { service: 'Amazon RDS for MySQL', category: 'Managed Relational DB', code: 'RDS_MYSQL' },
    gcp: { service: 'GCP Cloud SQL for MySQL', category: 'Managed Relational DB', code: 'CLOUDSQL_MYSQL' }
  },
  mongodb: {
    aws: { service: 'Amazon DocumentDB (MongoDB API)', category: 'Document Database', code: 'DOCUMENTDB' },
    gcp: { service: 'MongoDB Atlas on GCP / Firestore', category: 'Document Database', code: 'FIRESTORE' }
  },
  dynamodb: {
    aws: { service: 'Amazon DynamoDB', category: 'Serverless NoSQL', code: 'DYNAMODB' },
    gcp: { service: 'GCP Cloud Bigtable / Firestore', category: 'NoSQL Database', code: 'BIGTABLE' }
  },
  sqlite: {
    aws: { service: 'Amazon EBS / EFS Volume', category: 'Embedded Storage', code: 'EBS' },
    gcp: { service: 'GCP Persistent Disk', category: 'Embedded Storage', code: 'PERSISTENT_DISK' }
  },

  // Caches
  redis: {
    aws: { service: 'Amazon ElastiCache for Redis', category: 'In-Memory Cache', code: 'ELASTICACHE_REDIS' },
    gcp: { service: 'GCP Memorystore for Redis', category: 'In-Memory Cache', code: 'MEMORYSTORE_REDIS' }
  },
  memcached: {
    aws: { service: 'Amazon ElastiCache for Memcached', category: 'In-Memory Cache', code: 'ELASTICACHE_MEMCACHED' },
    gcp: { service: 'GCP Memorystore for Memcached', category: 'In-Memory Cache', code: 'MEMORYSTORE_MEMCACHED' }
  },

  // Queues & Brokers
  kafka: {
    aws: { service: 'Amazon Managed Streaming for Kafka (MSK)', category: 'Event Streaming', code: 'MSK' },
    gcp: { service: 'GCP Managed Service for Kafka / PubSub', category: 'Event Streaming', code: 'PUB_SUB' }
  },
  rabbitmq: {
    aws: { service: 'Amazon MQ (RabbitMQ)', category: 'Message Broker', code: 'AMAZON_MQ' },
    gcp: { service: 'GCP Cloud Pub/Sub', category: 'Event Ingestion', code: 'PUB_SUB' }
  },
  sqs: {
    aws: { service: 'Amazon SQS', category: 'Message Queue', code: 'SQS' },
    gcp: { service: 'GCP Cloud Tasks / Pub/Sub', category: 'Message Queue', code: 'PUB_SUB' }
  },

  // Infrastructure & Networking
  loadbalancer: {
    aws: { service: 'AWS Application Load Balancer (ALB)', category: 'Load Balancing', code: 'ALB' },
    gcp: { service: 'GCP Cloud Load Balancing', category: 'Load Balancing', code: 'GCP_LB' }
  },
  gateway: {
    aws: { service: 'Amazon API Gateway', category: 'API Management', code: 'API_GATEWAY' },
    gcp: { service: 'GCP Apigee / API Gateway', category: 'API Management', code: 'GCP_API_GATEWAY' }
  },
  cdn: {
    aws: { service: 'Amazon CloudFront', category: 'Edge CDN', code: 'CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN', category: 'Edge CDN', code: 'GCP_CDN' }
  },
  storage: {
    aws: { service: 'Amazon S3 Standard', category: 'Object Storage', code: 'S3' },
    gcp: { service: 'GCP Cloud Storage Standard', category: 'Object Storage', code: 'GCS' }
  },
  auth: {
    aws: { service: 'Amazon Cognito', category: 'Identity & Auth', code: 'COGNITO' },
    gcp: { service: 'GCP Firebase Auth / Identity Platform', category: 'Identity & Auth', code: 'GCP_IDENTITY' }
  },
  monitoring: {
    aws: { service: 'Amazon CloudWatch & X-Ray', category: 'Observability', code: 'CLOUDWATCH' },
    gcp: { service: 'GCP Cloud Monitoring & Logging', category: 'Observability', code: 'GCP_MONITORING' }
  }
};

/**
 * Default fallback mappings by component type
 */
export const DEFAULT_TYPE_MAPPINGS = {
  frontend: {
    aws: { service: 'AWS CloudFront + S3', category: 'CDN & Static Hosting', code: 'S3_CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN + Cloud Storage', category: 'CDN & Static Hosting', code: 'GCS_CDN' }
  },
  backend: {
    aws: { service: 'AWS ECS Fargate', category: 'Container Service', code: 'ECS_FARGATE' },
    gcp: { service: 'GCP Cloud Run', category: 'Serverless Container', code: 'CLOUD_RUN' }
  },
  database: {
    aws: { service: 'Amazon RDS Multi-AZ', category: 'Managed Database', code: 'RDS_POSTGRES' },
    gcp: { service: 'GCP Cloud SQL', category: 'Managed Database', code: 'CLOUDSQL_POSTGRES' }
  },
  cache: {
    aws: { service: 'Amazon ElastiCache', category: 'In-Memory Cache', code: 'ELASTICACHE_REDIS' },
    gcp: { service: 'GCP Memorystore', category: 'In-Memory Cache', code: 'MEMORYSTORE_REDIS' }
  },
  queue: {
    aws: { service: 'Amazon SQS / SNS', category: 'Messaging Service', code: 'SQS' },
    gcp: { service: 'GCP Cloud Pub/Sub', category: 'Messaging Service', code: 'PUB_SUB' }
  },
  gateway: {
    aws: { service: 'Amazon API Gateway', category: 'API Management', code: 'API_GATEWAY' },
    gcp: { service: 'GCP API Gateway', category: 'API Management', code: 'GCP_API_GATEWAY' }
  },
  loadbalancer: {
    aws: { service: 'AWS Application Load Balancer', category: 'Traffic Distribution', code: 'ALB' },
    gcp: { service: 'GCP Cloud Load Balancing', category: 'Traffic Distribution', code: 'GCP_LB' }
  },
  cdn: {
    aws: { service: 'Amazon CloudFront', category: 'Edge Distribution', code: 'CLOUDFRONT' },
    gcp: { service: 'GCP Cloud CDN', category: 'Edge Distribution', code: 'GCP_CDN' }
  },
  storage: {
    aws: { service: 'Amazon Simple Storage Service (S3)', category: 'Object Storage', code: 'S3' },
    gcp: { service: 'GCP Cloud Storage', category: 'Object Storage', code: 'GCS' }
  },
  auth: {
    aws: { service: 'Amazon Cognito', category: 'Identity & Access', code: 'COGNITO' },
    gcp: { service: 'GCP Identity Platform', category: 'Identity & Access', code: 'GCP_IDENTITY' }
  },
  monitoring: {
    aws: { service: 'Amazon CloudWatch', category: 'Telemetry & Logs', code: 'CLOUDWATCH' },
    gcp: { service: 'Google Cloud Monitoring', category: 'Telemetry & Logs', code: 'GCP_MONITORING' }
  },
  custom: {
    aws: { service: 'AWS Custom Workload (EC2/ECS)', category: 'Custom Compute', code: 'EC2_INSTANCE' },
    gcp: { service: 'GCP Custom Workload (Compute Engine)', category: 'Custom Compute', code: 'COMPUTE_ENGINE' }
  }
};

/**
 * Resolve cloud mapping for a component
 */
export function getCloudServiceForComponent(comp, provider = 'aws') {
  if (!comp) return null;
  const nameKey = (comp.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const typeKey = (comp.type || 'custom').toLowerCase();

  // 1. Direct tech name match
  for (const [key, mapping] of Object.entries(CLOUD_MAPPINGS)) {
    if (nameKey.includes(key)) {
      return mapping[provider] || mapping.aws;
    }
  }

  // 2. Type fallback
  const fallback = DEFAULT_TYPE_MAPPINGS[typeKey] || DEFAULT_TYPE_MAPPINGS.custom;
  return fallback[provider] || fallback.aws;
}
