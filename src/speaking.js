let isRecording = false;
let seconds = 0;
let timerInterval;

const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const retryBtn = document.getElementById('retryBtn');
const submitBtn = document.getElementById('submitBtn');
const actionButtons = document.getElementById('actionButtons');
const timer = document.getElementById('timer');
const recordingIndicator = document.getElementById('recordingIndicator');
const analysisPanel = document.getElementById('analysisPanel');

recordBtn.addEventListener('click', () => {
    isRecording = true;
    recordBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    actionButtons.classList.add('hidden');
    recordingIndicator.classList.remove('hidden');
    analysisPanel.classList.add('hidden');
    
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
});

stopBtn.addEventListener('click', () => {
    isRecording = false;
    stopBtn.classList.add('hidden');
    actionButtons.classList.remove('hidden');
    recordingIndicator.classList.add('hidden');
    
    clearInterval(timerInterval);
});

retryBtn.addEventListener('click', () => {
    actionButtons.classList.add('hidden');
    recordBtn.classList.remove('hidden');
    analysisPanel.classList.add('hidden');
    timer.textContent = '00:00';
});

submitBtn.addEventListener('click', () => {
    actionButtons.classList.add('hidden');
    recordBtn.classList.remove('hidden');
    analysisPanel.classList.remove('hidden');
    timer.textContent = '00:00';
});

// Toggle session details
function toggleSession(sessionId) {
    const details = document.getElementById(sessionId);
    const icon = document.getElementById(sessionId + '-icon');
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        details.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Make toggleSession globally accessible
window.toggleSession = toggleSession;