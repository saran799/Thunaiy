import type { TranslationKey } from '../i18n';
import type { ApiErrorCode } from './errors';

/** Maps a service error code to the translation key shown in an error panel. */
export function errorMessageKey(code: ApiErrorCode | undefined): TranslationKey {
  switch (code) {
    case 'network':
      return 'errors.network';
    case 'unauthorized':
    case 'forbidden':
      return 'errors.unauthorized';
    case 'not_found':
      return 'errors.notFound';
    case 'unavailable':
      return 'errors.unavailable';
    default:
      return 'common.errorBody';
  }
}
