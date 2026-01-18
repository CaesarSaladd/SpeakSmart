// src/speak-auth.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig.js";


const authBtn = document.getElementById("authBtn");
const speakNowBtn = document.getElementById("speakNowBtn");

// Toggle LOGIN / SIGN OUT
onAuthStateChanged(auth, (user) => {
  if (!authBtn) return;

  if (user) {
    authBtn.textContent = "SIGN OUT";
    authBtn.href = "#";

    authBtn.onclick = async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = "/index.html";
    };
  } else {
    authBtn.textContent = "LOGIN";
    authBtn.href = "login.html";
    authBtn.onclick = null;
  }
});

// Handle SPEAK NOW click
if (speakNowBtn) {
  speakNowBtn.addEventListener("click", (e) => {
    const user = auth.currentUser;

    if (!user) {
      e.preventDefault();
      // remember where user wanted to go
      sessionStorage.setItem("afterLoginRedirect", "/speaking.html");
      window.location.href = "/login.html";
    }
    // if logged in → default link works, goes to speaking.html
  });
}
