import React, { useState, useEffect } from 'react';
import { X, Compass, ArrowRight, Layers, CheckCircle2, BookOpen, Lightbulb } from 'lucide-react';
import { explainArchitectureApi } from '../services/apiService';

export function ArchitectureExplanationModal({ isOpen, onClose, architecture }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && architecture) {
      setLoading(true);
      explainArchitectureApi(architecture)
        .then(data => setExplanation(data))
        .catch(() => setExplanation(null))
        .finally(() => setLoading(false));
    }
  }, [isOpen, architecture]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Compass size={18} color="#2563eb" />
            <span>Architecture Walkthrough & Plain English Explanation</span>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              <span>Analyzing architecture components and data flows...</span>
            </div>
          ) : explanation ? (
            <>
              {/* Executive Summary */}
              <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: 600, fontSize: '0.84rem' }}>
                  <Lightbulb size={16} />
                  Overview
                </div>
                <p style={{ fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.6 }}>
                  {explanation.summary}
                </p>
              </div>

              {/* Step-by-Step Request Flow */}
              <div className="card">
                <div className="card-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={14} color="#2563eb" />
                    How User Requests Flow Through the System
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {explanation.request_flow?.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '8px 10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#2563eb',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ color: '#0f172a', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component-by-Component Analogies */}
              <div className="card">
                <div className="card-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14} color="#16a34a" />
                    Component Roles (Plain English Analogies)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {explanation.components_explanation?.map(comp => (
                    <div
                      key={comp.id}
                      style={{
                        padding: '8px 10px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#2563eb', marginBottom: '4px' }}>
                        {comp.technology} ({comp.type})
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                        {comp.simple_explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              No explanation available. Add components to the architecture.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
