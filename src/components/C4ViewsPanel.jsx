import React, { useState } from 'react';
import { Layers, Box, Cpu, FileCode, CheckCircle2, Clock, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { ArchitectureDiagram } from './ArchitectureDiagram';

export function C4ViewsPanel({ architecture, cloudMode = 'logical' }) {
  const [selectedLevel, setSelectedLevel] = useState('container'); // 'context', 'container', 'component', 'code'

  const components = architecture?.components || [];
  const projectName = architecture?.project_name || 'System Architecture';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Card */}
      <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#2563eb" />
              <span>C4 Model Architecture Viewport</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Hierarchical software architecture visualization across Context, Container, Component, and Code abstractions.
            </p>
          </div>

          {/* Level Switcher */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${selectedLevel === 'context' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedLevel('context')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              L1: Context
            </button>
            <button
              className={`btn btn-sm ${selectedLevel === 'container' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedLevel('container')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              L2: Container (Active)
            </button>
            <button
              className={`btn btn-sm ${selectedLevel === 'component' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedLevel('component')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              L3: Component
            </button>
            <button
              className={`btn btn-sm ${selectedLevel === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedLevel('code')}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              L4: Code
            </button>
          </div>
        </div>
      </div>

      {/* LEVEL 1: CONTEXT */}
      {selectedLevel === 'context' && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Level 1: System Context Diagram
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0' }}>
                High-level boundary showing external users, browser clients, and third-party cloud services interacting with <strong>{projectName}</strong>.
              </p>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Operational</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>External Actors</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Web &amp; Mobile Users</div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>HTTPS requests from consumer browsers and native mobile applications.</p>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 600 }}>Software System</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>{projectName}</div>
              <p style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '4px' }}>{components.length} interconnected cloud services fulfilling business domain workflows.</p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>External Systems</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Cloud APIs &amp; Gateways</div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Identity providers, CDN edge points of presence, and persistent object storage.</p>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 2: CONTAINER (ACTIVE ARCHITECTURE VIEW) */}
      {selectedLevel === 'container' && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Level 2: Container Diagram (Active Architecture)
              </h4>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '2px 0 0' }}>
                Decomposes the system into deployable units: Web Application, API Gateway, Application Server, In-Memory Cache, and Database.
              </p>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Live Diagram View</span>
          </div>

          <div style={{ height: '480px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <ArchitectureDiagram
              architecture={architecture}
              cloudMode={cloudMode}
              direction="TD"
              architectureLevel="container"
            />
          </div>
        </div>
      )}

      {/* LEVEL 3: COMPONENT (COMING SOON) */}
      {selectedLevel === 'component' && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Clock size={24} color="#d97706" />
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.72rem', marginBottom: '8px' }}>
            Coming Soon
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
            C4 Level 3: Deep Component Inspection
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 14px', lineHeight: 1.5 }}>
            Automated code repository AST parsing to decompose container nodes into controllers, services, repositories, and ORM schemas is currently in development.
          </p>
          <div style={{ display: 'inline-flex', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.74rem', color: '#475569' }}>
            <span>Planned Support: FastAPI Routers • NestJS Modules • Spring Controllers • Go Handlers</span>
          </div>
        </div>
      )}

      {/* LEVEL 4: CODE (COMING SOON) */}
      {selectedLevel === 'code' && (
        <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileCode size={24} color="#64748b" />
          </div>
          <span className="badge badge-neutral" style={{ fontSize: '0.72rem', marginBottom: '8px' }}>
            Coming Soon
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
            C4 Level 4: Code &amp; Class Blueprints
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '520px', margin: '0 auto 14px', lineHeight: 1.5 }}>
            UML class generation and bidirectional synchronization with git source repositories is scheduled for the v2.0 release.
          </p>
        </div>
      )}
    </div>
  );
}
