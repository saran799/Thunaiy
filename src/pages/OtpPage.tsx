import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import { useTranslation } from '../i18n/I18nProvider';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { isApiError } from '../services/errors';
import {
  clearPendingChallenge,
  formatIndianPhone,
  readPendingChallenge,
  savePendingChallenge,
} from '../state/otpChallenge';

const OTP_LENGTH = 6;

/**
 * OTP screen. The six boxes are the Figma boxes: same size, radius, colours and
 * typography — but they are real inputs now (the Figma baseline drew static
 * divs, so a code could not be entered at all).
 */
export default function OtpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, signIn } = useAppState();
  const services = useServices();

  const [challenge, setChallenge] = useState(() => readPendingChallenge());
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ''));
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  /* resend cooldown, driven by the challenge the backend issued */
  useEffect(() => {
    if (!challenge) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  const setDigitAt = useCallback((index: number, value: string) => {
    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }, []);

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length === 0) {
      setDigitAt(index, '');
      return;
    }
    if (clean.length > 1) {
      // Pasted or auto-filled code.
      const spread = clean.slice(0, OTP_LENGTH).split('');
      setDigits((current) => {
        const next = [...current];
        spread.forEach((digit, offset) => {
          const target = index + offset;
          if (target < OTP_LENGTH) next[target] = digit;
        });
        return next;
      });
      const nextIndex = Math.min(index + spread.length, OTP_LENGTH - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }
    setDigitAt(index, clean);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && digits[index] === '' && index > 0) {
      event.preventDefault();
      setDigitAt(index - 1, '');
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    if (!challenge) return;
    setError(null);
    if (!isComplete) {
      setError(t('otp.codeError'));
      return;
    }
    setVerifying(true);
    try {
      const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code });
      clearPendingChallenge();
      signIn({ token: session.token, expiresAt: session.expiresAt, user: session.user });
      await services.preferences
        .ensureForUser(session.token, {
          languageCode: state.preferences.languageCode,
          showFieldGuidance: state.preferences.showFieldGuidance,
        })
        .catch(() => undefined);
      navigate('/language');
    } catch (cause) {
      if (isApiError(cause)) {
        if (cause.code === 'otp_invalid') {
          setError(t('otp.wrongCode', { attempts: cause.attemptsRemaining ?? 0 }));
        } else if (cause.code === 'otp_expired') {
          setError(t('otp.expired'));
        } else if (cause.code === 'otp_attempts_exceeded') {
          setError(t('otp.attemptsExceeded'));
        } else {
          setError(cause.message);
        }
      } else {
        setError(t('common.errorBody'));
      }
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!challenge || secondsLeft > 0) return;
    setError(null);
    try {
      const next = await services.auth.resendOtp({ challengeId: challenge.challengeId });
      const updated = {
        ...challenge,
        challengeId: next.challengeId,
        expiresAt: next.expiresAt,
        resendAvailableAt: next.resendAvailableAt,
        devCode: next.devCode,
      };
      savePendingChallenge(updated);
      setChallenge(updated);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } catch (cause) {
      if (isApiError(cause) && cause.code === 'cooldown' && cause.retryAfterSeconds) {
        setSecondsLeft(cause.retryAfterSeconds);
        setError(null);
      } else {
        setError(isApiError(cause) ? cause.message : t('common.errorBody'));
      }
    }
  };

  const devCode = useMemo(() => (services.auth.kind === 'dev' ? challenge?.devCode : undefined), [services.auth.kind, challenge]);

  if (!challenge) return <Navigate to="/register" replace />;

  return (
    <Screen>
      <main className="px-[16px] pb-[24px]">
        <div className="flex h-[56px] items-center justify-between pt-[4px]">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => navigate('/register')}
            className="flex size-[40px] items-center justify-center rounded-full bg-surface"
          >
            <FigmaImg id="91d21" />
          </button>
          <div className="size-[40px]" aria-hidden="true" />
        </div>

        <div className="pt-[24px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">{t('otp.title')}</h1>
          <div className="flex flex-col gap-[6px] pt-[8px]">
            <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-muted">{t('otp.sentTo')}</p>
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">
                {formatIndianPhone(challenge.phoneE164)}
              </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-teal underline decoration-1"
              >
                {t('otp.changeNumber')}
              </button>
            </div>
          </div>

          <div className="mt-[24px] flex items-center gap-[10px] rounded-[8px] bg-surface p-[12px] drop-shadow-card">
            <div className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-cyan">
              <FigmaImg id="2bb9c" />
            </div>
            <p className="pr-[15.28px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">{t('otp.autofill')}</p>
          </div>

          <div className="flex flex-col items-center pt-[32px]">
            <div role="group" aria-label={t('otp.codeLabel')} className="flex w-full max-w-[358px] items-start justify-center gap-[8px]">
              {digits.map((digit, index) => {
                const isActive = focusIndex === index;
                const stateClass = digit
                  ? 'bg-white text-ink drop-shadow-card'
                  : isActive
                    ? 'bg-cyan shadow-cta'
                    : 'bg-white text-outline drop-shadow-card';
                return (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={OTP_LENGTH}
                    value={digit}
                    aria-label={`${t('otp.codeLabel')} ${index + 1}`}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onFocus={(event) => {
                      setFocusIndex(index);
                      event.target.select();
                    }}
                    onBlur={() => setFocusIndex(null)}
                    className={`h-[54px] min-w-px flex-1 rounded-[12px] text-center text-[22px] font-semibold tracking-[-0.33px] outline-none ${stateClass}`}
                  />
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0}
              className="mt-[24px] pt-[4px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal"
            >
              {secondsLeft > 0 ? t('otp.resendIn', { seconds: secondsLeft }) : t('otp.resend')}
            </button>

            {devCode ? (
              <div className="mt-[16px] flex items-center gap-[8px] rounded-[8px] bg-surface-2 px-[12px] py-[6px]">
                <span className="text-[11px] font-semibold uppercase leading-[14px] tracking-[0.44px] text-muted">
                  {t('otp.devTitle')}
                </span>
                <span className="font-mono text-[12px] font-bold leading-[16px] text-deep">{devCode}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center pt-[40px]">
            <button
              type="button"
              disabled={verifying || !isComplete}
              onClick={handleVerify}
              className="flex h-[54px] w-full items-center justify-center rounded-[12px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.35px] text-white opacity-75 shadow-cta"
            >
              <span>{t('otp.verify')}</span>
              <span className="pl-[8px]">
                <FigmaImg id="77060" />
              </span>
            </button>
            {error ? (
              <p className="pt-[12px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <div className="pt-[12px]">
              <div
                aria-hidden={!verifying}
                className={`flex items-center gap-[6px] rounded-full bg-surface-2 px-[12px] py-[4px] ${verifying ? 'opacity-100' : 'opacity-0'}`}
              >
                <FigmaImg id="94568" />
                <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">{t('otp.validating')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[8px] pb-[8px] pt-[64px]">
            <FigmaImg id="fc917" />
            <p className="text-center text-[12px] leading-[18px] text-muted">{t('register.trust')}</p>
          </div>
        </div>
      </main>
    </Screen>
  );
}
