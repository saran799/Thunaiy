import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import ProfileButton from '../components/ProfileButton';
import StatePanel from '../components/states/StatePanel';
import FormViewer from '../features/viewer/FormViewer';
import ViewerControls from '../features/viewer/ViewerControls';
import GuidanceSheet from '../features/viewer/GuidanceSheet';
import { progressMap, resolveFormDocument } from '../features/viewer/resolve';
import type { FormFieldRect } from '../features/viewer/types';
import { useViewerZoom } from '../features/viewer/useViewerScale';
import { useTranslation } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { useAsync } from '../hooks/useAsync';
import { isApiError } from '../services/errors';
import { errorMessageKey } from '../services/errorMessages';

export default function ViewerPage() {
  const navigate = useNavigate();
  const { t, languageCode } = useTranslation();
  const { state, openSavedForm } = useAppState();
  const services = useServices();
  const { zoom, percent, canZoomIn, canZoomOut, zoomIn, zoomOut, fit } = useViewerZoom();

  const { bankId, bankFormId, purposeId, formVersionId, savedFormId } = state.selections;
  const session = state.session;
  /** Non-null selection bundle; the flow screens guarantee all four ids. */
  const selectionIds =
    bankId && bankFormId && purposeId && formVersionId ? { bankId, bankFormId, purposeId, formVersionId } : null;
  const guidanceEnabled = state.preferences.showFieldGuidance;

  const [progressByFieldId, setProgressByFieldId] = useState<Record<string, 'pending' | 'done'>>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());

  const data = useAsync(async () => {
    if (!session || !selectionIds) return null;
    const { bankId: bankIdValue, bankFormId: bankFormIdValue, purposeId: purposeIdValue, formVersionId: versionIdValue } =
      selectionIds;
    const [detail, purposes, bundle] = await Promise.all([
      services.catalog.getBankFormDetail(bankFormIdValue),
      services.catalog.listPurposes(bankFormIdValue),
      services.forms.getFormBundle({ versionId: versionIdValue, purposeId: purposeIdValue, languageCode }),
    ]);
    if (!detail || !bundle) return { available: false as const };

    const savedForm = await services.savedForms.startOrResume({
      token: session.token,
      bankId: bankIdValue,
      bankFormId: bankFormIdValue,
      formVersionId: versionIdValue,
      purposeId: purposeIdValue,
    });
    const progressRows = await services.savedForms.listFieldProgress(session.token, savedForm.id);
    return {
      available: true as const,
      detail,
      purpose: purposes.find((candidate) => candidate.id === purposeIdValue) ?? null,
      bundle,
      savedForm,
      progressRows,
    };
  }, [services, session, selectionIds, languageCode]);

  const loaded = data.data;

  /* keep the app state pointing at the saved form this viewer session writes to */
  useEffect(() => {
    if (!loaded?.available) return;
    if (savedFormId === loaded.savedForm.id) return;
    openSavedForm({
      savedFormId: loaded.savedForm.id,
      bankId: loaded.savedForm.bankId,
      bankFormId: loaded.savedForm.bankFormId,
      purposeId: loaded.savedForm.purposeId,
      formVersionId: loaded.savedForm.formVersionId,
    });
  }, [loaded, savedFormId, openSavedForm]);

  /* seed local progress from the backend once the form is loaded */
  useEffect(() => {
    if (!loaded?.available) return;
    setProgressByFieldId(progressMap(loaded.progressRows));
  }, [loaded]);

  const document = useMemo(() => {
    if (!loaded?.available || !selectionIds) return null;
    return resolveFormDocument({
      bundle: loaded.bundle,
      purposeId: selectionIds.purposeId,
      bankId: selectionIds.bankId,
      bankName: loaded.detail.bank.name,
      formTypeId: loaded.detail.formType.id,
      formTitleKey: loaded.detail.formType.titleKey,
      purposeLabelKey: loaded.purpose?.labelKey ?? '',
      purposeShortLabelKey: loaded.purpose?.shortLabelKey ?? '',
      progressByFieldId,
      translate: (key: string) => t(key as TranslationKey),
    });
  }, [loaded, selectionIds, progressByFieldId, t]);

  const registerPageRef = useCallback((page: number, element: HTMLDivElement | null) => {
    if (element) pageRefs.current.set(page, element);
    else pageRefs.current.delete(page);
  }, []);

  /* track which page is on screen so the header pill is truthful */
  useEffect(() => {
    if (!document || document.pages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.page));
        if (visible.length > 0) setCurrentPage(Math.min(...visible));
      },
      { rootMargin: '-56px 0px -55% 0px', threshold: 0 },
    );
    pageRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [document]);

  const goToNextPage = () => {
    if (!document) return;
    const next = currentPage >= document.pages.length ? 1 : currentPage + 1;
    pageRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(next);
  };

  const selectedField: FormFieldRect | null =
    document?.fields.find((field) => field.id === selectedFieldId) ?? null;

  const handleToggleDone = async (field: FormFieldRect) => {
    if (!session || !loaded?.available) return;
    setSheetError(null);
    setSavingProgress(true);
    try {
      const rows = await services.savedForms.setFieldProgress({
        token: session.token,
        savedFormId: loaded.savedForm.id,
        fieldId: field.id,
        state: field.progress === 'done' ? 'pending' : 'done',
      });
      setProgressByFieldId(progressMap(rows));
    } catch (error) {
      setSheetError(isApiError(error) ? error.message : t('common.errorBody'));
    } finally {
      setSavingProgress(false);
    }
  };

  const handleFinish = async () => {
    if (!session || !loaded?.available) return;
    try {
      await services.savedForms.complete(session.token, loaded.savedForm.id);
      navigate('/complete');
    } catch (error) {
      setSheetError(isApiError(error) ? error.message : t('common.errorBody'));
    }
  };

  if (!selectionIds) return <Navigate to="/bank" replace />;

  const headerTitle = document
    ? t('viewer.titleWithPage', { form: t(document.formTitleKey as TranslationKey), page: currentPage })
    : t('common.loading');

  return (
    <Screen className="pt-[56px]">
      <header className="fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[430px] bg-[rgba(247,249,255,0.8)] shadow-header backdrop-blur-[12px]">
        <div className="flex h-[56px] items-center justify-between px-[12px]">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={() => navigate('/purpose')}
            className="flex size-[44px] items-center justify-center rounded-full"
          >
            <FigmaImg id="ff924" />
          </button>
          <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-deep">
            {headerTitle}
          </h1>
          <div className="flex items-center gap-[8px]">
            {document ? (
              <button
                type="button"
                aria-label={t('viewer.pageIndicatorAria', { next: currentPage >= document.pages.length ? 1 : currentPage + 1, total: document.pages.length })}
                onClick={goToNextPage}
                className="rounded-full bg-surface-3 px-[8px] py-[4px] text-[11px] font-semibold leading-[14px] tracking-[0.275px] text-teal"
              >
                {t('viewer.pageIndicator', { page: currentPage, total: document.pages.length })}
              </button>
            ) : null}
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className={`flex flex-1 flex-col ${selectedField ? 'pb-[380px]' : 'pb-[96px]'}`}>
        {document ? (
          <div className="z-[2] flex justify-center px-[16px] py-[4px]">
            <div className="flex items-center gap-[4px] rounded-full bg-[rgba(255,255,255,0.95)] px-[16px] py-[4px] backdrop-blur-[6px]">
              <span className="size-[8px] shrink-0 rounded-full bg-teal" aria-hidden="true" />
              <p className="text-[11px] font-medium leading-[14px] tracking-[-0.275px] text-deep">
                {t('viewer.highlightLead')}
                <span className="font-semibold text-teal">
                  {t('viewer.requiredFields', { count: document.requiredCount })}
                </span>
                {t('viewer.forPurpose', { purpose: t(document.purposeShortLabelKey as TranslationKey) })}
              </p>
              <span className="pl-[4px] font-mono text-[11px] leading-[16.5px] text-outline">
                {t('viewer.pageShort', { page: currentPage })}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex-1 px-[12px] py-[8px]">
          {data.loading ? <StatePanel variant="loading" title={t('viewer.loading')} /> : null}

          {data.error ? (
            <StatePanel
              variant="error"
              title={t('common.errorTitle')}
              body={t(errorMessageKey(isApiError(data.error) ? data.error.code : undefined))}
              actionLabel={t('common.retry')}
              onAction={data.reload}
            />
          ) : null}

          {loaded && !loaded.available ? (
            <StatePanel
              variant="unavailable"
              title={t('viewer.unavailableTitle')}
              body={t('viewer.unavailableBody')}
              actionLabel={t('viewer.unavailableAction')}
              onAction={() => navigate('/form')}
              icon="f39b5"
            />
          ) : null}

          {document ? (
            <FormViewer
              document={document}
              zoom={zoom}
              selectedFieldId={selectedFieldId}
              fieldsInteractive={guidanceEnabled}
              describeField={(field) => t('viewer.fieldAria', { field: field.label })}
              onSelectField={(field) => {
                setSelectedFieldId(field.id);
                setSheetError(null);
              }}
              registerPageRef={registerPageRef}
            />
          ) : null}
        </div>
      </main>

      <ViewerControls
        percent={percent}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        t={t}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fit}
      />

      {selectedField && document ? (
        <GuidanceSheet
          field={selectedField}
          requiredCount={document.requiredCount}
          doneCount={document.doneCount}
          saving={savingProgress}
          t={t}
          onClose={() => setSelectedFieldId(null)}
          onToggleDone={handleToggleDone}
          onFinish={handleFinish}
        />
      ) : null}

      {sheetError ? (
        <p className="fixed inset-x-0 bottom-[86px] z-30 mx-auto max-w-[430px] px-[24px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-danger" role="alert">
          {sheetError}
        </p>
      ) : null}
    </Screen>
  );
}
