import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { env } from '../../config/env';

/**
 * Initializes and retrieves the singleton Firebase App instance.
 * Throws a helpful error if required Firebase web config keys are missing.
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  if (!env.hasFirebaseConfig) {
    throw new Error(
      'Firebase configuration is missing or incomplete. ' +
      'Please ensure VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID are set in .env.local.'
    );
  }

  const firebaseConfig: FirebaseOptions = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain || `${env.firebase.projectId}.firebaseapp.com`,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket || `${env.firebase.projectId}.appspot.com`,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
  };

  return initializeApp(firebaseConfig);
}

/**
 * Retrieves the Firebase Auth instance bound to the initialized app.
 */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
