import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

// This listener runs every time the authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, handle accordingly (e.g., update UI, allow access)
        console.log("User is signed in:", user.uid);
    } else {
        console.log("No user is signed in.");
        window.location.href = '../login.html';
    }
});