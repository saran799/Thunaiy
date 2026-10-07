import { hasHttpBackend } from '../config/env';
import { createHttpServices } from './httpServices';
import { MockAuthService } from './mock/mockAuthService';
import { MockCatalogService } from './mock/mockCatalogService';
import { MockDb } from './mock/mockDb';
import { MockFormService } from './mock/mockFormService';
import { MockPreferenceService } from './mock/mockPreferenceService';
import { MockSavedFormService } from './mock/mockSavedFormService';
import { buildMockCatalog, type MockCatalog } from './mock/seed';
import type { Services } from './types';

export interface ServiceOverrides {
  backend?: 'dev' | 'http';
  db?: MockDb;
  catalog?: MockCatalog;
}

/** Development backend: everything runs in the browser (see src/services/mock). */
export function createMockServices(overrides: ServiceOverrides = {}): Services {
  const db = overrides.db ?? new MockDb();
  const catalog = overrides.catalog ?? buildMockCatalog();
  return {
    backend: 'dev',
    auth: new MockAuthService(db),
    catalog: new MockCatalogService(catalog),
    forms: new MockFormService(catalog),
    savedForms: new MockSavedFormService(db, catalog),
    preferences: new MockPreferenceService(db),
  };
}

/**
 * Service registry. Chooses the HTTP backend when VITE_AUTH_MODE=api and
 * VITE_API_BASE_URL are configured, and the in-browser development backend
 * otherwise. UI code only depends on the interfaces in ./types.
 */
export function createServices(overrides: ServiceOverrides = {}): Services {
  const backend = overrides.backend ?? (hasHttpBackend ? 'http' : 'dev');
  return backend === 'http' ? createHttpServices() : createMockServices(overrides);
}

export const services: Services = createServices();

export type { Services };
