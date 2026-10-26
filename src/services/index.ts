import { env, hasHttpBackend } from '../config/env';
import { createHttpServices } from './httpServices';
import { FirebaseAuthService } from './firebase/firebaseAuthService';
import { MockAuthService } from './mock/mockAuthService';
import { MockCatalogService } from './mock/mockCatalogService';
import { MockDb } from './mock/mockDb';
import { MockFormService } from './mock/mockFormService';
import { MockPreferenceService } from './mock/mockPreferenceService';
import { MockSavedFormService } from './mock/mockSavedFormService';
import { MockBranchService } from './mock/mockBranchService';
import { buildMockCatalog, type MockCatalog } from './mock/seed';
import type { AuthService, Services } from './types';

export interface ServiceOverrides {
  backend?: 'dev' | 'http' | 'firebase';
  db?: MockDb;
  catalog?: MockCatalog;
  auth?: AuthService;
}

/** Development backend: everything runs in the browser (see src/services/mock). */
export function createMockServices(overrides: ServiceOverrides = {}): Services {
  const db = overrides.db ?? new MockDb();
  const catalog = overrides.catalog ?? buildMockCatalog();
  return {
    backend: 'dev',
    auth: overrides.auth ?? new MockAuthService(db),
    catalog: new MockCatalogService(catalog),
    forms: new MockFormService(catalog),
    savedForms: new MockSavedFormService(db, catalog),
    preferences: new MockPreferenceService(db),
    branch: new MockBranchService(),
  };
}

/** Firebase backend: real Firebase Phone Authentication with in-browser mock catalogue & storage. */
export function createFirebaseServices(overrides: ServiceOverrides = {}): Services {
  const db = overrides.db ?? new MockDb();
  const catalog = overrides.catalog ?? buildMockCatalog();
  return {
    backend: 'firebase',
    auth: overrides.auth ?? new FirebaseAuthService(),
    catalog: new MockCatalogService(catalog),
    forms: new MockFormService(catalog),
    savedForms: new MockSavedFormService(db, catalog),
    preferences: new MockPreferenceService(db),
    branch: new MockBranchService(),
  };
}

/**
 * Service registry. Chooses the Firebase backend when VITE_AUTH_MODE=firebase,
 * the HTTP backend when VITE_AUTH_MODE=api and VITE_API_BASE_URL are configured,
 * and the in-browser development backend otherwise. UI code only depends on the interfaces in ./types.
 */
export function createServices(overrides: ServiceOverrides = {}): Services {
  const isTest = import.meta.env?.MODE === 'test';
  const defaultBackend = isTest
    ? 'dev'
    : env.backendMode === 'firebase'
      ? 'firebase'
      : hasHttpBackend
        ? 'http'
        : 'dev';

  const backend = overrides.backend ?? defaultBackend;

  if (backend === 'firebase') {
    return createFirebaseServices(overrides);
  }
  return backend === 'http' ? createHttpServices() : createMockServices(overrides);
}

export const services: Services = createServices();

export type { Services };
