import type { FieldProgress, FieldProgressState, SavedForm, SavedFormStatus, User, UserPreferences } from '../../domain/types';

/**
 * In-browser development backend storage.
 *
 * This is a stand-in for the Postgres tables in db/schema.sql and it enforces
 * the same invariants as the server must (OTP expiry, attempt limits, resend
 * cooldown, session expiry, logout invalidation, one saved form per
 * user + version + purpose). It is NOT a security boundary: everything runs in
 * the browser, so treat it as a development fixture only. Switching
 * VITE_AUTH_MODE=api and VITE_API_BASE_URL to a real backend replaces it.
 */

export interface UserRecord extends User {
  updatedAt: string;
}

export interface OtpChallengeRecord {
  id: string;
  userId: string;
  phoneE164: string;
  codeHash: string;
  salt: string;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: string;
  expiresAt: string;
  status: 'pending' | 'verified' | 'expired' | 'locked';
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface SavedFormRecord extends SavedForm {
  status: SavedFormStatus;
}

export interface FieldProgressRecord extends FieldProgress {}

export interface PreferenceRecord extends UserPreferences {}

interface MockDbState {
  version: 1;
  users: UserRecord[];
  otpChallenges: OtpChallengeRecord[];
  sessions: SessionRecord[];
  savedForms: SavedFormRecord[];
  fieldProgress: FieldProgressRecord[];
  preferences: PreferenceRecord[];
  sequence: number;
}

const STORAGE_KEY = 'thunaiy.dev-backend.v1';

function emptyState(): MockDbState {
  return {
    version: 1,
    users: [],
    otpChallenges: [],
    sessions: [],
    savedForms: [],
    fieldProgress: [],
    preferences: [],
    sequence: 0,
  };
}

/** Non-cryptographic hash. Development backend only — a real server hashes with bcrypt/argon2. */
export function hashForDevBackend(value: string, salt: string): string {
  let hash = 0x811c9dc5;
  const input = `${salt}:${value}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function randomToken(bytes = 24): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(bytes);
    globalCrypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Array.from({ length: bytes * 2 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function randomOtpCode(): string {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    globalCrypto.getRandomValues(buffer);
    return String(buffer[0] % 1_000_000).padStart(6, '0');
  }
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

interface MockDbOptions {
  persist?: boolean;
  storageKey?: string;
  now?: () => Date;
}

export class MockDb {
  private state: MockDbState;
  private readonly persist: boolean;
  private readonly storageKey: string;
  readonly now: () => Date;

  constructor(options: MockDbOptions = {}) {
    this.persist = options.persist ?? true;
    this.storageKey = options.storageKey ?? STORAGE_KEY;
    this.now = options.now ?? (() => new Date());
    this.state = this.load();
  }

  /* ---------------------------------------------------------- persistence -- */

  private load(): MockDbState {
    if (!this.persist) return emptyState();
    try {
      const raw = globalThis.localStorage?.getItem(this.storageKey);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as MockDbState;
      return { ...emptyState(), ...parsed, version: 1 };
    } catch {
      return emptyState();
    }
  }

  private flush(): void {
    if (!this.persist) return;
    try {
      globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      /* storage unavailable (private mode / quota) — the session stays in memory */
    }
  }

  private nextId(prefix: string): string {
    this.state.sequence += 1;
    return `${prefix}_${this.state.sequence.toString(36)}${randomToken(4)}`;
  }

  /* ---------------------------------------------------------------- users -- */

  findUserByPhone(phoneE164: string): UserRecord | null {
    return this.state.users.find((user) => user.phoneE164 === phoneE164) ?? null;
  }

  findUserById(userId: string): UserRecord | null {
    return this.state.users.find((user) => user.id === userId) ?? null;
  }

  upsertUser(input: { name: string; phoneE164: string }): UserRecord {
    const existing = this.findUserByPhone(input.phoneE164);
    const now = this.now().toISOString();
    if (existing) {
      existing.name = input.name;
      existing.updatedAt = now;
      this.flush();
      return existing;
    }
    const user: UserRecord = {
      id: this.nextId('user'),
      name: input.name,
      phoneE164: input.phoneE164,
      createdAt: now,
      updatedAt: now,
    };
    this.state.users.push(user);
    this.flush();
    return user;
  }

  /* ------------------------------------------------------- otp challenges -- */

  createOtpChallenge(input: {
    userId: string;
    phoneE164: string;
    code: string;
    maxAttempts: number;
    ttlSeconds: number;
    resendCooldownSeconds: number;
  }): { challenge: OtpChallengeRecord; code: string } {
    const now = this.now();
    const salt = randomToken(8);
    // Only the newest challenge per user may be verified.
    for (const challenge of this.state.otpChallenges) {
      if (challenge.userId === input.userId && challenge.status === 'pending') challenge.status = 'expired';
    }
    const challenge: OtpChallengeRecord = {
      id: this.nextId('otp'),
      userId: input.userId,
      phoneE164: input.phoneE164,
      codeHash: hashForDevBackend(input.code, salt),
      salt,
      attempts: 0,
      maxAttempts: input.maxAttempts,
      resendAvailableAt: new Date(now.getTime() + input.resendCooldownSeconds * 1000).toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlSeconds * 1000).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
    };
    this.state.otpChallenges.push(challenge);
    this.flush();
    return { challenge, code: input.code };
  }

  getOtpChallenge(challengeId: string): OtpChallengeRecord | null {
    return this.state.otpChallenges.find((challenge) => challenge.id === challengeId) ?? null;
  }

  updateOtpChallenge(challengeId: string, patch: Partial<OtpChallengeRecord>): void {
    const challenge = this.getOtpChallenge(challengeId);
    if (!challenge) return;
    Object.assign(challenge, patch);
    this.flush();
  }

  /* ------------------------------------------------------------- sessions -- */

  createSession(userId: string, ttlHours: number): SessionRecord {
    const now = this.now();
    const session: SessionRecord = {
      token: randomToken(24),
      userId,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlHours * 3600 * 1000).toISOString(),
      revokedAt: null,
    };
    this.state.sessions.push(session);
    this.flush();
    return session;
  }

  /** Returns the session only when it is neither revoked nor expired. */
  getActiveSession(token: string): SessionRecord | null {
    const session = this.state.sessions.find((candidate) => candidate.token === token);
    if (!session) return null;
    if (session.revokedAt !== null) return null;
    if (session.expiresAt <= this.now().toISOString()) return null;
    return session;
  }

  revokeSession(token: string): void {
    const session = this.state.sessions.find((candidate) => candidate.token === token);
    if (!session) return;
    session.revokedAt = this.now().toISOString();
    this.flush();
  }

  revokeAllSessions(userId: string): void {
    const now = this.now().toISOString();
    for (const session of this.state.sessions) {
      if (session.userId === userId && session.revokedAt === null) session.revokedAt = now;
    }
    this.flush();
  }

  /* ----------------------------------------------------------- saved forms -- */

  findSavedForm(input: { userId: string; formVersionId: string; purposeId: string }): SavedFormRecord | null {
    return (
      this.state.savedForms.find(
        (savedForm) =>
          savedForm.userId === input.userId &&
          savedForm.formVersionId === input.formVersionId &&
          savedForm.purposeId === input.purposeId,
      ) ?? null
    );
  }

  createSavedForm(input: {
    userId: string;
    bankId: string;
    bankFormId: string;
    formVersionId: string;
    purposeId: string;
  }): SavedFormRecord {
    const now = this.now().toISOString();
    const savedForm: SavedFormRecord = {
      id: this.nextId('sf'),
      userId: input.userId,
      bankId: input.bankId,
      bankFormId: input.bankFormId,
      formVersionId: input.formVersionId,
      purposeId: input.purposeId,
      status: 'in_progress',
      startedAt: now,
      lastViewedAt: now,
      completedAt: null,
    };
    this.state.savedForms.push(savedForm);
    this.flush();
    return savedForm;
  }

  getSavedForm(savedFormId: string): SavedFormRecord | null {
    return this.state.savedForms.find((savedForm) => savedForm.id === savedFormId) ?? null;
  }

  listSavedForms(userId: string): SavedFormRecord[] {
    return this.state.savedForms
      .filter((savedForm) => savedForm.userId === userId)
      .sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt));
  }

  updateSavedForm(savedFormId: string, patch: Partial<SavedFormRecord>): SavedFormRecord | null {
    const savedForm = this.getSavedForm(savedFormId);
    if (!savedForm) return null;
    Object.assign(savedForm, patch);
    this.flush();
    return savedForm;
  }

  /* -------------------------------------------------------- field progress -- */

  listFieldProgress(savedFormId: string): FieldProgressRecord[] {
    return this.state.fieldProgress.filter((row) => row.savedFormId === savedFormId);
  }

  setFieldProgress(savedFormId: string, fieldId: string, state: FieldProgressState): FieldProgressRecord[] {
    const now = this.now().toISOString();
    const existing = this.state.fieldProgress.find(
      (row) => row.savedFormId === savedFormId && row.fieldId === fieldId,
    );
    if (existing) {
      existing.state = state;
      existing.updatedAt = now;
    } else {
      this.state.fieldProgress.push({ savedFormId, fieldId, state, updatedAt: now });
    }
    this.flush();
    return this.listFieldProgress(savedFormId);
  }

  /* ----------------------------------------------------------- preferences -- */

  getPreferences(userId: string): PreferenceRecord | null {
    return this.state.preferences.find((row) => row.userId === userId) ?? null;
  }

  upsertPreferences(userId: string, patch: Partial<PreferenceRecord>): PreferenceRecord {
    const now = this.now().toISOString();
    let record = this.getPreferences(userId);
    if (!record) {
      record = { userId, languageCode: 'en', showFieldGuidance: true, updatedAt: now };
      this.state.preferences.push(record);
    }
    Object.assign(record, patch, { updatedAt: now });
    this.flush();
    return record;
  }

  /* ----------------------------------------------------------------- misc -- */

  /** Test helper: wipe all mutable state. */
  reset(): void {
    this.state = emptyState();
    this.flush();
  }
}
