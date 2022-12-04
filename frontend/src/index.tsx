import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, User } from 'firebase/auth';

import './index.css';
import './icons/style.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const firebaseConfig = {
  apiKey: "AIzaSyDodDkZvw1vYWul3zM0vo8tnAJFrbYQqbg",
  authDomain: "rangers-db.firebaseapp.com",
  projectId: "rangers-db",
  storageBucket: "rangers-db.appspot.com",
  messagingSenderId: "1008645024562",
  appId: "1:1008645024562:web:91b8d35ee4be117fda052b"
};

const app = initializeApp(firebaseConfig);

async function checkForRefreshToken(user: User, delay: number = 250) {
  const idTokenResult = await user.getIdTokenResult();
  const hasuraClaims = idTokenResult.claims['https://hasura.io/jwt/claims'];
  if (hasuraClaims) {
    // All good
    return;
  }
  setTimeout(() => {
    console.log(`Checking for token after: ${delay}ms`);
    checkForRefreshToken(user, delay * 2);
  }, delay);
}

getAuth(app).onAuthStateChanged(async(user: User | null) => {
  if (user) {
    checkForRefreshToken(user);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
