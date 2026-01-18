// server.cjs
const express = require("express");
const multer = require("multer");
const path = require("path");
const rateLimit = require("express-rate-limit");
const FormData = require("form-data");

// IMPORTANT: Force node-fetch v2 (reliable with form-data)
const fetch = require("node-fetch");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_STT_MODEL_ID =
  process.env.ELEVENLABS_STT_MODEL_ID || "scribe_v1";

console.log("Loaded ELEVENLABS_API_KEY?", !!ELEVENLABS_API_KEY);
console.log("STT model_id:", ELEVENLABS_STT_MODEL_ID);

// ---------------- RATE LIMITER ----------------
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, try again later." },
});

// ---------------- MIDDLEWARE ----------------
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

// ---------------- HELPERS ----------------
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getFillerWords(text) {
  const fillers = [
    "um",
    "uh",
    "like",
    "you know",
    "so",
    "actually",
    "basically",
    "literally",
    "kind of",
    "sort of",
    "i mean",
  ];

  const lower = (text || "").toLowerCase();
  const found = [];

  for (const f of fillers) {
    const pattern = new RegExp(`\\b${f.replace(/\s+/g, "\\s+")}\\b`, "g");
    const matches = lower.match(pattern);
    if (matches && matches.length) {
      found.push({ word: f, count: matches.length });
    }
  }

  return found;
}

function calcWPM(wordCount, seconds) {
  if (!seconds || seconds <= 0) return 0;
  return Math.round((wordCount / seconds) * 60);
}

function scoreClarity(fillerRatio) {
  if (fillerRatio <= 0.02) return 90;
  if (fillerRatio <= 0.05) return 80;
  if (fillerRatio <= 0.1) return 70;
  return 60;
}

function scoreConfidence(wpm) {
  if (wpm >= 120 && wpm <= 170) return 80;
  if (wpm >= 90 && wpm < 120) return 70;
  if (wpm > 170 && wpm <= 200) return 65;
  return 50;
}

// ---------------- ROUTES ----------------
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post(
  "/api/analyze-audio",
  analyzeLimiter,
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!ELEVENLABS_API_KEY) {
        return res
          .status(500)
          .json({ ok: false, error: "Missing ELEVENLABS_API_KEY in .env" });
      }

      if (!req.file) {
        return res.status(400).json({ ok: false, error: "No audio uploaded" });
      }

      const durationSeconds = Number(req.body?.durationSeconds || 0);
      const mimeType = req.file.mimetype || "audio/webm";
      const audioBuffer = req.file.buffer;

      // ---- Build multipart request for ElevenLabs ----
      const form = new FormData();

      // ElevenLabs STT: send model_id + file
      form.append("model_id", ELEVENLABS_STT_MODEL_ID);

      // Use "file" (most STT APIs expect file)
      form.append("file", audioBuffer, {
        filename: "recording.webm",
        contentType: mimeType,
        knownLength: audioBuffer.length,
      });

      // Debug: log headers (no secrets)
      const headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        ...form.getHeaders(),
      };

      const sttRes = await fetch(
        "https://api.elevenlabs.io/v1/speech-to-text",
        {
          method: "POST",
          headers,
          body: form,
        },
      );

      const sttText = await sttRes.text();

      if (!sttRes.ok) {
        return res.status(502).json({
          ok: false,
          error: `ElevenLabs STT failed (${sttRes.status})`,
          details: sttText,
        });
      }

      let sttJson;
      try {
        sttJson = JSON.parse(sttText);
      } catch {
        sttJson = { text: sttText };
      }

      const transcript =
        sttJson.text || sttJson.transcript || sttJson?.data?.text || "";

      const wordCount = countWords(transcript);
      const fillerList = getFillerWords(transcript);
      const fillerCount = fillerList.reduce((sum, f) => sum + f.count, 0);
      const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

      const wpm = calcWPM(wordCount, durationSeconds);
      const clarity = scoreClarity(fillerRatio);
      const confidence = scoreConfidence(wpm);

      const result = {
        transcript,
        durationSeconds,
        wordCount,
        wpm,
        filler: {
          total: fillerCount,
          ratio: Number((fillerRatio * 100).toFixed(1)),
          details: fillerList,
        },
        scores: { clarity, confidence },
        summary: transcript
          ? `You said: "${transcript}".`
          : "No transcript detected. Try speaking louder and longer (10+ seconds).",
        tips: {
          pace:
            wpm < 110
              ? "Consider speaking a bit faster."
              : wpm > 180
                ? "Slow down slightly."
                : "Good pace.",
          fillers:
            fillerCount === 0
              ? "Nice — no filler words detected."
              : "Try pausing instead of fillers.",
        },
      };

      return res.json({ ok: true, result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        error: "Server analysis failed",
        details: err?.message || String(err),
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
});
