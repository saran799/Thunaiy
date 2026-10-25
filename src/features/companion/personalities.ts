import type { LanguageCode } from '../../domain/types';

export interface CompanionPersonality {
  languageCode: LanguageCode;
  name: string;
  nativeName: string;
  roleTitle: string;
  nativeRoleTitle: string;
  tagline: string;
  greeting: string;
  voicePitch: number;
  voiceRate: number;
  bcp47Lang: string;
  colors: {
    primary: string;       // Outer shell / body
    secondary: string;     // Ear caps / shoulders
    visor: string;         // Digital screen background
    ledAccent: string;     // Eyes, mouth, antenna tip
    chestBadge: string;    // Emblem fill
    glow: string;          // Antenna & thruster glow
  };
}

export const COMPANION_PERSONALITIES: Record<LanguageCode, CompanionPersonality> = {
  ta: {
    languageCode: 'ta',
    name: 'Thunai',
    nativeName: 'துணை',
    roleTitle: 'Banking Guide',
    nativeRoleTitle: 'வங்கி வழிகாட்டி',
    tagline: 'உங்கள் வழிகாட்டி. ஒவ்வொரு அடியிலும்.',
    greeting: 'வணக்கம்! நான் துணை. இந்த வங்கிப் படிவத்தை எளிதாக நிரப்ப உங்களுக்கு வழிகாட்டுகிறேன். படிவத்தில் சிறப்பிக்கப்பட்டுள்ள கட்டங்களைத் தட்டவும்.',
    voicePitch: 1.0,
    voiceRate: 0.95,
    bcp47Lang: 'ta-IN',
    colors: {
      primary: '#0B2545',      // Deep navy
      secondary: '#006874',    // Bank teal
      visor: '#04101E',        // Deep screen black
      ledAccent: '#00E5FF',    // Vivid cyan LED
      chestBadge: '#00C896',   // Emerald teal
      glow: 'rgba(0, 229, 255, 0.45)',
    },
  },
  en: {
    languageCode: 'en',
    name: 'Buddy',
    nativeName: 'Buddy',
    roleTitle: 'Banking Form Companion',
    nativeRoleTitle: 'Banking Companion',
    tagline: 'Your Guide. Every Step.',
    greeting: 'Hello! I am Buddy, your banking companion. Tap any highlighted box on your form and I will guide you through each field.',
    voicePitch: 1.0,
    voiceRate: 1.0,
    bcp47Lang: 'en-IN',
    colors: {
      primary: '#0F172A',      // Slate navy
      secondary: '#0284C7',    // Sky blue
      visor: '#030712',        // Midnight visor
      ledAccent: '#38BDF8',    // Bright electric cyan
      chestBadge: '#06B6D4',   // Teal cyan
      glow: 'rgba(56, 189, 248, 0.45)',
    },
  },
  hi: {
    languageCode: 'hi',
    name: 'Mitra',
    nativeName: 'मित्रा',
    roleTitle: 'Banking Companion',
    nativeRoleTitle: 'बैंकिंग साथी',
    tagline: 'आपका मार्गदर्शन, हर कदम पर।',
    greeting: 'नमस्ते! मैं मित्रा हूँ, आपका बैंकिंग साथी। फॉर्म में किसी भी हाइलाइट किए गए बॉक्स को छुएँ, मैं आपको हर जानकारी समझाऊँगा।',
    voicePitch: 1.0,
    voiceRate: 0.95,
    bcp47Lang: 'hi-IN',
    colors: {
      primary: '#1E1B4B',      // Indigo navy
      secondary: '#D97706',    // Saffron gold
      visor: '#0F0E2A',        // Dark indigo screen
      ledAccent: '#FBBF24',    // Warm golden amber LED
      chestBadge: '#F59E0B',   // Warm amber
      glow: 'rgba(251, 191, 36, 0.45)',
    },
  },
  te: {
    languageCode: 'te',
    name: 'Chinni',
    nativeName: 'చిన్ని',
    roleTitle: 'Banking Friend',
    nativeRoleTitle: 'బ్యాంకింగ్ నేస్తం',
    tagline: 'మీకు తోడుగా, ప్రతి అడుగులో.',
    greeting: 'నమస్కారం! నేను చిన్ని, మీ బ్యాంకింగ్ నేస్తం. ఫారమ్‌లో హైలైట్ చేసిన ఏ విభాగాన్నైనా తాకండి, వివరాలు ఎలా నింపాలో నేను వివరిస్తాను.',
    voicePitch: 1.05,
    voiceRate: 0.95,
    bcp47Lang: 'te-IN',
    colors: {
      primary: '#042F2E',      // Deep forest teal
      secondary: '#0D9488',    // Bright marine teal
      visor: '#021B1A',        // Dark teal visor
      ledAccent: '#2DD4BF',    // Vivid mint turquoise LED
      chestBadge: '#14B8A6',   // Mint teal
      glow: 'rgba(45, 212, 191, 0.45)',
    },
  },
  kn: {
    languageCode: 'kn',
    name: 'Sahaaya',
    nativeName: 'ಸಹಾಯ',
    roleTitle: 'Banking Guide',
    nativeRoleTitle: 'ಬ್ಯಾಂಕಿಂಗ್ ಮಾರ್ಗದರ್ಶಿ',
    tagline: 'ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶಿ, ಪ್ರತಿ ಹಂತದಲ್ಲೂ.',
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ಸಹಾಯ, ನಿಮ್ಮ ಬ್ಯಾಂಕಿಂಗ್ ಮಾರ್ಗದರ್ಶಿ. ಅರ್ಜಿಯಲ್ಲಿ ಹೈಲೈಟ್ ಮಾಡಲಾದ ಯಾವುದೇ ವಿಭಾಗವನ್ನು ಸ್ಪರ್ಶಿಸಿ, ಅದನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಲು ನಾನು ನೆರವಾಗುತ್ತೇನೆ.',
    voicePitch: 1.0,
    voiceRate: 0.95,
    bcp47Lang: 'kn-IN',
    colors: {
      primary: '#1E1B4B',      // Royal night blue
      secondary: '#4F46E5',    // Royal violet indigo
      visor: '#0B0A26',        // Deep screen
      ledAccent: '#818CF8',    // Iris lavender LED
      chestBadge: '#6366F1',   // Indigo star
      glow: 'rgba(129, 140, 248, 0.45)',
    },
  },
};

export function getCompanionPersonality(languageCode: LanguageCode): CompanionPersonality {
  return COMPANION_PERSONALITIES[languageCode] ?? COMPANION_PERSONALITIES.en;
}
