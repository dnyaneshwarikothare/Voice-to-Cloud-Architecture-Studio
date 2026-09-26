/**
 * Speech Recognition Service wrapping the Browser Web Speech API
 */

export class SpeechService {
  constructor(options = {}) {
    this.recognition = null;
    this.isListening = false;
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.finalTranscript = '';
    
    this.init();
  }

  isSupported() {
    return typeof window !== 'undefined' && 
      (Boolean(window.SpeechRecognition) || Boolean(window.webkitSpeechRecognition));
  }

  init() {
    if (!this.isSupported()) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange({ isListening: true, status: 'listening' });
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (currentFinal) {
        this.finalTranscript = (this.finalTranscript + ' ' + currentFinal).trim();
      }

      const fullText = (this.finalTranscript + ' ' + interimTranscript).trim();
      this.onTranscript({
        fullText,
        interim: interimTranscript,
        final: this.finalTranscript
      });
    };

    this.recognition.onerror = (event) => {
      let friendlyMessage = 'An error occurred during speech recognition.';

      switch (event.error) {
        case 'not-allowed':
          friendlyMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
          break;
        case 'no-speech':
          friendlyMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          friendlyMessage = 'No microphone device found on your computer.';
          break;
        case 'network':
          friendlyMessage = 'Network error communicating with speech recognition service.';
          break;
        default:
          friendlyMessage = `Speech recognition error: ${event.error}`;
      }

      this.onError({
        code: event.error,
        message: friendlyMessage
      });
      this.isListening = false;
      this.onStatusChange({ isListening: false, status: 'error' });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusChange({ isListening: false, status: 'idle' });
    };
  }

  start(existingText = '') {
    if (!this.isSupported()) {
      this.onError({
        code: 'not-supported',
        message: 'Speech Recognition is not supported by your browser. Please use Chrome, Edge, or enter text manually.'
      });
      return false;
    }

    this.finalTranscript = existingText ? existingText.trim() : '';

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        // Already started
        return true;
      }
      this.onError({
        code: 'start-failed',
        message: 'Could not start voice recognition: ' + err.message
      });
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore stop errors
      }
      this.isListening = false;
      this.onStatusChange({ isListening: false, status: 'stopped' });
    }
  }

  reset() {
    this.stop();
    this.finalTranscript = '';
  }
}
