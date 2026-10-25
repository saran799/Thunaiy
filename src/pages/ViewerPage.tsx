import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import ProfileButton from '../components/ProfileButton';
import StatePanel from '../components/states/StatePanel';
import FormViewer from '../features/viewer/FormViewer';
import PdfViewer from '../features/viewer/PdfViewer';
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
import { getBankPdf } from '../config/bankPdfs';
import CompanionBot from '../features/companion/CompanionBot';
import TeachingStudio from '../features/teaching/TeachingStudio';

export default function ViewerPage({
  backRoute = '/purpose',
  completeRoute = '/complete',
  errorRoute = '/form',
}: {
  backRoute?: string;
  completeRoute?: string;
  errorRoute?: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, languageCode } = useTranslation();
  const { state, openSavedForm } = useAppState();
  const services = useServices();
  const { zoom, percent, canZoomIn, canZoomOut, zoomIn, zoomOut, fit } = useViewerZoom();

  const { bankId, bankFormId, purposeId, formVersionId, savedFormId } = state.selections;
  const session = state.session;

  /**
   * Selection bundle: bankId and bankFormId are required to open the viewer.
   */
  const selectionIds = useMemo(
    () => (bankId && bankFormId ? { bankId, bankFormId, purposeId: purposeId ?? null, formVersionId: formVersionId ?? null } : null),
    [bankId, bankFormId, purposeId, formVersionId],
  );
  const guidanceEnabled = state.preferences.showFieldGuidance;

  const [progressByFieldId, setProgressByFieldId] = useState<Record<string, 'pending' | 'done'>>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'guided' | 'teaching'>('guided');
  const pageRefs = useRef(new Map<number, HTMLDivElement>());

  const data = useAsync(async () => {
    if (!selectionIds) return null;
    const { bankId: bankIdValue, bankFormId: bankFormIdValue, purposeId: purposeIdValue, formVersionId: versionIdValue } =
      selectionIds;

    const bankPdf = getBankPdf(bankFormIdValue) ?? null;

    let resolvedVersionId = versionIdValue;
    if (!resolvedVersionId) {
      const v = await services.catalog.resolveVersion(bankFormIdValue, purposeIdValue ?? '');
      resolvedVersionId = v?.id ?? null;
    }

    const [detail, purposes] = await Promise.all([
      services.catalog.getBankFormDetail(bankFormIdValue),
      services.catalog.listPurposes(bankFormIdValue),
    ]);

    if (!detail) return { available: false as const };

    let bundle = null;
    let integrityFailed = false;

    if (resolvedVersionId && purposeIdValue) {
      const formBundle = await services.forms.getFormBundle({
        versionId: resolvedVersionId,
        purposeId: purposeIdValue,
        languageCode,
      });

      if (formBundle) {
        const actualArtworkHash = await import('../features/viewer/verifyArtwork').then((m) => m.computeArtworkHash());
        if (formBundle.version.artworkHash !== actualArtworkHash) {
          console.error(`Integrity check failed: expected ${formBundle.version.artworkHash}, got ${actualArtworkHash}`);
          integrityFailed = true;
        } else {
          const { artworkRegistry } = await import('../features/viewer/artwork');
          const hasMissingArtwork = formBundle.pages.some((p) => !artworkRegistry[p.artwork]);
          if (hasMissingArtwork) {
            console.error('Integrity check failed: missing artwork component for pages');
            integrityFailed = true;
          } else {
            bundle = formBundle;
          }
        }
      } else {
        // Version is unknown or has no bundle for the requested purpose
        return { available: false as const };
      }
    }

    if (integrityFailed) {
      return { available: false as const, integrityFailed: true };
    }

    if (!bundle && !bankPdf) {
      return { available: false as const };
    }

    let savedForm = null;
    let progressRows: import('../domain/types').FieldProgress[] = [];

    if (session && resolvedVersionId && purposeIdValue) {
      savedForm = await services.savedForms.startOrResume({
        token: session.token,
        bankId: bankIdValue,
        bankFormId: bankFormIdValue,
        formVersionId: resolvedVersionId,
        purposeId: purposeIdValue,
      });
      progressRows = await services.savedForms.listFieldProgress(session.token, savedForm.id);
    }

    return {
      available: true as const,
      detail,
      purpose: purposes.find((candidate) => candidate.id === purposeIdValue) ?? null,
      bundle,
      bankPdf,
      savedForm,
      progressRows,
    };
  }, [services, session, selectionIds, languageCode]);

  const loaded = data.data;

  // Sync mode based on data and query parameters
  useEffect(() => {
    if (!loaded?.available) return;
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'teaching') {
      setViewMode('teaching');
    } else if (requestedMode === 'pdf' || !loaded.bundle) {
      setViewMode('pdf');
    } else if (loaded.bundle) {
      setViewMode('guided');
    }
  }, [loaded, searchParams]);

  /* keep the app state pointing at the saved form this viewer session writes to */
  useEffect(() => {
    if (!loaded?.available || !loaded.savedForm) return;
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
    if (!loaded?.available || !loaded.bundle || !selectionIds) return null;
    return resolveFormDocument({
      bundle: loaded.bundle,
      purposeId: selectionIds.purposeId ?? '',
      bankId: selectionIds.bankId,
      bankName: loaded.detail.bank.name,
      formTypeId: loaded.detail.formType.id,
      formTitleKey: loaded.detail.formType.titleKey,
      purposeLabelKey: loaded.purpose?.labelKey ?? '',
      purposeShortLabelKey: loaded.purpose?.shortLabelKey ?? '',
      progressByFieldId,
      translate: (key: string) => t(key as TranslationKey),
      pdfUrl: loaded.bankPdf?.publicUrl,
      filename: loaded.bankPdf?.filename,
    });
  }, [loaded, selectionIds, progressByFieldId, t]);

  const registerPageRef = useCallback((page: number, element: HTMLDivElement | null) => {
    if (element) pageRefs.current.set(page, element);
    else pageRefs.current.delete(page);
  }, []);

  /* track which page is on screen so the header pill is truthful */
  useEffect(() => {
    if (!document || document.pages.length === 0 || viewMode !== 'guided') return;
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
  }, [document, viewMode]);

  const goToNextPage = () => {
    if (!document) return;
    const next = currentPage >= document.pages.length ? 1 : currentPage + 1;
    pageRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(next);
  };

  const selectedField: FormFieldRect | null =
    viewMode === 'guided' && document ? document.fields.find((field) => field.id === selectedFieldId) ?? null : null;

  const handleToggleDone = async (field: FormFieldRect) => {
    if (!loaded?.available) return;
    setSheetError(null);
    setSavingProgress(true);
    try {
      const newState = field.progress === 'done' ? 'pending' : 'done';
      if (session && loaded.savedForm) {
        const rows = await services.savedForms.setFieldProgress({
          token: session.token,
          savedFormId: loaded.savedForm.id,
          fieldId: field.id,
          state: newState,
        });
        setProgressByFieldId(progressMap(rows));
      } else {
        // Assist mode: local only
        setProgressByFieldId((prev) => ({ ...prev, [field.id]: newState }));
      }
    } catch (error) {
      setSheetError(isApiError(error) ? error.message : t('common.errorBody'));
    } finally {
      setSavingProgress(false);
    }
  };

  const handleFinish = async () => {
    if (!loaded?.available) return;
    try {
      if (session && loaded.savedForm) {
        await services.savedForms.complete(session.token, loaded.savedForm.id);
      }
      navigate(completeRoute);
    } catch (error) {
      setSheetError(isApiError(error) ? error.message : t('common.errorBody'));
    }
  };

  if (!selectionIds) return <Navigate to={errorRoute} replace />;

  const formTitle = loaded?.detail
    ? t(loaded.detail.formType.titleKey as TranslationKey)
    : document
      ? t(document.formTitleKey as TranslationKey)
      : '';

  const headerTitle =
    viewMode === 'guided' && document
      ? t('viewer.titleWithPage', { form: formTitle, page: currentPage })
      : formTitle || t('common.loading');

  const handleBack = () => {
    if (backRoute && backRoute !== '/purpose') {
      navigate(backRoute);
    } else if (selectionIds?.purposeId) {
      navigate('/purpose');
    } else {
      navigate('/form');
    }
  };

  return (
    <Screen className={`pt-[56px] ${viewMode === 'teaching' ? '!max-w-none md:!max-w-7xl' : ''}`}>
      <header className={`fixed inset-x-0 top-0 z-20 mx-auto w-full ${viewMode === 'teaching' ? 'max-w-7xl' : 'max-w-[430px]'} bg-[rgba(247,249,255,0.8)] shadow-header backdrop-blur-[12px]`}>
        <div className="flex h-[56px] items-center justify-between px-[12px]">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={handleBack}
            className="flex size-[44px] items-center justify-center rounded-full text-deep transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal active:scale-95"
          >
            <FigmaImg id="ff924" />
          </button>
          <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-deep">
            {headerTitle}
          </h1>
          <div className="flex items-center gap-[8px]">
            {viewMode === 'guided' && document ? (
              <button
                type="button"
                aria-label={t('viewer.pageIndicatorAria', {
                  next: currentPage >= document.pages.length ? 1 : currentPage + 1,
                  total: document.pages.length,
                })}
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

      <main className={`flex flex-1 flex-col ${selectedField && viewMode !== 'teaching' ? 'pb-[380px]' : 'pb-[96px]'}`}>
        {/* Toggle between Teaching Studio, Original PDF and Guidance when available */}
        {loaded?.available ? (
          <div className="z-[2] flex justify-center pb-[6px] pt-[2px]">
            <div className="inline-flex rounded-full bg-surface-2 p-[2px] shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('teaching')}
                className={`rounded-full px-[12px] py-[4px] text-[12px] font-semibold transition-colors ${
                  viewMode === 'teaching' ? 'bg-teal text-white shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                Teaching Studio
              </button>
              {loaded.bundle && (
                <button
                  type="button"
                  onClick={() => setViewMode('guided')}
                  className={`rounded-full px-[12px] py-[4px] text-[12px] font-semibold transition-colors ${
                    viewMode === 'guided' ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t('viewer.fieldGuidance')}
                </button>
              )}
              {loaded.bankPdf && (
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`rounded-full px-[12px] py-[4px] text-[12px] font-semibold transition-colors ${
                    viewMode === 'pdf' ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t('viewer.originalPdf')}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {viewMode === 'guided' && document ? (
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
              title={
                loaded.integrityFailed
                  ? t('viewer.verificationFailedTitle' as any) || 'Verification Warning'
                  : t('viewer.unavailableTitle')
              }
              body={
                loaded.integrityFailed
                  ? t('viewer.verificationFailedBody' as any) ||
                    'The form artwork failed technical integrity verification.'
                  : t('viewer.unavailableBody')
              }
              actionLabel={t('viewer.unavailableAction')}
              onAction={() => navigate(errorRoute)}
              icon="f39b5"
            />
          ) : null}

          {/* Render Teaching Studio when in teaching mode */}
          {loaded?.available && viewMode === 'teaching' && (
            <TeachingStudio
              pdfUrl={loaded.bankPdf?.publicUrl}
              languageCode={languageCode}
              progressByFieldId={progressByFieldId}
              onToggleDone={async (fieldId) => {
                const newState = progressByFieldId[fieldId] === 'done' ? 'pending' : 'done';
                if (session && loaded.savedForm) {
                  try {
                    const rows = await services.savedForms.setFieldProgress({
                      token: session.token,
                      savedFormId: loaded.savedForm.id,
                      fieldId,
                      state: newState,
                    });
                    setProgressByFieldId(progressMap(rows));
                  } catch {
                    setProgressByFieldId((prev) => ({ ...prev, [fieldId]: newState }));
                  }
                } else {
                  setProgressByFieldId((prev) => ({ ...prev, [fieldId]: newState }));
                }
              }}
              onFinish={handleFinish}
            />
          )}

          {/* Render PDF Viewer when in PDF mode */}
          {loaded?.available && viewMode === 'pdf' && loaded.bankPdf ? (
            <PdfViewer
              pdfUrl={loaded.bankPdf.publicUrl}
              title={formTitle}
              filename={loaded.bankPdf.filename}
              zoom={zoom}
            />
          ) : null}

          {/* Render Guided Form Viewer when in guided mode */}
          {loaded?.available && viewMode === 'guided' && document ? (
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

      {loaded?.available && viewMode !== 'teaching' ? (
        <CompanionBot
          selectedField={selectedField}
          languageCode={languageCode}
          className={selectedField ? 'bottom-[330px]' : 'bottom-[74px]'}
        />
      ) : null}

      {viewMode !== 'teaching' && (
        <ViewerControls
          percent={percent}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          t={t}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFit={fit}
        />
      )}

      {viewMode !== 'teaching' && selectedField && document ? (
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
        <p
          className="fixed inset-x-0 bottom-[86px] z-30 mx-auto max-w-[430px] px-[24px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-danger"
          role="alert"
        >
          {sheetError}
        </p>
      ) : null}
    </Screen>
  );
}
