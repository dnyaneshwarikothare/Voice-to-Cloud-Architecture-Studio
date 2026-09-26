import React from 'react';
import { Compass, ArrowRight, CheckCircle2, Cpu, Globe, Server, Database, Zap, Layers } from 'lucide-react';

export function ArchitectureExplanationPanel({
  architecture,
  isBeginnerMode = false
}) {
  const components = architecture?.components || [];
  const types = new Set(components.map(c => c.type));

  // Build step-by-step narrative flow
  const steps = [];

  // Step 1: User access
  steps.push({
    title: '1. User Enters the Application',
    actor: 'User / Browser Client',
    description: isBeginnerMode
      ? 'A person opens the website or mobile app on their phone or computer.'
      : 'Client initiates an outbound HTTPS connection to request application assets and interface bundles.'
  });

  // Step 2: CDN
  if (types.has('cdn')) {
    steps.push({
      title: '2. Request Reaches the Edge CDN',
      actor: 'Content Delivery Network (CDN)',
      description: isBeginnerMode
        ? 'Instead of traveling halfway across the world to a far away server, the request is immediately answered by a nearby computer in the user’s local city.'
        : 'Global Points of Presence (PoPs) terminate SSL and deliver cached static frontend assets with sub-50ms latency.'
    });
  }

  // Step 3: Frontend
  if (types.has('frontend')) {
    steps.push({
      title: `${steps.length + 1}. Frontend Renders Interactive UI`,
      actor: 'Web / Mobile Client',
      description: isBeginnerMode
        ? 'The screen displays the buttons, menus, and products. When the user taps a button, it sends a message asking for data.'
        : 'Single Page Application (SPA) or SSR container executes clientside routing and prepares asynchronous REST / JSON API payloads.'
    });
  }

  // Step 4: Perimeter Gateway / Load Balancer
  if (types.has('gateway') || types.has('loadbalancer')) {
    const isGw = types.has('gateway');
    steps.push({
      title: `${steps.length + 1}. Traffic Reaches the Perimeter ${isGw ? 'API Gateway' : 'Load Balancer'}`,
      actor: isGw ? 'API Gateway' : 'Application Load Balancer',
      description: isBeginnerMode
        ? 'A traffic officer inspects the request to make sure it is safe and routes it to the right department.'
        : 'Perimeter gateway verifies JWT authorization tokens, enforces DDoS rate limiting, and forwards HTTP traffic to backend microservices.'
    });
  }

  // Step 5: Backend Service
  if (components.some(c => c.type === 'backend' || c.type === 'payment')) {
    steps.push({
      title: `${steps.length + 1}. Backend Computes Business Rules`,
      actor: 'Backend Microservices',
      description: isBeginnerMode
        ? 'The backend computers do the math, calculate order prices, check permissions, and run the main application logic.'
        : 'Containerized application services execute business domain logic, invoke payment gateways, and coordinate database queries.'
    });
  }

  // Step 6: Cache
  if (types.has('cache')) {
    steps.push({
      title: `${steps.length + 1}. In-Memory Redis Cache Checked`,
      actor: 'Redis Cache Store',
      description: isBeginnerMode
        ? 'The system checks a super-fast notepad (Redis). If the answer was saved there recently, it returns immediately without disturbing the database.'
        : 'Sub-millisecond in-memory cache lookup. If cache hit, query returns immediately; if cache miss, request waterfalls to PostgreSQL.'
    });
  }

  // Step 7: Database
  if (types.has('database')) {
    steps.push({
      title: `${steps.length + 1}. Relational Database Queried & Updated`,
      actor: 'PostgreSQL Relational DB',
      description: isBeginnerMode
        ? 'The official permanent filing cabinet saves the user’s order securely so nothing is ever lost, even if computers turn off.'
        : 'ACID-compliant transactional SQL write ensures atomicity and persistent ledger integrity across multi-AZ storage.'
    });
  }

  // Step 8: Return Response
  steps.push({
    title: `${steps.length + 1}. Response Returned to User`,
    actor: 'End-to-End Delivery',
    description: isBeginnerMode
      ? 'The user sees a green checkmark or updated screen instantly. The whole process took a fraction of a second!'
      : 'JSON response traverses back through gateway and client state updates reactively with low P99 round-trip latency.'
  });

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
            Explain My Architecture
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            End-to-end request lifecycle flow from user click to database write.
          </span>
        </div>
        <span className="opt-badge" style={{ background: isBeginnerMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: isBeginnerMode ? '#10b981' : '#38bdf8' }}>
          {isBeginnerMode ? 'Plain English (Beginner)' : 'Technical (Advanced)'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {steps.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                {s.title}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(30, 41, 59, 0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                {s.actor}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
