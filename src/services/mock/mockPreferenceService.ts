import type { UserPreferences } from '../../domain/types';
import { ApiError } from '../errors';
import type { PreferenceService } from '../types';
import type { MockDb } from './mockDb';

/** Language + guidance preferences (user_preferences table in the dev backend). */
export class MockPreferenceService implements PreferenceService {
  constructor(private readonly db: MockDb) {}

  async get(token: string): Promise<UserPreferences> {
    return this.db.upsertPreferences(this.requireUser(token), {});
  }

  async update(
    token: string,
    patch: Partial<Pick<UserPreferences, 'languageCode' | 'showFieldGuidance'>>,
  ): Promise<UserPreferences> {
    return this.db.upsertPreferences(this.requireUser(token), patch);
  }

  async ensureForUser(token: string, defaults: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.db.upsertPreferences(this.requireUser(token), defaults);
  }

  private requireUser(token: string): string {
    const session = this.db.getActiveSession(token);
    if (!session) throw new ApiError('unauthorized', 'Your session has expired. Please sign in again.');
    return session.userId;
  }
}
