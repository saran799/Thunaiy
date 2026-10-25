import type { LanguageCode } from '../../domain/types';

export type SpeechPlaybackState = 'idle' | 'speaking' | 'paused' | 'error';

export interface SpeechVoiceInfo {
  name: string;
  lang: string;
  isDefault: boolean;
  isLocalService: boolean;
}

export interface SpeechStateEvent {
  state: SpeechPlaybackState;
  text: string;
  languageCode: LanguageCode;
  voiceName: string | null;
  errorMessage?: string;
}

export interface SpeakOptions {
  languageCode: LanguageCode;
  text: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: string) => void;
}

type SpeechListener = (event: SpeechStateEvent) => void;

/**
 * Robust Web Speech API service for Thunaiy.
 * Manages voice detection, utterance queuing/cancellation, language matching,
 * and audio synchronization with honesty: never simulates audio playback if
 * voices are unavailable.
 */
class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private listeners: Set<SpeechListener> = new Set();
  private currentState: SpeechPlaybackState = 'idle';
  private currentText = '';
  private currentLang: LanguageCode = 'en';
  private currentVoiceName: string | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    } catch {
      // In restricted or mock environments
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        this.voices = available;
      }
    } catch {
      this.voices = [];
    }
  }

  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  public getAvailableVoices(): SpeechVoiceInfo[] {
    this.loadVoices();
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      isDefault: v.default,
      isLocalService: v.localService,
    }));
  }

  /**
   * Finds the best compatible SpeechSynthesisVoice for a given Thunaiy language code.
   */
  public findVoiceForLanguage(lang: LanguageCode): SpeechSynthesisVoice | null {
    this.loadVoices();
    if (this.voices.length === 0) return null;

    const langPatterns: Record<LanguageCode, { tags: string[]; nameMatches: string[] }> = {
      ta: { tags: ['ta-in', 'ta_in', 'ta'], nameMatches: ['tamil', 'தமிழ்'] },
      en: { tags: ['en-in', 'en-gb', 'en-us', 'en'], nameMatches: ['indian english', 'english'] },
      hi: { tags: ['hi-in', 'hi_in', 'hi'], nameMatches: ['hindi', 'हिन्दी'] },
      te: { tags: ['te-in', 'te_in', 'te'], nameMatches: ['telugu', 'తెలుగు'] },
      kn: { tags: ['kn-in', 'kn_in', 'kn'], nameMatches: ['kannada', 'ಕನ್ನಡ'] },
    };

    const target = langPatterns[lang];
    if (!target) return null;

    // 1. Exact match on BCP-47 tag (case-insensitive)
    for (const tag of target.tags) {
      const match = this.voices.find((v) => v.lang.toLowerCase() === tag);
      if (match) return match;
    }

    // 2. Prefix match on lang tag (e.g. 'ta-' or 'te-')
    for (const tag of target.tags) {
      const match = this.voices.find((v) => v.lang.toLowerCase().startsWith(tag));
      if (match) return match;
    }

    // 3. Match voice name for language name
    for (const nameWord of target.nameMatches) {
      const match = this.voices.find((v) => v.name.toLowerCase().includes(nameWord.toLowerCase()));
      if (match) return match;
    }

    return null;
  }

  public hasVoiceForLanguage(lang: LanguageCode): boolean {
    return this.findVoiceForLanguage(lang) !== null;
  }

  public getState(): SpeechPlaybackState {
    return this.currentState;
  }

  public getCurrentVoiceName(): string | null {
    return this.currentVoiceName;
  }

  public subscribe(listener: SpeechListener): () => void {
    this.listeners.add(listener);
    // Emit initial state immediately
    listener({
      state: this.currentState,
      text: this.currentText,
      languageCode: this.currentLang,
      voiceName: this.currentVoiceName,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(errorMessage?: string) {
    const event: SpeechStateEvent = {
      state: this.currentState,
      text: this.currentText,
      languageCode: this.currentLang,
      voiceName: this.currentVoiceName,
      errorMessage,
    };
    this.listeners.forEach((l) => l(event));
  }

  /**
   * Speaks the provided text using browser speech synthesis with the best voice
   * matching the requested language.
   */
  public speak(options: SpeakOptions): boolean {
    const { languageCode, text, rate = 1.0, pitch = 1.0, onStart, onEnd, onPause, onResume, onError } = options;

    // Cancel any current utterance before starting new speech
    this.cancel();

    if (!this.isSupported()) {
      this.currentState = 'error';
      this.currentText = text;
      this.currentLang = languageCode;
      this.currentVoiceName = null;
      this.notify('Speech synthesis not supported in this browser.');
      onError?.('Speech synthesis not supported in this browser.');
      return false;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      this.currentState = 'idle';
      this.currentText = '';
      this.notify();
      return false;
    }

    const matchedVoice = this.findVoiceForLanguage(languageCode);
    this.currentText = cleanText;
    this.currentLang = languageCode;
    this.currentVoiceName = matchedVoice?.name ?? null;

    // If no voice is found for non-English, do not fake audio playback!
    if (!matchedVoice && languageCode !== 'en') {
      this.currentState = 'error';
      this.notify(`No speech voice available for ${languageCode.toUpperCase()} on this device.`);
      onError?.(`No speech voice available for ${languageCode.toUpperCase()} on this device.`);
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = Math.max(0.7, Math.min(1.3, rate));
      utterance.pitch = Math.max(0.8, Math.min(1.2, pitch));

      utterance.onstart = () => {
        this.currentState = 'speaking';
        this.notify();
        onStart?.();
      };

      utterance.onend = () => {
        this.currentState = 'idle';
        this.currentUtterance = null;
        this.notify();
        onEnd?.();
      };

      utterance.onpause = () => {
        this.currentState = 'paused';
        this.notify();
        onPause?.();
      };

      utterance.onresume = () => {
        this.currentState = 'speaking';
        this.notify();
        onResume?.();
      };

      utterance.onerror = (e) => {
        // 'interrupted' and 'canceled' occur naturally when user switches fields
        if (e.error === 'interrupted' || e.error === 'canceled') {
          this.currentState = 'idle';
          this.currentUtterance = null;
          this.notify();
          return;
        }
        this.currentState = 'error';
        this.currentUtterance = null;
        this.notify(e.error || 'Speech synthesis error');
        onError?.(e.error || 'Speech playback failed');
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err: any) {
      this.currentState = 'error';
      this.notify(err?.message || 'Failed to start speech');
      onError?.(err?.message || 'Failed to start speech');
      return false;
    }
  }

  public pause(): void {
    if (!this.isSupported()) return;
    try {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        this.currentState = 'paused';
        this.notify();
      }
    } catch {
      // Ignore
    }
  }

  public resume(): void {
    if (!this.isSupported()) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.currentState = 'speaking';
        this.notify();
      }
    } catch {
      // Ignore
    }
  }

  public cancel(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.currentState = 'idle';
      this.currentUtterance = null;
      this.notify();
    } catch {
      // Ignore
    }
  }
}

export const speechService = new SpeechService();
