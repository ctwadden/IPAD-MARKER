import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export type { User };

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes required for Google Classroom and Google Drive integration
export const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails',
];

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

export const ALL_SCOPES = [...CLASSROOM_SCOPES, ...DRIVE_SCOPES];

const provider = new GoogleAuthProvider();
ALL_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Configure login hint specifically for teacher account cwadden@gnspes.ca
provider.setCustomParameters({
  login_hint: 'cwadden@gnspes.ca',
  prompt: 'select_account',
});

// Flag to indicate ongoing sign-in
let isSigningIn = false;

// In-memory cache for the access token (never saved to localStorage for security)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Call this on app load to track auth state
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

// Sign in with Google using popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      console.warn('No access token returned in credential, proceeding with auth token');
    }

    cachedAccessToken = credential?.accessToken || null;
    cachedUser = result.user;

    return {
      user: result.user,
      accessToken: cachedAccessToken || '',
    };
  } catch (error: any) {
    console.error('Google Classroom Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};
