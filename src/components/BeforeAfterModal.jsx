import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Check, Sparkles, TrendingUp, DollarSign, ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateMermaidCode, renderMermaidSvg } from '../services/mermaidService';
import { analyzeArchitectureHealth } from '../services/healthService';
import { calculateArchitectureCosts } from '../services/costService';
import { computeArchitectureDiff } from '../services/optimizationService';

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

  const diff = computeArchitectureDiff(beforeArchitecture, afterArchitecture);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function renderPreview() {
      const codeBefore = generateMermaidCode(beforeArchitecture, { direction: 'LR', mode: 'logical' });
      const codeAfter = generateMermaidCode(afterArchitecture, { direction: 'LR', mode: 'logical' });

      const resBefore = await renderMermaidSvg('before_preview_modal', codeBefore);
      const resAfter = await renderMermaidSvg('after_preview_modal', codeAfter);

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
      <div className="modal-card" style={{ maxWidth: '980px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 20px', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Architecture Optimization: Before vs. After
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Review changes banner (Requirement 6) */}
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#2563eb" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
                Review optimization changes before applying.
              </span>
            </div>
            {optimization && (
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                {optimization.title}
              </span>
            )}
          </div>

          {/* Metrics Delta Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {/* Health Score Comparison */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Architecture Health
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444' }}>
                    {beforeHealth.overallScore}/100
                  </span>
                  <ArrowRight size={14} color="#94a3b8" />
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    {afterHealth.overallScore}/100
                  </span>
                </div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d', fontSize: '0.76rem', fontWeight: 700 }}>
                +{healthDelta} Points
              </div>
            </div>

            {/* Cost Comparison */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Estimated Monthly Cost (AWS/GCP)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    ${beforeCost.aws.totalMonthly.toFixed(2)}
                  </span>
                  <ArrowRight size={14} color="#94a3b8" />
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                    ${afterCost.aws.totalMonthly.toFixed(2)}
                  </span>
                </div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '9999px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.76rem', fontWeight: 700 }}>
                {costDeltaAws >= 0 ? `+$${costDeltaAws.toFixed(2)}/mo` : `-$${Math.abs(costDeltaAws).toFixed(2)}/mo`}
              </div>
            </div>
          </div>

          {/* Exact Structural Changes Diff (Requirement 2 & 6) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Exact Structural Modifications:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {diff.addedComponents.map(comp => (
                <span key={comp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>+</span>
                  <span>Add {comp.name}</span>
                  <span style={{ color: '#15803d', fontSize: '0.68rem', opacity: 0.85 }}>({comp.type})</span>
                </span>
              ))}
              {diff.modifiedComponents?.map(comp => (
                <span key={comp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>↑</span>
                  <span>Scale {comp.name}</span>
                </span>
              ))}
              {diff.connectionsChanged > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600 }}>
                  <span>⇄</span>
                  <span>{diff.connectionsChanged} Connections Rewired / Added</span>
                </span>
              )}
            </div>

            {/* Requirement 7: Manual recommendations notice */}
            <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} color="#d97706" />
              <span>Policy considerations (IAM Least Privilege &amp; Cross-Region Backups): <em>Recommendation only — manual configuration required.</em></span>
            </div>
          </div>

          {/* Visual Diagrams Side-by-Side with Action button near AFTER OPTIMIZATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* BEFORE ARCHITECTURE */}
            <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#b91c1c' }}>
                  🔴 BEFORE ARCHITECTURE
                </span>
                <span style={{ fontSize: '0.72rem', color: '#7f1d1d', fontWeight: 600 }}>
                  {beforeArchitecture?.components?.length || 0} Components
                </span>
              </div>
              <div
                style={{
                  minHeight: '220px',
                  background: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  padding: '8px'
                }}
                dangerouslySetInnerHTML={{ __html: beforeSvg || '<div style="color:#94a3b8;font-size:0.75rem;">Rendering diagram...</div>' }}
              />
            </div>

            {/* AFTER OPTIMIZATION (With Apply Optimization Button near this section) */}
            <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#15803d' }}>
                    🟢 AFTER OPTIMIZATION
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>
                    ({afterArchitecture?.components?.length || 0} Components)
                  </span>
                </div>

                {/* Section-level Apply Optimization button (Requirement 1) */}
                <button
                  id="btn-apply-opt-section"
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirm}
                  style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, fontSize: '0.74rem', gap: '5px' }}
                >
                  <Sparkles size={13} />
                  <span>Apply Optimization</span>
                </button>
              </div>

              <div
                style={{
                  minHeight: '220px',
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  padding: '8px'
                }}
                dangerouslySetInnerHTML={{ __html: afterSvg || '<div style="color:#94a3b8;font-size:0.75rem;">Rendering diagram...</div>' }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer (Requirement 1) */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Keep Current Architecture
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 600, gap: '6px' }}>
            <Check size={16} />
            <span>Apply Optimization</span>
          </button>
        </div>
      </div>
    </div>
  );
}
