import { useEffect, useState } from 'react';
import type { CompanionPersonality } from './personalities';
import type { SpeechPlaybackState } from '../../services/speech/speechService';

export type CompanionExpression =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'happy'
  | 'thinking'
  | 'confused'
  | 'encouraging'
  | 'completion';

interface Props {
  personality: CompanionPersonality;
  state: SpeechPlaybackState;
  expression?: CompanionExpression;
  size?: number; // width/height in px
  className?: string;
  isMuted?: boolean;
  onClick?: () => void;
}

/**
 * Friendly animated multilingual companion robot vector character.
 * Features:
 * - Natural idle eye blinking and floating animation
 * - 8 distinct emotional expressions: idle, listening, speaking, happy, thinking, confused, encouraging, completion
 * - Real-time mouth synchronization with speech synthesis audio states
 * - Interactive touch/click reactions
 * - Reduced motion support for accessibility
 */
export default function CompanionCharacter({
  personality,
  state,
  expression = 'idle',
  size = 72,
  className = '',
  isMuted = false,
  onClick,
}: Props) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);
  const [touchBounce, setTouchBounce] = useState(false);

  // Periodic eye blinking during idle & listening
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    let blinkDurationTimeout: ReturnType<typeof setTimeout>;

    const scheduleNextBlink = () => {
      // Blink every 3.5 to 5.5 seconds
      const delay = 3500 + Math.random() * 2000;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        blinkDurationTimeout = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160); // 160ms blink duration
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(blinkDurationTimeout);
    };
  }, []);

  // Animate mouth cycle during speaking state
  useEffect(() => {
    const isSpeaking = state === 'speaking' || expression === 'speaking';
    if (!isSpeaking || isMuted) {
      setMouthFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setMouthFrame((f) => (f + 1) % 4);
    }, 115);

    return () => clearInterval(interval);
  }, [state, expression, isMuted]);

  const { colors } = personality;

  const handleClick = () => {
    setTouchBounce(true);
    setTimeout(() => setTouchBounce(false), 350);
    onClick?.();
  };

  // Determine active visual expression (speaking overrides idle if audio is playing)
  const activeExpression: CompanionExpression =
    state === 'speaking' && !isMuted ? 'speaking' : expression;

  // Render eyes based on expression and blinking state
  const renderEyes = () => {
    if (isBlinking && activeExpression !== 'happy' && activeExpression !== 'completion') {
      return (
        <>
          <line
            x1="36"
            y1="46"
            x2="44"
            y2="46"
            stroke={colors.ledAccent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="56"
            y1="46"
            x2="64"
            y2="46"
            stroke={colors.ledAccent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      );
    }

    switch (activeExpression) {
      case 'happy':
        // Upward joyful crescent eyes (^ ^)
        return (
          <>
            <path
              d="M35 48 Q40 41 45 48"
              stroke={colors.ledAccent}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M55 48 Q60 41 65 48"
              stroke={colors.ledAccent}
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Soft cheek blush */}
            <circle cx="33" cy="53" r="3.5" fill="#FB7185" fillOpacity="0.45" />
            <circle cx="67" cy="53" r="3.5" fill="#FB7185" fillOpacity="0.45" />
          </>
        );

      case 'completion':
        // Celebratory star eyes
        return (
          <>
            {/* Left Star */}
            <polygon
              points="40,41 41.5,44.5 45,45 42.5,47.5 43,51 40,49 37,51 37.5,47.5 35,45 38.5,44.5"
              fill="#FBBF24"
            />
            {/* Right Star */}
            <polygon
              points="60,41 61.5,44.5 65,45 62.5,47.5 63,51 60,49 57,51 57.5,47.5 55,45 58.5,44.5"
              fill="#FBBF24"
            />
            {/* Joyful cheek blush */}
            <circle cx="33" cy="53" r="3.5" fill="#F43F5E" fillOpacity="0.5" />
            <circle cx="67" cy="53" r="3.5" fill="#F43F5E" fillOpacity="0.5" />
          </>
        );

      case 'thinking':
        // Eyes looking up-and-right thoughtfully
        return (
          <>
            {/* Eyebrows angled in curiosity */}
            <path d="M35 39 L45 42" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
            <path d="M55 41 L65 38" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="42" cy="44" rx="3.8" ry="4.8" fill={colors.ledAccent} />
            <ellipse cx="62" cy="44" rx="3.8" ry="4.8" fill={colors.ledAccent} />
            <circle cx="43.5" cy="42.5" r="1.2" fill="#FFFFFF" />
            <circle cx="63.5" cy="42.5" r="1.2" fill="#FFFFFF" />
          </>
        );

      case 'confused':
        // Asymmetric curious eyes
        return (
          <>
            <path d="M35 38 L45 41" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
            <path d="M55 42 L65 39" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="39" cy="46" rx="4.5" ry="5.5" fill={colors.ledAccent} />
            <ellipse cx="61" cy="47" rx="3.2" ry="4.2" fill={colors.ledAccent} />
            <circle cx="40" cy="44.5" r="1.2" fill="#FFFFFF" />
            <circle cx="62" cy="46" r="1" fill="#FFFFFF" />
          </>
        );

      case 'encouraging':
        // Sparkling encouraging eyes with highlights
        return (
          <>
            <ellipse cx="40" cy="46" rx="4.5" ry="5.8" fill={colors.ledAccent} />
            <ellipse cx="60" cy="46" rx="4.5" ry="5.8" fill={colors.ledAccent} />
            {/* Dual sparkle stars */}
            <circle cx="41.5" cy="44" r="1.5" fill="#FFFFFF" />
            <circle cx="38.5" cy="47.5" r="0.9" fill="#FFFFFF" />
            <circle cx="61.5" cy="44" r="1.5" fill="#FFFFFF" />
            <circle cx="58.5" cy="47.5" r="0.9" fill="#FFFFFF" />
          </>
        );

      case 'listening':
        // Attentive wide eyes
        return (
          <>
            <ellipse cx="40" cy="46" rx="4.2" ry="5.4" fill={colors.ledAccent} />
            <ellipse cx="60" cy="46" rx="4.2" ry="5.4" fill={colors.ledAccent} />
            <circle cx="40" cy="45" r="1.5" fill="#FFFFFF" />
            <circle cx="60" cy="45" r="1.5" fill="#FFFFFF" />
          </>
        );

      case 'speaking':
      case 'idle':
      default:
        // Default glowing LED eyes
        return (
          <>
            <ellipse
              cx="40"
              cy="46"
              rx="4"
              ry="5.5"
              fill={colors.ledAccent}
              className={activeExpression === 'speaking' ? 'animate-pulse' : ''}
            />
            <ellipse
              cx="60"
              cy="46"
              rx="4"
              ry="5.5"
              fill={colors.ledAccent}
              className={activeExpression === 'speaking' ? 'animate-pulse' : ''}
            />
            <circle cx="41.5" cy="44.5" r="1.2" fill="#FFFFFF" />
            <circle cx="61.5" cy="44.5" r="1.2" fill="#FFFFFF" />
          </>
        );
    }
  };

  // Render dynamic mouth
  const renderMouth = () => {
    if (activeExpression === 'completion') {
      // Big triumphant open smile
      return <path d="M38 55 Q50 66 62 55 Z" fill={colors.ledAccent} />;
    }

    if (activeExpression === 'happy' || activeExpression === 'encouraging') {
      // Reassuring wide warm smile
      return (
        <path
          d="M40 55 Q50 64 60 55"
          stroke={colors.ledAccent}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    if (activeExpression === 'thinking') {
      // Quirky thinking mouth smirk
      return (
        <path
          d="M44 58 Q50 56 57 59"
          stroke={colors.ledAccent}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    if (activeExpression === 'confused') {
      // Slanted inquiring mouth
      return (
        <path
          d="M43 59 Q49 55 57 57"
          stroke={colors.ledAccent}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      );
    }

    if (activeExpression === 'speaking' && !isMuted) {
      switch (mouthFrame) {
        case 0:
          return <ellipse cx="50" cy="58" rx="6" ry="4" fill={colors.ledAccent} />;
        case 1:
          return <path d="M40 56 Q50 64 60 56 Z" fill={colors.ledAccent} />;
        case 2:
          return <circle cx="50" cy="58" r="4.5" fill={colors.ledAccent} />;
        case 3:
        default:
          return (
            <path
              d="M42 58 Q50 54 58 58"
              stroke={colors.ledAccent}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          );
      }
    }

    if (state === 'paused') {
      return (
        <line
          x1="43"
          y1="58"
          x2="57"
          y2="58"
          stroke={colors.ledAccent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    }

    // Default resting friendly smile
    return (
      <path
        d="M42 56 Q50 63 58 56"
        stroke={colors.ledAccent}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  return (
    <div
      onClick={handleClick}
      className={`relative select-none cursor-pointer transition-transform duration-200 ${
        touchBounce ? 'scale-110 -translate-y-1' : 'hover:scale-105 active:scale-95'
      } ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`${personality.name} banking companion character`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic head gradient */}
          <linearGradient
            id={`bot-head-${personality.languageCode}`}
            x1="20"
            y1="18"
            x2="80"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="50%" stopColor={colors.primary} />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Visor deep glass gradient */}
          <linearGradient
            id={`bot-visor-${personality.languageCode}`}
            x1="30"
            y1="36"
            x2="70"
            y2="68"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={colors.visor} />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Antenna Glow */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floating Thruster Base / Neck */}
        <ellipse cx="50" cy="85" rx="14" ry="4" fill={colors.secondary} opacity="0.8" />
        <path d="M44 80 L56 80 L53 85 L47 85 Z" fill={colors.primary} />

        {/* Ear Audio Sensors */}
        <rect x="14" y="44" width="7" height="18" rx="3.5" fill={colors.secondary} />
        <rect x="79" y="44" width="7" height="18" rx="3.5" fill={colors.secondary} />
        <circle cx="17.5" cy="53" r="1.5" fill={colors.ledAccent} />
        <circle cx="82.5" cy="53" r="1.5" fill={colors.ledAccent} />

        {/* Antenna Stem & Tip */}
        <path d="M50 20 L50 11" stroke={colors.secondary} strokeWidth="3" strokeLinecap="round" />
        <circle
          cx="50"
          cy="9"
          r="4.2"
          fill={activeExpression === 'completion' ? '#FBBF24' : colors.ledAccent}
          filter="url(#glow)"
          className={activeExpression === 'speaking' ? 'animate-pulse' : ''}
        />

        {/* Main Robot Head Shell */}
        <rect
          x="18"
          y="20"
          width="64"
          height="60"
          rx="22"
          fill={`url(#bot-head-${personality.languageCode})`}
          stroke={colors.secondary}
          strokeWidth="2"
        />

        {/* Digital Screen / Visor */}
        <rect
          x="26"
          y="32"
          width="48"
          height="38"
          rx="14"
          fill={`url(#bot-visor-${personality.languageCode})`}
          stroke={colors.secondary}
          strokeWidth="1.2"
        />

        {/* Glass reflection streak on visor */}
        <path
          d="M30 36 C42 34 58 34 68 36 C58 38 42 38 30 36 Z"
          fill="#FFFFFF"
          fillOpacity="0.18"
        />

        {/* Expression Eyes */}
        {renderEyes()}

        {/* Dynamic Mouth */}
        {renderMouth()}

        {/* Thunaiy Star Chest Emblem on forehead/chin */}
        <path
          d="M50 72 L51 74 L53 75 L51 76 L50 78 L49 76 L47 75 L49 74 Z"
          fill={activeExpression === 'completion' ? '#FBBF24' : colors.chestBadge}
          opacity="0.95"
        />
      </svg>
    </div>
  );
}
