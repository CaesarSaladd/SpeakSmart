import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ---------------------------------------------------------
// Read Firebase configuration from Vite environment variables.
// These are defined in your .env file as:
//
// VITE_FIREBASE_API_KEY=your-api-key
// VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_APP_ID=your-app-id
//
// ⚠️ Note: Vite only exposes environment variables that start with "VITE_"
// ---------------------------------------------------------
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);