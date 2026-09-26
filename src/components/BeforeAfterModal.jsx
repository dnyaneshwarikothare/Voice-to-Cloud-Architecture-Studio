import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Check, Sparkles, TrendingUp, DollarSign, ShieldAlert, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateMermaidCode, renderMermaidSvg } from '../services/mermaidService';
import { analyzeArchitectureHealth } from '../services/healthService';
import { calculateArchitectureCosts } from '../services/costService';

export function BeforeAfterModal({
  isOpen,
  onClose,
  beforeArchitecture,
  afterArchitecture,
  optimization,
  assumptions,
  onConfirmApply
}) {
  const [beforeSvg, setBeforeSvg] = useState('');
  const [afterSvg, setAfterSvg] = useState('');

  const beforeHealth = analyzeArchitectureHealth(beforeArchitecture);
  const afterHealth = analyzeArchitectureHealth(afterArchitecture);

  const beforeCost = calculateArchitectureCosts(beforeArchitecture, assumptions);
  const afterCost = calculateArchitectureCosts(afterArchitecture, assumptions);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function renderPreview() {
      const codeBefore = generateMermaidCode(beforeArchitecture, { direction: 'LR', mode: 'logical' });
      const codeAfter = generateMermaidCode(afterArchitecture, { direction: 'LR', mode: 'logical' });

      const resBefore = await renderMermaidSvg('before_preview', codeBefore);
      const resAfter = await renderMermaidSvg('after_preview', codeAfter);

      if (isMounted) {
        if (resBefore.success) setBeforeSvg(resBefore.svg);
        if (resAfter.success) setAfterSvg(resAfter.svg);
      }
    }

    renderPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, beforeArchitecture, afterArchitecture]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Confetti fallback
    }
    onConfirmApply();
    onClose();
  };

  const healthDelta = afterHealth.overallScore - beforeHealth.overallScore;
  const costDeltaAws = afterCost.aws.totalMonthly - beforeCost.aws.totalMonthly;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '980px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#a855f7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Architecture Optimization Comparison: Before vs. After
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {optimization && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#818cf8', fontWeight: 600 }}>
                  Selected Optimization:
                </span>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                  {optimization.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  {optimization.suggestedSolution}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="opt-impact">{optimization.impact}</span>
              </div>
            </div>
          )}

          {/* Metrics Delta Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}
          >
            {/* Health Score Comparison */}
            <div
              style={{
                background: '#0b0f19',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  ARCHITECTURE HEALTH SCORE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>
                    {beforeHealth.overallScore}/100
                  </span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>
                    {afterHealth.overallScore}/100
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  fontSize: '0.76rem',
                  fontWeight: 600
                }}
              >
                +{healthDelta} Points
              </div>
            </div>

            {/* Cost Comparison */}
            <div
              style={{
                background: '#0b0f19',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  ESTIMATED AWS / GCP MONTHLY COST
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                    ${beforeCost.aws.totalMonthly.toFixed(2)}
                  </span>
                  <ArrowRight size={14} color="#64748b" />
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>
                    ${afterCost.aws.totalMonthly.toFixed(2)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: '0.76rem',
                  fontWeight: 600
                }}
              >
                {costDeltaAws >= 0 ? `+$${costDeltaAws.toFixed(2)}/mo` : `-$${Math.abs(costDeltaAws).toFixed(2)}/mo`}
              </div>
            </div>
          </div>

          {/* Visual Diagrams Side-by-Side */}
          <div className="comparison-split">
            <div className="diff-box before">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#fda4af' }}>
                  🔴 BEFORE ARCHITECTURE
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {beforeArchitecture?.components?.length || 0} Components
                </span>
              </div>
              <div
                style={{
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  padding: '10px'
                }}
                dangerouslySetInnerHTML={{ __html: beforeSvg }}
              />
            </div>

            <div className="diff-box after">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#6ee7b7' }}>
                  🟢 AFTER OPTIMIZATION
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {afterArchitecture?.components?.length || 0} Components
                </span>
              </div>
              <div
                style={{
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  padding: '10px'
                }}
                dangerouslySetInnerHTML={{ __html: afterSvg }}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Keep Current Architecture
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            <Check size={16} />
            Apply & Update Studio
          </button>
        </div>
      </div>
    </div>
  );
}
