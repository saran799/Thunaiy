import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '../../domain/types';
import type { FormFieldRect } from '../viewer/types';
import { getCompanionPersonality } from './personalities';
import CompanionCharacter from './CompanionCharacter';
import CompanionBubble from './CompanionBubble';
import { speechService, type SpeechPlaybackState } from '../../services/speech/speechService';

interface Props {
  selectedField: FormFieldRect | null;
  languageCode: LanguageCode;
  className?: string;
  autoSpeakOnSelect?: boolean;
}

export default function CompanionBot({
  selectedField,
  languageCode,
  className = '',
  autoSpeakOnSelect = true,
}: Props) {
  const personality = useMemo(() => getCompanionPersonality(languageCode), [languageCode]);

  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);

  // Check voice availability whenever language changes
  useEffect(() => {
    setHasVoice(speechService.hasVoiceForLanguage(languageCode));
  }, [languageCode]);

  // Subscribe to speech service events
  useEffect(() => {
    const unsubscribe = speechService.subscribe((event) => {
      setPlaybackState(event.state);
    });
    return () => {
      unsubscribe();
      speechService.cancel();
    };
  }, []);

  // Compute the current text to display and speak
  const currentText = useMemo(() => {
    if (selectedField?.guidance) {
      return selectedField.guidance.body;
    }
    if (selectedField) {
      return selectedField.label;
    }
    return personality.greeting;
  }, [selectedField, personality]);

  const speakCurrentText = useCallback(() => {
    if (isMuted || !currentText) return;

    speechService.speak({
      languageCode,
      text: currentText,
      rate: personality.voiceRate,
      pitch: personality.voicePitch,
    });
  }, [isMuted, currentText, languageCode, personality]);

  // When selected field changes, cancel outdated speech and optionally auto-speak new instruction
  useEffect(() => {
    speechService.cancel();

    if (selectedField && autoSpeakOnSelect && !isMuted) {
      // Small timeout allows UI transition before audio starts
      const timer = setTimeout(() => {
        speakCurrentText();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedField, autoSpeakOnSelect, isMuted, speakCurrentText]);

  // When language changes, cancel outdated speech
  useEffect(() => {
    speechService.cancel();
  }, [languageCode]);

  const handlePlay = () => {
    if (playbackState === 'paused') {
      speechService.resume();
    } else {
      speakCurrentText();
    }
  };

  const handlePause = () => {
    speechService.pause();
  };

  const handleReplay = () => {
    speechService.cancel();
    speakCurrentText();
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        speechService.cancel();
      }
      return next;
    });
  };

  // When a field is selected, GuidanceSheet is displayed with full guidance text.
  // In that state, the companion floats as an active talking avatar without duplicating the panel.
  const showBubble = !selectedField && !isMinimized;

  if (!showBubble) {
    return (
      <aside
        aria-label={`${personality.name} banking companion`}
        className={`fixed z-30 transition-all duration-200 ${
          selectedField ? 'bottom-[330px] right-[16px]' : 'bottom-[74px] right-[16px]'
        } ${className}`}
      >
        <button
          type="button"
          onClick={isMinimized ? () => setIsMinimized(false) : handlePlay}
          aria-label={
            isMinimized
              ? `Open ${personality.name} companion guidance`
              : playbackState === 'speaking'
                ? `Pause ${personality.name} audio`
                : `Listen with ${personality.name}`
          }
          className="group relative flex size-[56px] items-center justify-center rounded-full bg-white p-[3px] shadow-lg border-2 border-teal hover:scale-105 active:scale-95 transition-all"
        >
          <CompanionCharacter
            personality={personality}
            state={playbackState}
            size={48}
            isMuted={isMuted}
          />
          {playbackState === 'speaking' && (
            <span className="absolute -top-[2px] -right-[2px] flex size-[14px]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full size-[14px] bg-teal" />
            </span>
          )}
        </button>
      </aside>
    );
  }

  // Expanded companion view with character and bubble
  return (
    <aside
      aria-label={`${personality.name} banking companion`}
      className={`fixed bottom-[74px] right-[16px] z-30 flex items-end gap-[10px] max-w-[360px] pointer-events-auto ${className}`}
    >
      {/* Bot Avatar */}
      <div className="shrink-0 flex flex-col items-center">
        <button
          type="button"
          onClick={handlePlay}
          title={playbackState === 'speaking' ? 'Pause' : 'Listen to instructions'}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-full"
        >
          <CompanionCharacter
            personality={personality}
            state={playbackState}
            size={68}
            isMuted={isMuted}
            className="cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          />
        </button>
      </div>

      {/* Speech Bubble */}
      <div className="flex-1 min-w-0">
        <CompanionBubble
          personality={personality}
          state={playbackState}
          text={currentText}
          hasVoice={hasVoice}
          isMuted={isMuted}
          onPlay={handlePlay}
          onPause={handlePause}
          onReplay={handleReplay}
          onToggleMute={handleToggleMute}
          onMinimize={() => setIsMinimized(true)}
        />
      </div>
    </aside>
  );
}
