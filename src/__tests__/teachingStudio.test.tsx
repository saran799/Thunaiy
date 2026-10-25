import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TeachingStudio from '../features/teaching/TeachingStudio';
import { SBI_TEACHING_CATALOGUE } from '../features/teaching/sbiTeachingCatalogue';
import type { LanguageCode } from '../domain/types';

describe('TeachingStudio & SBI Form-Filling Experience', () => {
  it('contains complete verified teaching records across all 5 languages for every field', () => {
    const languages: LanguageCode[] = ['ta', 'en', 'hi', 'te', 'kn'];
    expect(SBI_TEACHING_CATALOGUE.length).toBeGreaterThanOrEqual(25);

    for (const field of SBI_TEACHING_CATALOGUE) {
      expect(field.id).toBeTruthy();
      expect(field.label).toBeTruthy();
      expect(field.bounds).toHaveLength(4);
      expect(field.bounds[2]).toBeGreaterThan(0); // width > 0
      expect(field.bounds[3]).toBeGreaterThan(0); // height > 0

      for (const lang of languages) {
        const trans = field.translations[lang];
        expect(trans, `Missing ${lang} translation for field ${field.id}`).toBeDefined();
        expect(trans.title.trim().length).toBeGreaterThan(0);
        expect(trans.sectionName.trim().length).toBeGreaterThan(0);
        expect(trans.explanation.trim().length).toBeGreaterThan(0);
        expect(trans.speechScript.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('renders the initial preparation checklist and companion character', () => {
    const handleToggleDone = vi.fn();
    const handleFinish = vi.fn();

    render(
      <TeachingStudio
        languageCode="en"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );

    expect(screen.getByText('Checklist of Required Documents')).toBeTruthy();
    expect(screen.getByText(/Keep these documents ready/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Buddy banking companion character/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Mark as done/i })).toBeTruthy();
  });

  it('navigates through fields using Next and Previous buttons', async () => {
    const handleToggleDone = vi.fn();
    const handleFinish = vi.fn();

    render(
      <TeachingStudio
        languageCode="ta"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );

    // Initial is Prep in Tamil (துணை)
    expect(screen.getByText('படிவம் நிரப்ப தேவையான ஆவணங்கள்')).toBeTruthy();
    const prevBtn = screen.getByRole('button', { name: 'Previous form field' });
    expect(prevBtn.hasAttribute('disabled')).toBe(true);

    // Click Next -> Moves to Field 2 (Date)
    const nextBtn = screen.getByRole('button', { name: 'Next form field' });
    fireEvent.click(nextBtn);

    expect(await screen.findByText('படிவம் சமர்ப்பிக்கும் தேதி')).toBeTruthy();
    expect(screen.getByText('2 / 30')).toBeTruthy();

    // Click Next again -> Moves to Field 3 (Branch Name)
    fireEvent.click(screen.getByRole('button', { name: 'Next form field' }));
    expect(await screen.findByText('வங்கி கிளை பெயர்')).toBeTruthy();

    // Click Prev -> Goes back to Field 2 (Date)
    fireEvent.click(screen.getByRole('button', { name: 'Previous form field' }));
    expect(await screen.findByText('படிவம் சமர்ப்பிக்கும் தேதி')).toBeTruthy();
  });

  it('toggles field done state and invokes onToggleDone', async () => {
    const handleToggleDone = vi.fn();
    const handleFinish = vi.fn();

    const { rerender } = render(
      <TeachingStudio
        languageCode="en"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );

    const markBtn = screen.getByRole('button', { name: /Mark as done/i });
    fireEvent.click(markBtn);

    expect(handleToggleDone).toHaveBeenCalledWith('sbi-prep-docs');

    // Rerender with done state
    rerender(
      <TeachingStudio
        languageCode="en"
        progressByFieldId={{ 'sbi-prep-docs': 'done' }}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );

    expect(screen.getByRole('button', { name: /Marked as done/i })).toBeTruthy();
    expect(screen.getByText('1 of 30 fields completed')).toBeTruthy();
  });

  it('renders correctly in all 5 languages with matching native companions', () => {
    const handleToggleDone = vi.fn();
    const handleFinish = vi.fn();

    // Tamil -> Thunai
    const { unmount: unmountTa } = render(
      <TeachingStudio
        languageCode="ta"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );
    expect(screen.getByText('துணை')).toBeTruthy();
    unmountTa();

    // Hindi -> Mitra
    const { unmount: unmountHi } = render(
      <TeachingStudio
        languageCode="hi"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );
    expect(screen.getByText('Mitra')).toBeTruthy();
    expect(screen.getByText('मित्रा')).toBeTruthy();
    unmountHi();

    // Telugu -> Chinni
    const { unmount: unmountTe } = render(
      <TeachingStudio
        languageCode="te"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );
    expect(screen.getByText('Chinni')).toBeTruthy();
    expect(screen.getByText('చిన్ని')).toBeTruthy();
    unmountTe();

    // Kannada -> Sahaaya
    const { unmount: unmountKn } = render(
      <TeachingStudio
        languageCode="kn"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );
    expect(screen.getByText('Sahaaya')).toBeTruthy();
    expect(screen.getByText('ಸಹಾಯ')).toBeTruthy();
    unmountKn();
  });

  it('handles audio controls (play/pause, replay, mute)', () => {
    const handleToggleDone = vi.fn();
    const handleFinish = vi.fn();

    render(
      <TeachingStudio
        languageCode="en"
        progressByFieldId={{}}
        onToggleDone={handleToggleDone}
        onFinish={handleFinish}
      />,
    );

    const playBtn = screen.getByRole('button', { name: /Listen to guidance|Pause guidance/i });
    expect(playBtn).toBeTruthy();

    const replayBtn = screen.getByRole('button', { name: 'Replay audio' });
    fireEvent.click(replayBtn);

    const muteBtn = screen.getByRole('button', { name: /Mute companion audio/i });
    fireEvent.click(muteBtn);
    expect(screen.getByRole('button', { name: /Unmute companion audio/i })).toBeTruthy();
  });
});
