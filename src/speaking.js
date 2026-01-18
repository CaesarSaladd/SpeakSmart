
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let seconds = 0;
let timerInterval = null;


const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const retryBtn = document.getElementById('retryBtn');
const submitBtn = document.getElementById('submitBtn');
const actionButtons = document.getElementById('actionButtons');
const timer = document.getElementById('timer');
const recordingIndicator = document.getElementById('recordingIndicator');
const analysisPanel = document.getElementById('analysisPanel');


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
    }
}


function startRecording() {
    if (!mediaRecorder || isRecording) return;

    isRecording = true;
    audioChunks = [];
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
    if (event.data.size > 0) {
        audioChunks.push(event.data);
    }
}

function handleStop() {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioURL = URL.createObjectURL(blob);

    renderAudioPlayer(audioURL);

    // Blob available here for upload / AI analysis
    console.log("Recording complete:", blob);
}


function startTimer() {
    seconds = 0;
    timer.textContent = '00:00';

    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timer.textContent =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}


function updateUIOnStart() {
    recordBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    actionButtons.classList.add('hidden');
    recordingIndicator.classList.remove('hidden');
    analysisPanel.classList.add('hidden');
}

function updateUIOnStop() {
    stopBtn.classList.add('hidden');
    actionButtons.classList.remove('hidden');
    recordingIndicator.classList.add('hidden');
}


function renderAudioPlayer(src) {
    let audio = document.getElementById('recordedAudio');

    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'recordedAudio';
        audio.controls = true;
        document.body.appendChild(audio);
    }

    audio.src = src;
}

function bindUIEvents() {
    recordBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);

    retryBtn.addEventListener('click', handleRetry);
    submitBtn.addEventListener('click', handleSubmit);
}


function handleRetry() {
    actionButtons.classList.add('hidden');
    recordBtn.classList.remove('hidden');
    analysisPanel.classList.add('hidden');
    timer.textContent = '00:00';
}

function handleSubmit() {
    actionButtons.classList.add('hidden');
    recordBtn.classList.remove('hidden');
    analysisPanel.classList.remove('hidden');
    timer.textContent = '00:00';

    // Hook AI analysis / upload here
}


window.toggleSession = function (sessionId) {
    const details = document.getElementById(sessionId);
    const icon = document.getElementById(`${sessionId}-icon`);

    const isHidden = details.classList.contains('hidden');

    details.classList.toggle('hidden');
    icon.classList.toggle('fa-chevron-down', !isHidden);
    icon.classList.toggle('fa-chevron-up', isHidden);
};
