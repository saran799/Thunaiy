import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speechService } from '../services/speech/speechService';
import { COMPANION_PERSONALITIES } from '../features/companion/personalities';

describe('SpeechService & Multilingual Voice Engine', () => {
  let mockVoices: any[] = [];
  let speakMock: any;
  let cancelMock: any;
  let pauseMock: any;
  let resumeMock: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockVoices = [
      { name: 'Google தமிழ்', lang: 'ta-IN', default: false, localService: true },
      { name: 'Google हिन्दी', lang: 'hi-IN', default: false, localService: true },
      { name: 'Google తెలుగు', lang: 'te-IN', default: false, localService: true },
      { name: 'Google ಕನ್ನಡ', lang: 'kn-IN', default: false, localService: true },
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN', default: true, localService: true },
      { name: 'Google US English', lang: 'en-US', default: false, localService: false },
    ];

    speakMock = vi.fn((utterance: any) => {
      // Simulate speech start event asynchronously
      setTimeout(() => {
        utterance.onstart?.();
      }, 0);
    });
    cancelMock = vi.fn();
    pauseMock = vi.fn();
    resumeMock = vi.fn();

    // Setup global window.speechSynthesis mock
    (window as any).speechSynthesis = {
      getVoices: vi.fn(() => mockVoices),
      speak: speakMock,
      cancel: cancelMock,
      pause: pauseMock,
      resume: resumeMock,
      speaking: false,
      paused: false,
      onvoiceschanged: null,
    };

    (globalThis as any).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      voice: any = null;
      rate = 1;
      pitch = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onpause: (() => void) | null = null;
      onresume: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  it('detects available browser voices and reports support', () => {
    expect(speechService.isSupported()).toBe(true);
    const voices = speechService.getAvailableVoices();
    expect(voices.length).toBe(6);
    expect(voices[0].name).toBe('Google தமிழ்');
    expect(voices[0].lang).toBe('ta-IN');
  });

  it('correctly matches voices for all five supported languages', () => {
    const taVoice = speechService.findVoiceForLanguage('ta');
    expect(taVoice?.lang).toBe('ta-IN');

    const enVoice = speechService.findVoiceForLanguage('en');
    expect(enVoice?.lang).toBe('en-IN');

    const hiVoice = speechService.findVoiceForLanguage('hi');
    expect(hiVoice?.lang).toBe('hi-IN');

    const teVoice = speechService.findVoiceForLanguage('te');
    expect(teVoice?.lang).toBe('te-IN');

    const knVoice = speechService.findVoiceForLanguage('kn');
    expect(knVoice?.lang).toBe('kn-IN');
  });

  it('returns true for hasVoiceForLanguage when language voice is present', () => {
    expect(speechService.hasVoiceForLanguage('ta')).toBe(true);
    expect(speechService.hasVoiceForLanguage('hi')).toBe(true);
    expect(speechService.hasVoiceForLanguage('en')).toBe(true);
    expect(speechService.hasVoiceForLanguage('te')).toBe(true);
    expect(speechService.hasVoiceForLanguage('kn')).toBe(true);
  });

  it('honestly reports when a voice is missing and falls back without simulating false playback', () => {
    // Remove Telugu and Kannada voices
    (window as any).speechSynthesis.getVoices = vi.fn(() =>
      mockVoices.filter((v) => !v.lang.startsWith('te') && !v.lang.startsWith('kn')),
    );

    expect(speechService.hasVoiceForLanguage('te')).toBe(false);
    expect(speechService.hasVoiceForLanguage('kn')).toBe(false);

    const onError = vi.fn();
    const success = speechService.speak({
      languageCode: 'te',
      text: 'నమస్కారం',
      onError,
    });

    expect(success).toBe(false);
    expect(onError).toHaveBeenCalledWith('No speech voice available for TE on this device.');
    expect(speakMock).not.toHaveBeenCalled();
    expect(speechService.getState()).toBe('error');
  });

  it('cancels ongoing utterance before starting a new utterance to prevent overlapping speech', () => {
    speechService.speak({
      languageCode: 'en',
      text: 'First instruction',
    });
    expect(cancelMock).toHaveBeenCalledTimes(1);

    speechService.speak({
      languageCode: 'ta',
      text: 'இரண்டாவது தகவல்',
    });
    expect(cancelMock).toHaveBeenCalledTimes(2);
  });

  it('synchronizes speaking state with actual audio lifecycle events', async () => {
    let capturedUtterance: any = null;
    speakMock.mockImplementation((utterance: any) => {
      capturedUtterance = utterance;
    });

    const states: string[] = [];
    const unsubscribe = speechService.subscribe((event) => {
      states.push(event.state);
    });

    speechService.speak({
      languageCode: 'en',
      text: 'Please write your name in block letters',
    });

    // Start event
    capturedUtterance.onstart();
    expect(speechService.getState()).toBe('speaking');

    // Pause event
    capturedUtterance.onpause();
    expect(speechService.getState()).toBe('paused');

    // Resume event
    capturedUtterance.onresume();
    expect(speechService.getState()).toBe('speaking');

    // End event
    capturedUtterance.onend();
    expect(speechService.getState()).toBe('idle');

    unsubscribe();
  });

  it('handles pause, resume, and cancel calls cleanly', () => {
    (window as any).speechSynthesis.speaking = true;
    (window as any).speechSynthesis.paused = false;

    speechService.pause();
    expect(pauseMock).toHaveBeenCalled();

    (window as any).speechSynthesis.paused = true;
    speechService.resume();
    expect(resumeMock).toHaveBeenCalled();

    speechService.cancel();
    expect(cancelMock).toHaveBeenCalled();
  });

  it('configures distinct voice pitch, rate, and greeting across all 5 language personalities', () => {
    const langs = ['ta', 'en', 'hi', 'te', 'kn'] as const;
    for (const code of langs) {
      const p = COMPANION_PERSONALITIES[code];
      expect(p.name).toBeTruthy();
      expect(p.nativeName).toBeTruthy();
      expect(p.greeting).toBeTruthy();
      expect(p.bcp47Lang).toBeTruthy();
      expect(p.voiceRate).toBeGreaterThan(0.7);
      expect(p.voicePitch).toBeGreaterThan(0.7);
      expect(p.colors.primary).toBeTruthy();
      expect(p.colors.ledAccent).toBeTruthy();
    }

    expect(COMPANION_PERSONALITIES.ta.name).toBe('Thunai');
    expect(COMPANION_PERSONALITIES.en.name).toBe('Buddy');
    expect(COMPANION_PERSONALITIES.hi.name).toBe('Mitra');
    expect(COMPANION_PERSONALITIES.te.name).toBe('Chinni');
    expect(COMPANION_PERSONALITIES.kn.name).toBe('Sahaaya');
  });
});
