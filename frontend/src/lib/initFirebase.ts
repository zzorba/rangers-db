
import { FirebaseOptions, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDodDkZvw1vYWul3zM0vo8tnAJFrbYQqbg",
  authDomain: "rangers-db.firebaseapp.com",
  projectId: "rangers-db",
  storageBucket: "rangers-db.appspot.com",
  messagingSenderId: "1008645024562",
  appId: "1:1008645024562:web:91b8d35ee4be117fda052b"
};

function createFirebaseApp(config: FirebaseOptions) {
  try {
    return getApp();
  } catch {
    return initializeApp(config);
  }
}
const firebaseApp = createFirebaseApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp);

