import type { CompanionPersonality } from './personalities';
import type { SpeechPlaybackState } from '../../services/speech/speechService';

interface Props {
  personality: CompanionPersonality;
  state: SpeechPlaybackState;
  text: string;
  fieldTitle?: string;
  docLabel?: string;
  hasVoice: boolean;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  onMinimize: () => void;
  className?: string;
}

export default function CompanionBubble({
  personality,
  state,
  text,
  fieldTitle,
  docLabel,
  hasVoice,
  isMuted,
  onPlay,
  onPause,
  onReplay,
  onToggleMute,
  onMinimize,
  className = '',
}: Props) {
  return (
    <div
      role="region"
      aria-label={`${personality.name} voice guidance`}
      className={`relative flex flex-col rounded-[16px] bg-white p-[14px] shadow-lg border border-teal/20 backdrop-blur-[12px] ${className}`}
    >
      {/* Speech bubble pointer arrow */}
      <div
        className="absolute -left-[8px] bottom-[24px] size-0 border-y-[8px] border-y-transparent border-r-[8px] border-r-white"
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-[6px] border-b border-surface-2">
        <div className="flex items-center gap-[6px] min-w-0">
          <span className="font-semibold text-[13px] leading-[18px] text-ink truncate">
            {personality.nativeName}
          </span>
          <span className="rounded-full bg-teal/10 px-[6px] py-[1px] text-[10px] font-medium text-teal">
            {personality.nativeRoleTitle}
          </span>
          {!hasVoice && (
            <span
              title="Voice not available on this device; showing verified text captions"
              className="rounded bg-surface-2 px-[5px] py-px text-[9.5px] font-medium text-muted"
            >
              Captions
            </span>
          )}
        </div>

        {/* Minimize button */}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize companion"
          className="size-[24px] flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Field title or Document Badge */}
      {(fieldTitle || docLabel) && (
        <div className="flex items-center gap-[6px] pt-[6px]">
          {docLabel && (
            <span className="rounded bg-navy/10 px-[6px] py-px text-[10px] font-semibold text-navy">
              {docLabel}
            </span>
          )}
          {fieldTitle && (
            <span className="text-[12px] font-bold text-teal truncate">
              {fieldTitle}
            </span>
          )}
        </div>
      )}

      {/* Subtitle text / Instruction body */}
      <p className="pt-[6px] text-[13px] leading-[19px] tracking-tight text-ink font-sans max-h-[140px] overflow-y-auto">
        {text}
      </p>

      {/* Controls toolbar */}
      <div className="flex items-center justify-between pt-[10px] mt-[4px] border-t border-surface-2">
        <div className="flex items-center gap-[6px]">
          {/* Play / Listen button */}
          {state === 'speaking' ? (
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause speech"
              className="flex items-center gap-[4px] rounded-full bg-navy px-[10px] py-[4px] text-[11px] font-semibold text-white shadow-sm hover:bg-navy/90 transition-all active:scale-95"
            >
              <svg className="size-[12px]" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              aria-label={state === 'paused' ? 'Resume speech' : 'Listen to instruction'}
              className="flex items-center gap-[4px] rounded-full bg-teal px-[10px] py-[4px] text-[11px] font-semibold text-white shadow-sm hover:bg-teal/90 transition-all active:scale-95"
            >
              <svg className="size-[12px]" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{state === 'paused' ? 'Resume' : 'Listen'}</span>
            </button>
          )}

          {/* Replay button */}
          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay instruction"
            className="flex size-[26px] items-center justify-center rounded-full text-muted hover:text-teal hover:bg-surface-2 transition-colors"
            title="Replay from start"
          >
            <svg className="size-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Mute / Unmute button */}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`flex size-[28px] items-center justify-center rounded-full transition-colors ${
            isMuted ? 'bg-danger/10 text-danger' : 'text-muted hover:text-ink hover:bg-surface-2'
          }`}
        >
          {isMuted ? (
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
              <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="size-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
