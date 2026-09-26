import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Radio, Sparkles, HelpCircle } from 'lucide-react';
import { SpeechService } from '../services/speechService';

export function VoiceInput({ onTranscriptChange, currentText }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const speechServiceRef = useRef(null);

  useEffect(() => {
    const service = new SpeechService({
      onTranscript: ({ fullText }) => {
        onTranscriptChange(fullText);
      },
      onError: ({ message }) => {
        setErrorMessage(message);
        setIsListening(false);
      },
      onStatusChange: ({ isListening: listening }) => {
        setIsListening(listening);
        if (listening) setErrorMessage('');
      }
    });

    const supported = service.isSupported();
    setIsSupported(supported);
    speechServiceRef.current = service;

    return () => {
      service.stop();
    };
  }, [onTranscriptChange]);

  const toggleListening = () => {
    if (!isSupported) {
      setErrorMessage('Web Speech API is best supported in Google Chrome and Microsoft Edge. You can type directly in the prompt box below!');
      return;
    }

    if (!speechServiceRef.current) return;
    setErrorMessage('');

    if (isListening) {
      speechServiceRef.current.stop();
    } else {
      const started = speechServiceRef.current.start(currentText);
      if (started) {
        setIsListening(true);
      }
    }
  };

  return (
    <div className="voice-hero-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          style={{ width: '56px', height: '56px', minWidth: '56px' }}
          title={
            !isSupported
              ? 'Click to see voice compatibility notice'
              : isListening
              ? 'Click to stop listening'
              : 'Click to start speaking your software idea'
          }
        >
          {isListening ? <MicOff size={26} /> : <Mic size={26} />}
        </button>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="mic-status-text" style={{ marginTop: 0, fontSize: '0.84rem' }}>
            {isListening ? (
              <>
                <span className="status-dot active" />
                <span style={{ color: '#f43f5e' }}>Listening... Speak naturally</span>
              </>
            ) : (
              <>
                <Radio size={14} color="#818cf8" />
                <span>{isSupported ? 'Click Mic to Speak Idea' : 'Voice Input Info'}</span>
              </>
            )}
          </div>

          <p className="mic-subtext" style={{ marginTop: '2px', fontSize: '0.72rem' }}>
            {isListening
              ? 'Describe features, payments, database, users, or scaling needs'
              : 'No technical jargon needed—describe any application idea!'}
          </p>
        </div>
      </div>

      {isListening && (
        <div className="audio-waves" style={{ marginTop: '6px', alignSelf: 'flex-start' }}>
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
          <div className="wave-bar" />
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.73rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textAlign: 'left',
            width: '100%'
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
