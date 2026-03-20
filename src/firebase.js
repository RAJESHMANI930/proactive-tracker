import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase configuration snippet
const firebaseConfig = {
  apiKey: "AIzaSyAcr4dPTqW8LYzCp8D9dnRfda5pVSCF5_8",
  authDomain: "proactive-tracker-9d693.firebaseapp.com",
  projectId: "proactive-tracker-9d693",
  storageBucket: "proactive-tracker-9d693.firebasestorage.app",
  messagingSenderId: "988926796216",
  appId: "1:988926796216:web:a2fe1721b84b45d607af4d"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
