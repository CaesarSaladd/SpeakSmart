# SpeechMentor

**SpeechMentor** is an AI-powered speech coaching web application that provides instant, actionable feedback on spoken audio. Users can record themselves speaking and receive insights on clarity, pacing, filler words, and confidence — all within seconds.

---

## Inspiration

Public speaking is one of the most common skills people struggle with, yet personalized feedback is often expensive or inaccessible. We wanted to use AI to make high-quality speech coaching available to anyone with a microphone.

---

## What It Does

SpeechMentor allows users to:

* Record a short speech directly in the browser
* Automatically transcribe spoken audio
* Analyze speaking pace (words per minute)
* Detect filler words (e.g., "um", "uh", "like")
* Receive clarity and confidence scores
* Get actionable tips to improve future performances

All analysis is returned in near–real time.

---

## How We Built It

### Frontend

* HTML, Tailwind CSS
* Vanilla JavaScript
* Web Audio / MediaRecorder API for in-browser audio recording

### Backend

* Node.js + Express
* Multer for in-memory audio uploads
* ElevenLabs Speech-to-Text API
* Custom analysis logic for pacing, fillers, and scoring

### Architecture Highlights

* Stateless API design
* Audio processed fully in memory (no persistent storage)
* Rate-limited endpoints for safety and reliability

---

## How It Works

1. User records audio in the browser
2. Audio is sent to the backend as multipart form data
3. ElevenLabs transcribes the audio
4. The server analyzes the transcript
5. Feedback and scores are returned to the user

---

## Running Locally

### Prerequisites

* Node.js (v18 or later recommended)
* npm
* An ElevenLabs API key
* A Firebase project (for client-side features that require it)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd speechmentor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the root of the project and add:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_STT_MODEL_ID=scribe_v1
```

If using Firebase features on the frontend, configure your Firebase keys in the client configuration file.

### 4. Run the development server

```bash
npm run dev
```

The server will start locally (default: [http://localhost:3000](http://localhost:3000)) and will interact with ElevenLabs and Firebase using your own credentials.

---

*SpeechMentor — Speak. Analyze. Improve.*
