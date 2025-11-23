require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "https://co-pilot-frontend-gamma.vercel.app/"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

const MODEL = process.env.MODEL;   
const API_KEY = process.env.GOOGLE_API_KEY;

function customFormat(str) {
  if (!str) return "";
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\\\n/g, "\n")
    .split("\n")
    .map((line) => "  " + line.trimEnd())
    .join("\n");
}

async function callGemini(prompt, language) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Write complete ${language} code ONLY.\nPrompt: ${prompt}`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return json.candidates[0].content.parts[0].text;
    }

    console.log("Gemini error:", json);
    return null;
  } catch (e) {
    console.error("Fetch error:", e);
    return null;
  }
}

function fallback(prompt) {
  return "// Fallback: No algorithm matched.";
}

app.post("/generate", async (req, res) => {
  const { prompt, language } = req.body;

  let out = await callGemini(prompt, language);
  if (!out) out = fallback(prompt);

  res.json({ code: customFormat(out) });
});

app.listen(4000, () => console.log("Backend running on port 4000"));
