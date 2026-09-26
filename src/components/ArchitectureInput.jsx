import React from 'react';
import { Send, Sparkles, XCircle, FileText, CornerDownLeft, MessageSquare, Wrench } from 'lucide-react';

const SAMPLE_IDEAS = [
  'I want to build an online shopping website with products, cart, payments and orders',
  'I want a food delivery app for restaurants, customers and drivers',
  'React frontend connected to FastAPI backend with Redis cache and PostgreSQL',
  'Video streaming platform with transcoding queue, edge CDN, and S3 storage'
];

const CONVERSATIONAL_COMMANDS = [
  'Add Redis',
  'Remove Redis',
  'Add payment service',
  'Use Python for backend',
  'Make this architecture cheaper',
  'Add authentication',
  'Add CDN'
];

export function ArchitectureInput({
  value,
  onChange,
  onGenerate,
  onClear,
  onConversationalCommand,
  isProcessing
}) {
  const isCommand = /^\s*(add|remove|delete|use|switch|make|reduce|what\s+if)\b/i.test(value);

  const handleSubmit = () => {
    if (!value.trim() || isProcessing) return;
    if (isCommand && onConversationalCommand) {
      onConversationalCommand(value.trim());
    } else {
      onGenerate();
    }
  };

  return (
    <div className="prompt-area">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText size={14} color="#818cf8" />
          Natural Language Prompt & Conversational Commands
        </label>
        {value && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem'
            }}
            title="Clear prompt"
          >
            <XCircle size={12} />
            Clear
          </button>
        )}
      </div>

      <textarea
        className="textarea-custom"
        rows={3}
        placeholder="Type any software idea (e.g. 'I want to build a shopping website') OR a conversational command (e.g. 'Add Redis', 'Remove Redis', 'Use Python for backend')..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.66rem', color: '#64748b', marginTop: '-4px' }}>
        <span>Press <kbd style={{ padding: '1px 4px', background: '#1e293b', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Enter ↵</kbd> to {isCommand ? 'apply edit' : 'generate'}</span>
        <span><kbd style={{ padding: '1px 4px', background: '#1e293b', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Shift + Enter</kbd> for newline</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isCommand ? (
          <button
            className="btn btn-accent"
            style={{ flex: 1, padding: '9px 14px', background: '#0284c7' }}
            onClick={handleSubmit}
            disabled={isProcessing || !value.trim()}
          >
            <Wrench size={15} />
            {isProcessing ? 'Applying Architecture Edit...' : 'Apply Conversational Edit'}
          </button>
        ) : (
          <button
            className="btn btn-accent"
            style={{ flex: 1, padding: '9px 14px' }}
            onClick={handleSubmit}
            disabled={isProcessing || !value.trim()}
          >
            <Sparkles size={15} />
            {isProcessing ? 'Analyzing Requirements...' : 'Generate Architecture Diagram'}
          </button>
        )}
      </div>

      {/* Conversational Edit Chips */}
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
          ⚡ Conversational Quick Edits:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {CONVERSATIONAL_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              className="action-chip"
              onClick={() => {
                onChange(cmd);
                if (onConversationalCommand) onConversationalCommand(cmd);
              }}
              style={{
                fontSize: '0.66rem',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                padding: '3px 8px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              + {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Sample Ideas */}
      <div style={{ marginTop: '2px' }}>
        <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '4px' }}>
          💡 Or click a sample application idea:
        </div>
        <div className="quick-pills">
          {SAMPLE_IDEAS.map((prompt, idx) => (
            <button
              key={idx}
              className="pill-item"
              onClick={() => {
                onChange(prompt);
              }}
              title={prompt}
            >
              {prompt.length > 42 ? prompt.slice(0, 42) + '...' : prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
