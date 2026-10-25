import { useEffect, useState } from 'react';
import StatePanel from '../../components/states/StatePanel';
import { useTranslation } from '../../i18n/I18nProvider';

interface Props {
  pdfUrl: string;
  title: string;
  filename?: string;
  zoom: number;
}

export default function PdfViewer({ pdfUrl, title, filename, zoom }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Verify PDF is reachable via HTTP request
    fetch(pdfUrl, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(`Failed to load PDF (${res.status} ${res.statusText})`);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, reloadKey]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-[24px]">
        <StatePanel variant="loading" title={t('viewer.loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-[24px]">
        <StatePanel
          variant="error"
          title={t('common.errorTitle')}
          body={t('viewer.pdfLoadError')}
          actionLabel={t('common.retry')}
          onAction={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="pdf-document-viewer"
      data-pdf-url={pdfUrl}
      className="mx-auto flex w-full max-w-[430px] flex-1 flex-col"
    >
      {filename && (
        <div className="flex items-center justify-between px-[4px] pb-[8px] text-[11px] text-muted">
          <span className="max-w-[250px] truncate font-mono text-[11px] tracking-tight text-ink" title={filename}>
            {filename}
          </span>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[4px] font-semibold text-teal hover:underline"
          >
            <span>{t('viewer.openInNewTab')}</span>
            <svg
              className="size-[12px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      )}

      <div className="relative flex-1 overflow-auto rounded-[12px] bg-white shadow-sheet border border-surface-3 min-h-[580px]">
        <div
          className="h-full w-full min-h-[580px] transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <object
            data={`${pdfUrl}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="h-full w-full min-h-[580px] rounded-[12px]"
            aria-label={title}
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              title={title}
              className="h-full w-full min-h-[580px] border-0 rounded-[12px]"
            />
          </object>
        </div>
      </div>
    </div>
  );
}
