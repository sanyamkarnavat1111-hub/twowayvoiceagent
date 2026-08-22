import { VoiceName, LanguageCode } from '../types.js';

export const LANGUAGE_LOCALES: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
  ja: 'ja-JP',
  zh: 'zh-CN',
  pt: 'pt-BR',
  it: 'it-IT',
  ar: 'ar-SA',
  ru: 'ru-RU',
  ko: 'ko-KR',
};

export class VoiceSpeechEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;

  public speak(
    text: string,
    voiceName: VoiceName = 'Kore',
    targetLang: string = 'en',
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    this.stop();

    if (!('speechSynthesis' in window)) {
      console.warn('Browser does not support SpeechSynthesis.');
      if (onEnd) onEnd();
      return;
    }

    // Clean text of markdown characters before speaking
    const cleanText = text
      .replace(/[#*`_~[\]()]/g, ' ')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    const locale = LANGUAGE_LOCALES[targetLang] || (targetLang.includes('-') ? targetLang : 'en-US');
    utterance.lang = locale;

    // Pick appropriate browser voice based on target language and persona
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    // First try to match the exact target language locale (e.g. es, hi, fr, de, ja, zh)
    const matchingLangVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) || v.lang.toLowerCase().startsWith(locale.toLowerCase().slice(0, 2))
    );

    if (matchingLangVoices.length > 0) {
      if (voiceName === 'Kore' || voiceName === 'Zephyr') {
        selectedVoice =
          matchingLangVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural')) ||
          matchingLangVoices[0];
        utterance.pitch = voiceName === 'Zephyr' ? 1.05 : 1.0;
      } else {
        selectedVoice =
          matchingLangVoices.find((v) => v.name.toLowerCase().includes('male')) ||
          matchingLangVoices[0];
        utterance.pitch = voiceName === 'Fenrir' ? 0.9 : voiceName === 'Puck' ? 1.1 : 0.95;
      }
    } else {
      // Fallback to standard voice selection
      if (voiceName === 'Kore' || voiceName === 'Zephyr') {
        selectedVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('victoria') ||
              v.name.toLowerCase().includes('karen') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('natural'))
        );
        utterance.pitch = voiceName === 'Zephyr' ? 1.05 : 1.0;
      } else {
        selectedVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('alex') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('george'))
        );
        utterance.pitch = voiceName === 'Fenrir' ? 0.9 : voiceName === 'Puck' ? 1.1 : 0.95;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 1.0;

    utterance.onstart = () => {
      this.isSpeakingState = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeakingState = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingState = false;
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return (
      this.isSpeakingState ||
      (typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking)
    );
  }
}

export class BrowserSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentLanguage: string = 'en-US';

  constructor(langCode: string = 'auto') {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.setLanguage(langCode);
    }
  }

  public setLanguage(langCode: string): void {
    const locale = langCode === 'auto' ? 'en-US' : LANGUAGE_LOCALES[langCode] || langCode;
    this.currentLanguage = locale;
    if (this.recognition) {
      this.recognition.lang = locale;
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    langCode?: string
  ): void {
    if (!this.recognition) {
      onError(
        new Error(
          'Web Speech Recognition API is not supported in this browser. Please use manual typing or upload.'
        )
      );
      return;
    }

    if (langCode) {
      this.setLanguage(langCode);
    }

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onResult(final.trim(), true);
      } else if (interim) {
        onResult(interim.trim(), false);
      }
    };

    this.recognition.onerror = (e: any) => {
      this.isListening = false;
      onError(e);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      this.recognition.stop();
      setTimeout(() => {
        try {
          this.recognition.start();
        } catch (err) {
          onError(err);
        }
      }, 100);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export class MicAudioVisualizer {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public async start(onLevel: (level: number) => void): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const loop = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length / 255;
          onLevel(avg);
          this.animFrameId = requestAnimationFrame(loop);
        };
        loop();
      }
    } catch (err) {
      console.warn('Visualizer mic access note:', err);
    }
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
