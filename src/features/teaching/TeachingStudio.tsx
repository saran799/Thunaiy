import { useState, useEffect, useMemo, useCallback } from 'react';
import type { LanguageCode } from '../../domain/types';
import type { TeachingFieldRecord } from './types';
import { SBI_SECTIONS, SBI_TEACHING_CATALOGUE } from './sbiTeachingCatalogue';
import FieldMagnifier from './FieldMagnifier';
import CompanionCharacter, { type CompanionExpression } from '../companion/CompanionCharacter';
import { getCompanionPersonality } from '../companion/personalities';
import { speechService, type SpeechPlaybackState } from '../../services/speech/speechService';
import PdfPageCanvas from '../viewer/PdfPageCanvas';

interface Props {
  pdfUrl?: string;
  languageCode: LanguageCode;
  progressByFieldId: Record<string, 'pending' | 'done'>;
  onToggleDone: (fieldId: string) => Promise<void> | void;
  onFinish: () => void;
  saving?: boolean;
  className?: string;
}

export default function TeachingStudio({
  pdfUrl = '/bank/sbi/121120-Account Opening Form for Individuals.pdf',
  languageCode,
  progressByFieldId,
  onToggleDone,
  onFinish,
  saving = false,
  className = '',
}: Props) {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [expression, setExpression] = useState<CompanionExpression>('idle');
  const [showFullPdfMobile, setShowFullPdfMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const personality = useMemo(() => getCompanionPersonality(languageCode), [languageCode]);
  const currentField: TeachingFieldRecord =
    SBI_TEACHING_CATALOGUE[currentFieldIndex] || SBI_TEACHING_CATALOGUE[0];

  const translation = currentField.translations[languageCode] || currentField.translations.en;
  const isDone = progressByFieldId[currentField.id] === 'done';

  const completedCount = useMemo(() => {
    return SBI_TEACHING_CATALOGUE.filter((f) => progressByFieldId[f.id] === 'done').length;
  }, [progressByFieldId]);

  const totalFields = SBI_TEACHING_CATALOGUE.length;
  const percentDone = Math.round((completedCount / totalFields) * 100);

  // Subscribe to speech service
  useEffect(() => {
    const unsubscribe = speechService.subscribe((event) => {
      setPlaybackState(event.state);
      if (event.state === 'speaking') {
        setExpression('speaking');
      } else if (event.state === 'idle' || event.state === 'paused') {
        setExpression('idle');
      }
    });
    return () => {
      unsubscribe();
      speechService.cancel();
    };
  }, []);

  // Speak the field instruction
  const speakCurrentField = useCallback(() => {
    if (isMuted || !translation.speechScript) return;
    speechService.cancel();
    speechService.speak({
      languageCode,
      text: translation.speechScript,
      rate: personality.voiceRate,
      pitch: personality.voicePitch,
    });
  }, [isMuted, translation, languageCode, personality]);

  // When active field or language changes: cancel previous speech and auto-speak new instruction
  useEffect(() => {
    speechService.cancel();
    setExpression('idle');

    if (!isMuted) {
      const timer = setTimeout(() => {
        speakCurrentField();
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [currentFieldIndex, languageCode, isMuted, speakCurrentField]);

  const handlePlayPause = () => {
    if (playbackState === 'speaking') {
      speechService.pause();
    } else if (playbackState === 'paused') {
      speechService.resume();
    } else {
      speakCurrentField();
    }
  };

  const handleReplay = () => {
    speechService.cancel();
    speakCurrentField();
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) speechService.cancel();
      return next;
    });
  };

  const handleNext = () => {
    if (currentFieldIndex < totalFields - 1) {
      setCurrentFieldIndex((prev) => prev + 1);
    } else {
      setExpression('completion');
    }
  };

  const handlePrev = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex((prev) => prev - 1);
    }
  };

  const handleToggleCurrentDone = async () => {
    // Show encouraging reaction
    setExpression('encouraging');
    await onToggleDone(currentField.id);
    setTimeout(() => {
      if (currentFieldIndex < totalFields - 1) {
        setExpression('happy');
      } else {
        setExpression('completion');
      }
    }, 450);
  };

  const handleCharacterClick = () => {
    setExpression('happy');
    if (!isMuted) {
      speechService.cancel();
      speechService.speak({
        languageCode,
        text: personality.greeting,
        rate: personality.voiceRate,
        pitch: personality.voicePitch,
      });
    }
    setTimeout(() => setExpression('idle'), 2500);
  };

  return (
    <div className={`flex flex-col w-full h-full max-w-7xl mx-auto ${className}`}>
      {/* Top Banner / Progress Indicator */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-surface-3 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex size-3 rounded-full bg-teal" aria-hidden="true" />
          <div>
            <h2 className="text-xs font-bold text-deep uppercase tracking-wider">
              {translation.sectionName}
            </h2>
            <p className="text-[11px] text-muted font-medium">
              Field {currentFieldIndex + 1} of {totalFields} •{' '}
              <span className="text-teal font-semibold">
                {currentField.page > 0 ? `Physical Form Page ${currentField.page}` : 'Checklist'}
              </span>
            </p>
          </div>
        </div>

        {/* Global Form Progress */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-semibold text-deep">
              {completedCount} of {totalFields} fields completed
            </span>
            <div className="h-2 w-36 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full bg-teal transition-all duration-300"
                style={{ width: `${percentDone}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFullPdfMobile((s) => !s)}
              className="md:hidden rounded-lg border border-teal/30 bg-teal/5 px-2.5 py-1 text-xs font-semibold text-teal hover:bg-teal/10"
            >
              {showFullPdfMobile ? 'Hide Full Sheet' : 'View Full Sheet'}
            </button>
            {completedCount >= 5 && (
              <button
                type="button"
                onClick={onFinish}
                className="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal/90 active:scale-95 transition-all"
              >
                Finish Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: 3-column on Desktop, Field-First on Mobile */}
      <div className="flex flex-1 flex-col md:flex-row min-h-0 overflow-hidden bg-bg">
        {/* Left Column (Desktop Only): Structured Field & Section Navigation */}
        <aside
          aria-label="Form Sections and Field Steps"
          className="hidden md:flex flex-col w-64 lg:w-72 border-r border-surface-3 bg-white overflow-y-auto shrink-0"
        >
          <div className="p-3 border-b border-surface-3 bg-surface-2/60">
            <h3 className="text-xs font-bold text-deep uppercase tracking-wider">
              Teaching Sequence
            </h3>
            <p className="text-[11px] text-muted">Step-by-step physical form guidance</p>
          </div>

          <nav className="flex-1 p-2 space-y-3">
            {SBI_SECTIONS.map((sec) => {
              const secFields = SBI_TEACHING_CATALOGUE.filter((f) => f.sectionId === sec.id);
              if (secFields.length === 0) return null;
              const secTitle = sec.titles[languageCode] || sec.titles.en;
              const secDoneCount = secFields.filter((f) => progressByFieldId[f.id] === 'done').length;

              return (
                <div key={sec.id} className="rounded-lg border border-surface-3 bg-surface-1/60 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-deep truncate">{secTitle}</span>
                    <span className="text-[10px] font-mono text-muted">
                      {secDoneCount}/{secFields.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {secFields.map((field) => {
                      const isSelected = field.id === currentField.id;
                      const fieldDone = progressByFieldId[field.id] === 'done';
                      const fIndex = SBI_TEACHING_CATALOGUE.findIndex((x) => x.id === field.id);

                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => setCurrentFieldIndex(fIndex)}
                          className={`flex items-center justify-between w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                            isSelected
                              ? 'bg-teal text-white font-semibold shadow-xs'
                              : 'text-ink hover:bg-surface-2'
                          }`}
                        >
                          <span className="truncate pr-2">
                            {fIndex + 1}. {field.translations[languageCode]?.title || field.label}
                          </span>
                          {fieldDone && (
                            <span className={isSelected ? 'text-white' : 'text-teal'}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Center Column: Original SBI PDF Viewer (Desktop or Mobile Overlay) */}
        <section
          aria-label="Official Bank PDF Document Viewer"
          className={`flex-1 flex-col overflow-auto bg-surface-2/70 p-3 md:p-6 items-center ${
            showFullPdfMobile ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Controls Bar */}
          <div className="flex items-center justify-between w-full max-w-[596px] mb-3 bg-white px-3 py-1.5 rounded-lg border border-surface-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-deep">
              <span>Official PDF • Page {currentField.page > 0 ? currentField.page : 1} of 9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.15))}
                className="size-6 flex items-center justify-center rounded bg-surface-2 text-xs font-bold text-deep"
              >
                -
              </button>
              <span className="text-[11px] font-mono text-muted">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="size-6 flex items-center justify-center rounded bg-surface-2 text-xs font-bold text-deep"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.0)}
                className="text-[11px] px-2 py-0.5 rounded bg-surface-2 text-muted hover:text-ink font-medium ml-1"
              >
                Fit
              </button>
            </div>
          </div>

          {/* PDF Page Canvas with Active Field Outline */}
          <div
            className="relative border border-surface-3 shadow-sheet rounded-[2px] bg-white transition-transform"
            style={{
              width: `${595.28 * zoomLevel}px`,
              height: `${841.89 * zoomLevel}px`,
            }}
          >
            <PdfPageCanvas
              pdfUrl={pdfUrl}
              pageNumber={currentField.page > 0 ? currentField.page : 1}
              width={595.28 * zoomLevel}
              height={841.89 * zoomLevel}
            />

            {/* Subtle focus box highlighting active field location on the original PDF */}
            {currentField.page > 0 && (
              <div
                className="absolute border-2 border-teal bg-teal/15 rounded-xs pointer-events-none transition-all duration-200 animate-pulse"
                style={{
                  left: `${currentField.bounds[0] * zoomLevel}px`,
                  top: `${currentField.bounds[1] * zoomLevel}px`,
                  width: `${currentField.bounds[2] * zoomLevel}px`,
                  height: `${currentField.bounds[3] * zoomLevel}px`,
                }}
              >
                <span className="absolute -top-4 left-0 bg-teal text-white text-[9px] font-bold px-1 rounded">
                  Active Field
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column / Mobile Main: Dedicated Field-Focus View & Teaching Console */}
        <section
          aria-label={`Field Guidance for ${currentField.label}`}
          role="dialog"
          aria-modal="false"
          className="flex-1 md:w-[420px] lg:w-[460px] md:max-w-[460px] flex flex-col border-l border-surface-3 bg-white overflow-y-auto shrink-0 shadow-md"
        >
          {/* Companion Character & Audio Player Header */}
          <div className="flex items-center gap-3 p-3.5 border-b border-surface-3 bg-gradient-to-r from-surface-2/80 to-surface-1">
            <div className="relative shrink-0">
              <CompanionCharacter
                personality={personality}
                state={playbackState}
                expression={expression}
                size={62}
                isMuted={isMuted}
                onClick={handleCharacterClick}
              />
              {playbackState === 'speaking' && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-teal" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-deep truncate">{personality.name}</h3>
                  <p className="text-[10px] text-muted truncate">{personality.nativeName}</p>
                </div>

                {/* Audio Controls Bar */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    aria-label={playbackState === 'speaking' ? 'Pause guidance' : 'Listen to guidance'}
                    className="flex size-7 items-center justify-center rounded-full bg-teal text-white shadow-xs hover:bg-teal/90 active:scale-95 transition-all"
                  >
                    {playbackState === 'speaking' ? '❚❚' : '▶'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReplay}
                    aria-label="Replay audio"
                    className="flex size-7 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-surface-3 active:scale-95"
                  >
                    ⟳
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={isMuted ? 'Unmute companion audio' : 'Mute companion audio'}
                    className="flex size-7 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-surface-3"
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>

              {/* Subtitles Banner */}
              <div className="mt-1.5 rounded-md bg-white/90 p-1.5 text-[11px] font-medium leading-tight text-ink border border-surface-3 shadow-2xs">
                <span className="text-teal font-semibold mr-1">“</span>
                {translation.speechScript}
                <span className="text-teal font-semibold ml-1">”</span>
              </div>
            </div>
          </div>

          {/* Dedicated Field Magnified Crop */}
          <div className="p-3 bg-surface-1/40 border-b border-surface-3">
            <FieldMagnifier
              pdfUrl={pdfUrl}
              pageNumber={currentField.page}
              bounds={currentField.bounds}
              label={currentField.label}
              example={translation.example}
            />
          </div>

          {/* Detailed Field Instructions & Form Context */}
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
            {/* Title & Status Badges */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    currentField.status === 'mandatory'
                      ? 'bg-danger/10 text-danger border border-danger/20'
                      : currentField.status === 'bank_use'
                        ? 'bg-muted/20 text-muted border border-muted/30'
                        : 'bg-teal/10 text-teal border border-teal/20'
                  }`}
                >
                  {currentField.status === 'mandatory'
                    ? 'Mandatory Field'
                    : currentField.status === 'bank_use'
                      ? 'Bank Staff Only'
                      : 'Optional / Choice'}
                </span>
                <span className="text-[11px] font-mono text-muted">
                  Page {currentField.page > 0 ? currentField.page : 'General'}
                </span>
              </div>
              <h1 className="text-sm font-bold text-deep leading-snug">{translation.title}</h1>
              <p className="text-xs font-mono text-muted mt-0.5">{currentField.label}</p>
            </div>

            {/* Plain-Language Explanation */}
            <div className="rounded-lg bg-surface-1 p-3 border border-surface-3">
              <h4 className="text-[11px] font-bold text-deep uppercase tracking-wider mb-1">
                Instructions for Physical Form:
              </h4>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-line">
                {translation.explanation}
              </p>
            </div>

            {/* Fictional Sample (Clearly Labeled) */}
            {translation.example && (
              <div className="rounded-lg border border-teal/20 bg-teal/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-teal uppercase tracking-wider">
                    Fictional Example (Do Not Copy Directly):
                  </span>
                  <span className="text-[10px] text-muted">Capital Letters</span>
                </div>
                <div className="font-mono text-xs font-bold text-deep tracking-wider bg-white px-2.5 py-1.5 rounded border border-teal/10">
                  {translation.example}
                </div>
              </div>
            )}

            {/* When to Leave Blank Note */}
            {translation.whenToLeaveBlank && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 p-3">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  When to Leave Blank:
                </span>
                <p className="text-xs text-amber-900 leading-normal">
                  {translation.whenToLeaveBlank}
                </p>
              </div>
            )}
          </div>

          {/* Accessible Action & Navigation Bar */}
          <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-surface-3 bg-white p-3 shadow-lg">
            {/* Mark Done Toggle */}
            <button
              type="button"
              onClick={handleToggleCurrentDone}
              disabled={saving}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                isDone
                  ? 'bg-teal/15 text-teal border border-teal/30 hover:bg-teal/20'
                  : 'bg-teal text-white hover:bg-teal/90'
              }`}
            >
              <span>{isDone ? '✓' : '○'}</span>
              <span>{isDone ? 'Marked as done' : 'Mark as done'}</span>
            </button>

            {/* Previous and Next Navigation */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentFieldIndex === 0}
                aria-label="Previous form field"
                className="flex-1 py-2 px-3 rounded-lg border border-surface-3 bg-surface-2 text-xs font-semibold text-deep hover:bg-surface-3 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                ← Previous
              </button>

              <span className="text-[11px] font-mono text-muted shrink-0 px-2">
                {currentFieldIndex + 1} / {totalFields}
              </span>

              {currentFieldIndex < totalFields - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next form field"
                  className="flex-1 py-2 px-3 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90 active:scale-95 transition-all"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFinish}
                  aria-label="Finish guidance"
                  className="flex-1 py-2 px-3 rounded-lg bg-teal text-white text-xs font-bold shadow-xs hover:bg-teal/90 active:scale-95 transition-all"
                >
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
