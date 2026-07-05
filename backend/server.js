import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini Setup
const defaultGenAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const MODEL_NAME = "gemini-2.5-flash";

// Format API Errors
const formatApiError = (err, isClientKey) => {
  const message = err?.message?.toString() || "Unknown server error";

  if (
    message.includes("leaked") ||
    message.includes("403 Forbidden") ||
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID")
  ) {
    if (isClientKey) {
      return "Invalid Google API Key. Please check your key and try again.";
    }

    return "Invalid or leaked Google API Key. Update API_KEY in your .env file.";
  }

  return message;
};

// =========================
// Root Route
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Chatbot Backend is Running Successfully!",
    endpoints: {
      health: "/health",
      chat: "/chat",
    },
  });
});

// =========================
// Health Route
// =========================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// =========================
// Chat Route
// =========================
app.post("/chat", async (req, res) => {
  try {
    const clientApiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.split(" ")[1];

    const activeKey = clientApiKey || API_KEY;

    if (!activeKey) {
      return res.status(401).json({
        success: false,
        error:
          "Google API Key is missing. Add API_KEY in Render Environment Variables or send it in the request headers.",
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      });
    }

    const aiInstance = clientApiKey
      ? new GoogleGenerativeAI(clientApiKey)
      : defaultGenAI;

    if (!aiInstance) {
      return res.status(500).json({
        success: false,
        error: "Gemini AI is not initialized.",
      });
    }

    const model = aiInstance.getGenerativeModel({
      model: MODEL_NAME,
    });

    const result = await model.generateContent(message);

    res.status(200).json({
      success: true,
      reply: result.response.text().trim(),
    });
  } catch (err) {
    const isClientKey = !!(
      req.headers["x-api-key"] || req.headers["authorization"]
    );

    const errorMessage = formatApiError(err, isClientKey);

    res.status(
      errorMessage.includes("API Key") || errorMessage.includes("API_KEY_INVALID")
        ? 401
        : 500
    ).json({
      success: false,
      error: errorMessage,
    });
  }
});

// =========================
// 404 Route
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// =========================
// Start Server
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log("==================================");
  console.log("🚀 Chatbot Backend Started");
  console.log(`🌍 Port : ${PORT}`);
  console.log(`📡 Health : /health`);
  console.log(`💬 Chat : /chat`);
  console.log("==================================");
});