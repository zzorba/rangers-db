import { FirebaseApp } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { createContext, useContext, Context } from 'react'
import useFirebaseAuth, { FirebaseAuth } from './useFirebaseAuth';

const AuthUserContext = createContext<FirebaseAuth>({
  authUser: undefined,
  loading: true,
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  return (
    <AuthUserContext.Provider value={auth}>
      {children}
    </AuthUserContext.Provider>
  );
}
// custom hook to use the authUserContext and access authUser and loading
export const useAuth = () => useContext(AuthUserContext);
