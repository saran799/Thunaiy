import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompanionBot from '../features/companion/CompanionBot';
import CompanionCharacter from '../features/companion/CompanionCharacter';
import { COMPANION_PERSONALITIES } from '../features/companion/personalities';
import { speechService } from '../services/speech/speechService';
import type { FormFieldRect } from '../features/viewer/types';

describe('CompanionBot Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    (window as any).speechSynthesis = {
      getVoices: vi.fn(() => [
        { name: 'Google தமிழ்', lang: 'ta-IN', default: false, localService: true },
        { name: 'Microsoft Heera', lang: 'en-IN', default: true, localService: true },
      ]),
      speak: vi.fn((utterance: any) => {
        setTimeout(() => utterance.onstart?.(), 0);
      }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
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

  it('renders Buddy for English with personality greeting when no field is selected', () => {
    render(<CompanionBot selectedField={null} languageCode="en" autoSpeakOnSelect={false} />);

    expect(screen.getByRole('region', { name: 'Buddy voice guidance' })).toBeTruthy();
    expect(screen.getByText('Buddy')).toBeTruthy();
    expect(screen.getByText(/Hello! I am Buddy/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Listen to instruction' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mute voice' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Minimize companion' })).toBeTruthy();
  });

  it('renders Thunai for Tamil with native Tamil name and role', () => {
    render(<CompanionBot selectedField={null} languageCode="ta" autoSpeakOnSelect={false} />);

    expect(screen.getByText('துணை')).toBeTruthy();
    expect(screen.getByText('வங்கி வழிகாட்டி')).toBeTruthy();
    expect(screen.getByText(/வணக்கம்! நான் துணை/)).toBeTruthy();
  });

  it('renders Mitra for Hindi with native Hindi greeting', () => {
    render(<CompanionBot selectedField={null} languageCode="hi" autoSpeakOnSelect={false} />);

    expect(screen.getByText('मित्रा')).toBeTruthy();
    expect(screen.getByText('बैंकिंग साथी')).toBeTruthy();
    expect(screen.getByText(/नमस्ते! मैं मित्रा हूँ/)).toBeTruthy();
  });

  it('minimizes and reopens when clicking minimize button', async () => {
    render(<CompanionBot selectedField={null} languageCode="en" autoSpeakOnSelect={false} />);

    // Initially bubble is visible
    expect(screen.getByText(/Hello! I am Buddy/)).toBeTruthy();

    // Click minimize
    fireEvent.click(screen.getByRole('button', { name: 'Minimize companion' }));

    // Speech bubble is hidden, minimized floating head button is rendered
    expect(screen.queryByText(/Hello! I am Buddy/)).toBeNull();
    const reopenBtn = screen.getByRole('button', { name: 'Open Buddy companion guidance' });
    expect(reopenBtn).toBeTruthy();

    // Click reopen
    fireEvent.click(reopenBtn);
    expect(await screen.findByText(/Hello! I am Buddy/)).toBeTruthy();
  });

  it('toggles mute state and cancels active speech', () => {
    const cancelSpy = vi.spyOn(speechService, 'cancel');

    render(<CompanionBot selectedField={null} languageCode="en" autoSpeakOnSelect={false} />);

    const muteBtn = screen.getByRole('button', { name: 'Mute voice' });
    fireEvent.click(muteBtn);

    expect(cancelSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Unmute voice' })).toBeTruthy();

    // Unmute
    fireEvent.click(screen.getByRole('button', { name: 'Unmute voice' }));
    expect(screen.getByRole('button', { name: 'Mute voice' })).toBeTruthy();
  });

  it('speaks the field guidance when user clicks Listen', () => {
    const speakSpy = vi.spyOn(speechService, 'speak');

    render(<CompanionBot selectedField={null} languageCode="en" autoSpeakOnSelect={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Listen to instruction' }));

    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        languageCode: 'en',
        text: expect.stringContaining('Hello! I am Buddy'),
      }),
    );
  });

  it('renders talking avatar when field is selected and auto-speaks guidance instruction', async () => {
    const speakSpy = vi.spyOn(speechService, 'speak');

    const mockField: FormFieldRect = {
      id: 'sbi-aof-v1::full-name',
      page: 1,
      x: 24,
      y: 228,
      width: 546,
      height: 32,
      applicable: true,
      required: true,
      label: '2. Applicant Full Name',
      fieldKey: 'full-name',
      guidance: {
        fieldId: 'sbi-aof-v1::full-name',
        languageCode: 'en',
        title: 'Applicant full name',
        body: 'Write your name in block capitals exactly as it appears on your PAN or Aadhaar.',
        docLabel: 'Doc 2: PAN / Aadhaar',
      },
      progress: 'pending',
    };

    render(<CompanionBot selectedField={mockField} languageCode="en" autoSpeakOnSelect={true} />);

    // When field is selected, the companion floats as an active talking avatar
    expect(screen.getByRole('button', { name: 'Listen with Buddy' })).toBeTruthy();

    await waitFor(() => {
      expect(speakSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          languageCode: 'en',
          text: 'Write your name in block capitals exactly as it appears on your PAN or Aadhaar.',
        }),
      );
    });
  });

  it('renders CompanionCharacter vector SVG without crashing across all states', () => {
    const p = COMPANION_PERSONALITIES.ta;

    const { rerender } = render(<CompanionCharacter personality={p} state="idle" size={80} />);
    expect(document.querySelector('svg')).toBeTruthy();

    rerender(<CompanionCharacter personality={p} state="speaking" size={80} />);
    expect(document.querySelector('svg')).toBeTruthy();

    rerender(<CompanionCharacter personality={p} state="paused" size={80} />);
    expect(document.querySelector('svg')).toBeTruthy();

    rerender(<CompanionCharacter personality={p} state="error" size={80} />);
    expect(document.querySelector('svg')).toBeTruthy();
  });
});
