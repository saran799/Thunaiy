import type { AuthService, Services } from '../services/types';
import { MockAuthService } from '../services/mock/mockAuthService';
import { MockCatalogService } from '../services/mock/mockCatalogService';
import { MockDb } from '../services/mock/mockDb';
import { MockFormService } from '../services/mock/mockFormService';
import { MockPreferenceService } from '../services/mock/mockPreferenceService';
import { MockSavedFormService } from '../services/mock/mockSavedFormService';
import { buildMockCatalog } from '../services/mock/seed';

/**
 * Isolated service container for tests: in-memory database, injectable clock,
 * and auth policy overrides so expiry / attempt limits can be exercised.
 */
export function createTestServices(options: {
  clock?: () => Date;
  authOptions?: ConstructorParameters<typeof MockAuthService>[1];
} = {}): { services: Services; db: MockDb; auth: AuthService } {
  const db = new MockDb({ persist: false, now: options.clock });
  const catalog = buildMockCatalog();
  const services: Services = {
    backend: 'dev',
    auth: new MockAuthService(db, options.authOptions),
    catalog: new MockCatalogService(catalog),
    forms: new MockFormService(catalog),
    savedForms: new MockSavedFormService(db, catalog),
    preferences: new MockPreferenceService(db),
  };
  return { services, db, auth: services.auth };
}

export const TEST_PHONE = '+919876543210';
export const TEST_NAME = 'Jabaraj';
