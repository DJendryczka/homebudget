import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAjBxTwbQ3ooz-9KQr0feQwKI_rnzdQfNI",
    authDomain: "dpds-21cbd.firebaseapp.com",
    projectId: "dpds-21cbd",
    storageBucket: "dpds-21cbd.firebasestorage.app",
    messagingSenderId: "54458072155",
    appId: "1:54458072155:web:90a242808b98b11df9137e",
    measurementId: "G-2ZGD8DP1XS",
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
