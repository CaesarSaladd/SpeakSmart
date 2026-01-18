// src/speak-auth.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig.js";

const authBtn = document.getElementById("authBtn");
const speakNowBtn = document.getElementById("speakNowBtn");
const userNameEl = document.getElementById("userName");

// helper: choose best name
function getNiceName(user) {
  const dn = (user?.displayName || "").trim();
  if (dn) return dn;

  const email = (user?.email || "").trim();
  if (email) return email.split("@")[0]; // simple fallback

  return "USER";
}

// Toggle LOGIN / SIGN OUT + set username
onAuthStateChanged(auth, (user) => {
  // update hero name
  if (userNameEl) {
    userNameEl.textContent = user ? getNiceName(user) : "USER";
  }

  // toggle nav button
  if (!authBtn) return;

  if (user) {
    authBtn.textContent = "SIGN OUT";
    authBtn.href = "#";

    authBtn.onclick = async (e) => {
      e.preventDefault();
      await signOut(auth);
      // stay on index; listener will flip button + name back
    };
  } else {
    authBtn.textContent = "LOGIN";
    authBtn.href = "login.html";
    authBtn.onclick = null;
  }
});

// Speak Now: if not logged in -> go login, then back to speaking
if (speakNowBtn) {
  speakNowBtn.addEventListener("click", (e) => {
    const user = auth.currentUser;

    if (!user) {
      e.preventDefault();
      sessionStorage.setItem("afterLoginRedirect", "/speaking.html");
      window.location.href = "/login.html";
    }
  });
}
