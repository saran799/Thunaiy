import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { BANK_PDFS, getBankPdfsForBank } from '../config/bankPdfs';
import { createTestServices } from '../test/fixtures';
import PdfViewer from '../features/viewer/PdfViewer';
import { initialAppState, type AppState } from '../state/appState';

declare const process: { cwd: () => string };
declare const Buffer: { alloc: (size: number) => { toString: (encoding: string) => string } };

describe('Bank PDF Integration', () => {
  describe('Step 1 & 2: Asset verification and mapping', () => {
    it('confirms every mapped PDF exists on disk in public/bank', () => {
      expect(BANK_PDFS.length).toBe(5);

      for (const item of BANK_PDFS) {
        const decodedPublicUrl = decodeURIComponent(item.publicUrl);
        const diskPath = path.join(process.cwd(), 'public', decodedPublicUrl.replace(/^\//, ''));
        expect(fs.existsSync(diskPath), `Missing file: ${diskPath}`).toBe(true);

        const stats = fs.statSync(diskPath);
        expect(stats.size).toBeGreaterThan(0);

        // Verify PDF signature (%PDF-)
        const fd = fs.openSync(diskPath, 'r');
        const buffer = Buffer.alloc(5);
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        expect(buffer.toString('utf-8')).toBe('%PDF-');
      }
    });

    it('maps every bank to only its actual forms in public/bank', () => {
      const sbiPdfs = getBankPdfsForBank('sbi');
      const hdfcPdfs = getBankPdfsForBank('hdfc');
      const bobPdfs = getBankPdfsForBank('bob');

      expect(sbiPdfs).toHaveLength(1);
      expect(sbiPdfs[0].filename).toBe('121120-Account Opening Form for Individuals.pdf');

      expect(hdfcPdfs).toHaveLength(2);
      expect(hdfcPdfs.map((f) => f.filename)).toEqual([
        'Account Opening Form - For Individuals ( for opening Regular Savings Account, Basic Savings Bank Deposit Account, Individual Current Account).pdf',
        'deposit-form.pdf',
      ]);

      expect(bobPdfs).toHaveLength(2);
      expect(bobPdfs.map((f) => f.filename)).toEqual([
        'Account-Opening-Form-for-Individuals-05-11.pdf',
        'Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf',
      ]);
    });
  });

  describe('Step 3: Selection flow and PDF opening', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('lists only forms belonging to selected bank in catalog service', async () => {
      const { services } = createTestServices();

      const bobForms = await services.catalog.listBankForms('bob');
      expect(bobForms.length).toBeGreaterThan(0);
      expect(bobForms.every((f) => f.bankFormId.startsWith('bob::'))).toBe(true);

      const aof = bobForms.find((f) => f.bankFormId === 'bob::account-opening');
      expect(aof?.pdfUrl).toBe('/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf');

      const fdr = bobForms.find((f) => f.bankFormId === 'bob::fixed-deposit');
      expect(fdr?.pdfUrl).toBe('/bank/bob/Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf');
    });

    it('opens the exact PDF when selecting a form', async () => {
      // Mock global fetch to return OK for the PDF url
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('non-existent')) {
          return { ok: false, status: 404, statusText: 'Not Found' };
        }
        return { ok: true, status: 200, statusText: 'OK' };
      }) as any;

      const { services } = createTestServices();
      const challenge = await services.auth.requestOtp({ name: 'Tester', phoneE164: '+919876543210' });
      const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

      const state: AppState = {
        ...initialAppState,
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
          user: session.user,
        },
        selections: {
          bankId: 'bob',
          bankFormId: 'bob::fixed-deposit',
          purposeId: null,
          formVersionId: null,
          savedFormId: null,
        },
      };

      render(
        <MemoryRouter initialEntries={['/viewer?mode=pdf']}>
          <AppProviders services={services} initialState={state} persist={false}>
            <App />
          </AppProviders>
        </MemoryRouter>,
      );

      const viewer = await screen.findByTestId('pdf-document-viewer');
      expect(viewer).toBeTruthy();
      expect(viewer.getAttribute('data-pdf-url')).toBe('/bank/bob/Bank-of-Baroda-FDR-term-fixed-deposit-english.pdf');
    });

    it('renders loading state and error state when PDF fetch fails', async () => {
      // Mock fetch failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      render(
        <MemoryRouter>
          <AppProviders persist={false}>
            <PdfViewer
              pdfUrl="/bank/invalid/non-existent.pdf"
              title="Test Form"
              filename="test.pdf"
              zoom={1}
            />
          </AppProviders>
        </MemoryRouter>,
      );

      // Error message should be rendered
      expect(await screen.findByText('Unable to load the PDF document. Please verify the file path.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    });

    it('supports zoom controls on the PDF document', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

      const { rerender } = render(
        <MemoryRouter>
          <AppProviders persist={false}>
            <PdfViewer
              pdfUrl="/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf"
              title="Bank of Baroda AOF"
              filename="Account-Opening-Form-for-Individuals-05-11.pdf"
              zoom={1.25}
            />
          </AppProviders>
        </MemoryRouter>,
      );

      const viewer = await screen.findByTestId('pdf-document-viewer');
      const innerContainer = viewer.querySelector('div[style*="scale(1.25)"]');
      expect(innerContainer).toBeTruthy();

      // Rerender with zoom 1.5
      rerender(
        <MemoryRouter>
          <AppProviders persist={false}>
            <PdfViewer
              pdfUrl="/bank/bob/Account-Opening-Form-for-Individuals-05-11.pdf"
              title="Bank of Baroda AOF"
              filename="Account-Opening-Form-for-Individuals-05-11.pdf"
              zoom={1.5}
            />
          </AppProviders>
        </MemoryRouter>,
      );

      const scaledContainer = viewer.querySelector('div[style*="scale(1.5)"]');
      expect(scaledContainer).toBeTruthy();
    });

    it('allows switching between Original PDF and Guidance when both exist', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

      const { services } = createTestServices();
      const challenge = await services.auth.requestOtp({ name: 'Tester', phoneE164: '+919876543210' });
      const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

      const state: AppState = {
        ...initialAppState,
        session: {
          token: session.token,
          expiresAt: session.expiresAt,
          user: session.user,
        },
        selections: {
          bankId: 'sbi',
          bankFormId: 'sbi::account-opening',
          purposeId: 'sbi::account-opening::open-new',
          formVersionId: 'sbi-aof-v1',
          savedFormId: null,
        },
      };

      render(
        <MemoryRouter initialEntries={['/viewer']}>
          <AppProviders services={services} initialState={state} persist={false}>
            <App />
          </AppProviders>
        </MemoryRouter>,
      );

      // Default guided view has the required fields count
      expect(await screen.findByText('6 required fields')).toBeTruthy();

      // Switch to Original PDF
      const pdfToggle = screen.getByRole('button', { name: 'Original PDF' });
      fireEvent.click(pdfToggle);

      // Original PDF viewer should now be visible
      const pdfViewer = await screen.findByTestId('pdf-document-viewer');
      expect(pdfViewer.getAttribute('data-pdf-url')).toBe('/bank/sbi/121120-Account%20Opening%20Form%20for%20Individuals.pdf');

      // Switch back to Guidance
      const guidanceToggle = screen.getByRole('button', { name: 'Field Guidance' });
      fireEvent.click(guidanceToggle);
      expect(await screen.findByText('6 required fields')).toBeTruthy();
    });
  });
});
