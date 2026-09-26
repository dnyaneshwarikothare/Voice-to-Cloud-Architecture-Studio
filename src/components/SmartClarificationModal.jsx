import React, { useState } from 'react';
import { Sparkles, HelpCircle, Check, ArrowRight, X } from 'lucide-react';

export function SmartClarificationModal({
  isOpen,
  onClose,
  analysisResult,
  onConfirm
}) {
  if (!isOpen || !analysisResult) return null;

  const questions = analysisResult.questions || [];
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    questions.forEach(q => {
      initial[q.id] = q.default_value;
    });
    return initial;
  });

  const handleSelectOption = (qId, option) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleGenerate = () => {
    onConfirm(answers);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#818cf8" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Refine Architecture Requirements
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Domain detected: <b style={{ color: '#38bdf8' }}>{analysisResult.application_type}</b>
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.78rem',
            color: '#c7d2fe'
          }}>
            💡 <b>Intelligent Assistant:</b> To tailor the best architecture, answer these key design questions. You do NOT need technical keywords—we will recommend optimal components automatically.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                    {idx + 1}. {q.question}
                  </label>
                  {q.hint && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }} title={q.hint}>
                      <HelpCircle size={14} />
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                          border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#ffffff' : '#94a3b8'
                        }}
                      >
                        {isSelected && <Check size={13} color="#818cf8" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => onConfirm({})}>
            Skip & Use Defaults
          </button>
          <button className="btn btn-primary" onClick={handleGenerate}>
            <Sparkles size={14} />
            Generate Tailored Architecture
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
