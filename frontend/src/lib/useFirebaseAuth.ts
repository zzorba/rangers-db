import { useState, useEffect, useCallback } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { t } from '@lingui/macro';
import { firebaseAuth } from './initFirebase';

export interface AuthUser {
  uid: string;
  email: string | undefined;
  user: User;
};

export interface FirebaseAuth {
  authUser: AuthUser | undefined;
  loading: boolean;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}


const formatAuthUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email || undefined,
  user,
});

async function checkForRefreshToken(user: User, delay?: number): Promise<User> {
  const idTokenResult = await user.getIdTokenResult(!!delay);
  const hasuraClaims = idTokenResult.claims['https://hasura.io/jwt/claims'];
  if (hasuraClaims) {
    // All good
    return user;
  }
  return new Promise<User>((resolve) => {
    setTimeout(async() => {
      console.log(`Checking for token after: ${delay || 250}ms`);
      const u = await checkForRefreshToken(user, (delay || 250) * 2);
      resolve(u);
    }, delay || 250);
  });
}

export default function useFirebaseAuth(): FirebaseAuth {
  const [authUser, setAuthUser] = useState<AuthUser>();
  const [loading, setLoading] = useState(true);

  const authStateChanged = async (authState: User | null) => {
    if (!authState) {
      setAuthUser(undefined)
      setLoading(false)
      return;
    }

    setLoading(true)
    const userWithToken = await checkForRefreshToken(authState);

    var formattedUser = formatAuthUser(userWithToken);
    setAuthUser(formattedUser);
    setLoading(false);
  };
// listen for Firebase state change
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(authStateChanged);
    return () => unsubscribe();
  }, []);
  const signInWithEmailAndPasswordCallback = useCallback(async(email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      // Handle Firebase auth errors and provide user-friendly messages
      if (error.code === 'auth/user-not-found') {
        throw new Error(t`No account found with this email address.`);
      } else if (error.code === 'auth/wrong-password') {
        throw new Error(t`Incorrect password. Please try again.`);
      } else if (error.code === 'auth/invalid-email') {
        throw new Error(t`Invalid email address format.`);
      } else if (error.code === 'auth/user-disabled') {
        throw new Error(t`This account has been disabled.`);
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error(t`Too many failed login attempts. Please try again later.`);
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error(t`Invalid email or password. Please try again.`);
      } else {
        throw new Error(t`Failed to sign in. Please try again.`);
      }
    }
  }, []);
  const createUserWithEmailAndPasswordCallback = useCallback(async(email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      // Handle Firebase auth errors and provide user-friendly messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error(t`This email address is already registered. Please try logging in instead.`);
      } else if (error.code === 'auth/invalid-email') {
        throw new Error(t`Invalid email address format.`);
      } else if (error.code === 'auth/weak-password') {
        throw new Error(t`Password is too weak. Please use a stronger password.`);
      } else {
        throw new Error(t`Failed to create account. Please try again.`);
      }
    }
  }, []);
  const signOutCallback = useCallback(async () => {
    await signOut(firebaseAuth);
    setAuthUser(undefined);
    setLoading(false);
  }, [setAuthUser, setLoading]);
  const sendPasswordResetEmailCallback = useCallback(async(email: string) => {
    await sendPasswordResetEmail(firebaseAuth, email);
  }, []);
  return {
    authUser,
    loading,
    signInWithEmailAndPassword: signInWithEmailAndPasswordCallback,
    createUserWithEmailAndPassword: createUserWithEmailAndPasswordCallback,
    signOut: signOutCallback,
    sendPasswordResetEmail: sendPasswordResetEmailCallback,
  };
}