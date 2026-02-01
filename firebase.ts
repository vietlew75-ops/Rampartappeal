
// Use Firebase Compat API to avoid issues with missing named exports in some environments
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAoidmhvxHmuEcy2o-jqMhITcdtT0NUmBg",
  authDomain: "shareyourhost.firebaseapp.com",
  projectId: "shareyourhost",
  storageBucket: "shareyourhost.firebasestorage.app",
  messagingSenderId: "620651572285",
  appId: "1:620651572285:web:833ebb225c43d155038e54",
  measurementId: "G-8QRKTW2LJ6"
};

// Initialize Firebase using compat layer
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default firebase;
