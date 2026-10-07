import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import Cta from '../components/Cta';
import { useTranslation } from '../i18n/I18nProvider';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { isApiError } from '../services/errors';
import { E164_INDIA_PATTERN, NAME_PATTERN } from '../domain/validation';
import { savePendingChallenge } from '../state/otpChallenge';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppState();
  const services = useServices();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const digits = phone.replace(/\D/g, '');
    const nextErrors: { name?: string; phone?: string; form?: string } = {};
    if (!NAME_PATTERN.test(trimmedName)) nextErrors.name = t('register.nameError');
    if (!E164_INDIA_PATTERN.test(`+91${digits}`)) nextErrors.phone = t('register.mobileError');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const challenge = await services.auth.requestOtp({ name: trimmedName, phoneE164: `+91${digits}` });
      savePendingChallenge({
        challengeId: challenge.challengeId,
        name: trimmedName,
        phoneE164: `+91${digits}`,
        expiresAt: challenge.expiresAt,
        resendAvailableAt: challenge.resendAvailableAt,
        devCode: challenge.devCode,
      });
      navigate('/otp');
    } catch (error) {
      setErrors({ form: isApiError(error) ? error.message : t('common.errorBody') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <main className="flex flex-1 flex-col justify-between px-[16px] py-[32px]">
        <div>
          <div className="flex items-center gap-[12px] pb-[24px]">
            <FigmaImg id="50a7e" />
            <div>
              <p className="text-[15px] font-semibold uppercase leading-[20px] tracking-[0.375px] text-teal">{t('app.name')}</p>
              <p className="text-[12px] leading-[20px] text-subtle">{t('app.tagline')}</p>
            </div>
          </div>
          <h1 className="pb-[8px] text-[28px] font-semibold leading-[35px] text-ink-2">{t('register.title')}</h1>
          <p className="text-[16px] leading-[20px] text-subtle">{t('register.subtitle')}</p>

          <form className="flex flex-col gap-[20px] pt-[32px]" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="full-name" className="block pb-[8px] text-[14px] font-medium leading-[20px] text-ink-2">
                {t('register.nameLabel')}
              </label>
              <div className="rounded-[12px] border border-hairline bg-white p-px drop-shadow-card focus-within:border-teal">
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('register.namePlaceholder')}
                  aria-invalid={errors.name ? true : undefined}
                  className="h-[54px] w-full rounded-[12px] bg-transparent px-[16px] text-[15px] text-ink-2 outline-none placeholder:text-placeholder"
                />
              </div>
              {errors.name ? (
                <p className="pt-[6px] text-[12px] leading-[18px] tracking-[0.06px] text-danger">{errors.name}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="mobile" className="block pb-[8px] text-[14px] font-medium leading-[20px] text-ink-2">
                {t('register.mobileLabel')}
              </label>
              <div className="flex h-[54px] items-center overflow-clip rounded-[12px] border border-hairline bg-white p-px shadow-field focus-within:border-teal">
                <div className="flex h-full shrink-0 items-center gap-[6px] border-r border-hairline bg-[#f1f5f9] pl-[14px] pr-[15px]">
                  <span className="text-[14px] font-semibold leading-[20px] text-ink-2">+91</span>
                  <FigmaImg id="ee07b" />
                </div>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  maxLength={10}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder={t('register.mobilePlaceholder')}
                  aria-invalid={errors.phone ? true : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent px-[16px] text-[15px] text-ink-2 outline-none placeholder:text-placeholder"
                />
              </div>
              {errors.phone ? (
                <p className="pt-[6px] text-[12px] leading-[18px] tracking-[0.06px] text-danger">{errors.phone}</p>
              ) : null}
            </div>

            <div className="pt-[8px]">
              <Cta
                icon="77060"
                type="submit"
                disabled={submitting}
                className="h-[54px] gap-[8.01px] rounded-[14px] bg-navy text-[16px] font-semibold leading-[20px] text-white drop-shadow-card"
              >
                {submitting ? t('register.submitting') : t('register.submit')}
              </Cta>
              {errors.form ? (
                <p className="pt-[12px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-danger">{errors.form}</p>
              ) : null}
              <p className="pt-[12px] text-center text-[14px] leading-[20px] text-subtle">{t('register.otpHint')}</p>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-center gap-[6px] pb-[8px] pt-[64px]">
          <FigmaImg id="96933" />
          <p className="text-center text-[13px] leading-[20px] text-subtle">{t('register.trust')}</p>
        </div>
      </main>
    </Screen>
  );
}
