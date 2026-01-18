// src/speaking.js

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let seconds = 0;
let timerInterval = null;

const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const retryBtn = document.getElementById("retryBtn");
const submitBtn = document.getElementById("submitBtn");
const actionButtons = document.getElementById("actionButtons");
const timer = document.getElementById("timer");
const recordingIndicator = document.getElementById("recordingIndicator");
const analysisPanel = document.getElementById("analysisPanel");

const audioWrap = document.getElementById("audioWrap");

let latestRecordingBlob = null;

// ---- Analysis DOM nodes ----
const mDuration = document.getElementById("mDuration");
const mWords = document.getElementById("mWords");
const mWpm = document.getElementById("mWpm");
const mPaceTip = document.getElementById("mPaceTip");
const mFillers = document.getElementById("mFillers");
const mFillerRatio = document.getElementById("mFillerRatio");
const mClarity = document.getElementById("mClarity");
const mConfidence = document.getElementById("mConfidence");

const tTranscript = document.getElementById("tTranscript");
const tSummary = document.getElementById("tSummary");
const tTipPace = document.getElementById("tTipPace");
const tTipFillers = document.getElementById("tTipFillers");

const fillerList = document.getElementById("fillerList");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

initRecorder();
bindUIEvents();

async function initRecorder() {
  if (!navigator.mediaDevices?.getUserMedia) {
    console.error("getUserMedia not supported");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
  } catch (err) {
    console.error("Microphone access denied:", err);
    showError("Microphone access denied. Please allow mic permissions.");
  }
}

function startRecording() {
  if (!mediaRecorder || isRecording) return;

  hideError();

  isRecording = true;
  audioChunks = [];
  latestRecordingBlob = null;

  // hide preview while recording (clean UI)
  if (audioWrap) audioWrap.classList.add("hidden");

  mediaRecorder.start();

  updateUIOnStart();
  startTimer();
}

function stopRecording() {
  if (!mediaRecorder || !isRecording) return;

  isRecording = false;
  mediaRecorder.stop();

  stopTimer();
  updateUIOnStop();
}

function handleDataAvailable(event) {
  if (event.data.size > 0) audioChunks.push(event.data);
}

function handleStop() {
  const blob = new Blob(audioChunks, { type: "audio/webm" });
  latestRecordingBlob = blob;

  const audioURL = URL.createObjectURL(blob);
  renderAudioPlayer(audioURL);

  // ✅ show preview after stop
  if (audioWrap) audioWrap.classList.remove("hidden");
}

function startTimer() {
  seconds = 0;
  timer.textContent = "00:00";

  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateUIOnStart() {
  recordBtn.classList.add("hidden");
  stopBtn.classList.remove("hidden");
  actionButtons.classList.add("hidden");
  recordingIndicator.classList.remove("hidden");
  analysisPanel.classList.add("hidden");
}

function updateUIOnStop() {
  stopBtn.classList.add("hidden");
  actionButtons.classList.remove("hidden");
  recordingIndicator.classList.add("hidden");
}

function renderAudioPlayer(src) {
  // use the existing audio element from HTML
  const audio = document.getElementById("recordedAudio");
  if (!audio) return;
  audio.src = src;
}

function bindUIEvents() {
  recordBtn.addEventListener("click", startRecording);
  stopBtn.addEventListener("click", stopRecording);
  retryBtn.addEventListener("click", handleRetry);
  submitBtn.addEventListener("click", handleSubmit);
}

function handleRetry() {
  hideError();
  actionButtons.classList.add("hidden");
  recordBtn.classList.remove("hidden");
  analysisPanel.classList.add("hidden");
  timer.textContent = "00:00";
  latestRecordingBlob = null;

  if (audioWrap) audioWrap.classList.add("hidden");
}

async function handleSubmit() {
  hideError();

  actionButtons.classList.add("hidden");
  recordBtn.classList.remove("hidden");
  analysisPanel.classList.remove("hidden");

  if (!latestRecordingBlob) {
    showError("No recording found. Please record first.");
    return;
  }

  // show loading state in UI
  setLoadingUI();

  try {
    const formData = new FormData();
    formData.append("audio", latestRecordingBlob, "recording.webm");
    formData.append("durationSeconds", String(seconds));

    // ✅ With Vite proxy, this will hit your Node backend
    const res = await fetch("/api/analyze-audio", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.ok) {
      showError(
        `Error: ${data.error || "Unknown error"}\n\n${data.details || ""}`,
      );
      return;
    }

    renderAnalysis(data.result);
  } catch (err) {
    console.error(err);
    showError("Failed to analyze audio. Check server console.");
  }
}

function setLoadingUI() {
  mDuration.textContent = "—";
  mWords.textContent = "— words";
  mWpm.textContent = "— WPM";
  mPaceTip.textContent = "Analyzing...";
  mFillers.textContent = "—";
  mFillerRatio.textContent = "—% of words";
  mClarity.textContent = "—%";
  mConfidence.textContent = "—%";
  tTranscript.textContent = "Analyzing your speech...";
  tSummary.textContent = "—";
  tTipPace.textContent = "—";
  tTipFillers.textContent = "—";
  fillerList.textContent = "—";
}

function renderAnalysis(r) {
  const dur = Number(r.durationSeconds || 0);
  const mins = Math.floor(dur / 60);
  const secs = dur % 60;
  const prettyDur = `${mins}:${String(secs).padStart(2, "0")}`;

  mDuration.textContent = prettyDur;
  mWords.textContent = `${r.wordCount ?? 0} words`;

  mWpm.textContent = `${r.wpm ?? 0} WPM`;
  mPaceTip.textContent = r.tips?.pace || "—";

  mFillers.textContent = String(r.filler?.total ?? 0);
  mFillerRatio.textContent = `${r.filler?.ratio ?? 0}% of words`;

  mClarity.textContent = `${r.scores?.clarity ?? 0}%`;
  mConfidence.textContent = `${r.scores?.confidence ?? 0}%`;

  tTranscript.textContent = r.transcript || "No transcript detected.";
  tSummary.textContent = r.summary || "—";
  tTipPace.textContent = r.tips?.pace || "—";
  tTipFillers.textContent = r.tips?.fillers || "—";

  const details = r.filler?.details || [];
  if (!details.length) {
    fillerList.innerHTML = `<span class="text-emerald-200">Nice - no filler words detected.</span>`;
  } else {
    fillerList.innerHTML = `
      <div class="flex flex-wrap gap-2">
        ${details
          .map(
            (x) => `
          <span class="px-3 py-1 rounded-full bg-white/10 border border-white/10">
            <b class="text-white/80">${escapeHtml(x.word)}</b>: ${x.count}
          </span>
        `,
          )
          .join("")}
      </div>
    `;
  }
}

function showError(msg) {
  if (!errorBox || !errorText) {
    alert(msg);
    return;
  }
  errorBox.classList.remove("hidden");
  errorText.textContent = msg;
}

function hideError() {
  if (!errorBox || !errorText) return;
  errorBox.classList.add("hidden");
  errorText.textContent = "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// keep your session toggle
window.toggleSession = function (sessionId) {
  const details = document.getElementById(sessionId);
  const icon = document.getElementById(`${sessionId}-icon`);
  const isHidden = details.classList.contains("hidden");
  details.classList.toggle("hidden");
  icon.classList.toggle("fa-chevron-down", !isHidden);
  icon.classList.toggle("fa-chevron-up", isHidden);
};
