import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ViewerPage from '../pages/ViewerPage';
import { AppStateProvider } from '../state/AppStateContext';
import { ServicesProvider } from '../services/ServicesProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { MemoryRouter } from 'react-router-dom';
import { createTestServices } from '../test/fixtures';

describe('Viewer Integrity Checks', () => {
  const renderViewer = (services: any, stateSelections: any) => {
    return render(
      <MemoryRouter>
        <ServicesProvider value={services}>
          <AppStateProvider initialState={{ session: null, selections: stateSelections, preferences: { languageCode: 'en', showFieldGuidance: true } }}>
            <I18nProvider languageCode="en">
              <ViewerPage />
            </I18nProvider>
          </AppStateProvider>
        </ServicesProvider>
      </MemoryRouter>
    );
  };

  it('fails closed when hash mismatches', async () => {
    const { services } = createTestServices();
    
    vi.spyOn(services.forms, 'getFormBundle').mockImplementation(async (_params: any) => {
      // call the original by unstubbing temporarily, but actually we can just use the mock catalog
      // Wait, we don't need to call the original, we can just return a fake bundle.
      // But let's just return a static bundle that fails the hash.
      return {
        id: 'sbi::account-opening',
        version: { id: 'sbi-aof-v1', artworkHash: 'sha256:badhash' },
        pages: [{ page: 1, width: 100, height: 100, artwork: 'sbi-aof-v1-p1' }]
      } as any;
    });

    renderViewer(services, {
      bankId: 'sbi',
      bankFormId: 'sbi::account-opening',
      purposeId: 'sbi::account-opening::open-new',
      formVersionId: 'sbi-aof-v1'
    });

    expect(await screen.findByText('Verification Warning')).toBeTruthy();
    expect(await screen.findByText('The form artwork failed technical integrity verification.')).toBeTruthy();
  });

  it('fails closed when artwork is missing', async () => {
    const { services } = createTestServices();
    
    vi.spyOn(services.forms, 'getFormBundle').mockImplementation(async (_params: any) => {
      return {
        id: 'sbi::account-opening',
        version: { id: 'sbi-aof-v1', artworkHash: 'sha256:5b46f8836511bbfbb7e31b3e8e29e924ba9dc199e4369e5d7ad8fcfaf48512e0' }, // real hash so it passes integrity check
        pages: [{ page: 1, width: 100, height: 100, artwork: 'non-existent-artwork' }] // but missing artwork
      } as any;
    });

    renderViewer(services, {
      bankId: 'sbi',
      bankFormId: 'sbi::account-opening',
      purposeId: 'sbi::account-opening::open-new',
      formVersionId: 'sbi-aof-v1'
    });

    expect(await screen.findByText('Verification Warning')).toBeTruthy();
  });

  it('fails closed when version is unknown', async () => {
    const { services } = createTestServices();
    
    vi.spyOn(services.forms, 'getFormBundle').mockResolvedValue(null);

    renderViewer(services, {
      bankId: 'sbi',
      bankFormId: 'sbi::account-opening',
      purposeId: 'sbi::account-opening::open-new',
      formVersionId: 'unknown-v2'
    });

    expect(await screen.findByText('This form isn’t available yet')).toBeTruthy();
  });

  it('fails closed when form is not available in catalog', async () => {
    const { services } = createTestServices();
    
    vi.spyOn(services.catalog, 'getBankFormDetail').mockResolvedValue(null);

    renderViewer(services, {
      bankId: 'sbi',
      bankFormId: 'sbi::unknown-form',
      purposeId: 'sbi::unknown-form::open-new',
      formVersionId: 'sbi-aof-v1'
    });

    expect(await screen.findByText('This form isn’t available yet')).toBeTruthy();
  });

});
