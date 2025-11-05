import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const venice = {
  chatbot: async (question, model = "llama-3.3-70b") => {
    const data = {
      requestId: "scrape-for-all",
      modelId: model,
      prompt: [{ content: question, role: "user" }],
      systemPrompt: "",
      conversationType: "text",
      temperature: 0.8,
      webEnabled: true,
      topP: 0.9,
      isCharacter: false,
      clientProcessingTime: 2834,
    };

    const config = {
      method: "POST",
      url: "https://venice.ai/api/inference/chat",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        "Content-Type": "application/json",
        "accept-language": "en-US",
        referer: "https://venice.ai/chat",
        origin: "https://venice.ai",
      },
      data,
    };

    const res = await axios.request(config);
    const chunks = res.data
      .split("\n")
      .filter((c) => c)
      .map((c) => JSON.parse(c));
    return chunks.map((c) => c.content).join("");
  },

  txt2img: async (prompt) => {
    const data = {
      modelId: "fluently-xl-final-akash",
      requestId: "INlNFRX",
      prompt,
      seed: 15391382,
      cfgScale: 5,
      aspectRatio: "1:1",
      width: 1024,
      height: 1024,
      steps: 30,
      safeVenice: true,
    };

    const config = {
      method: "POST",
      url: "https://venice.ai/api/inference/image",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
        "Content-Type": "application/json",
        referer: "https://venice.ai/chat",
        origin: "https://venice.ai",
      },
      responseType: "arraybuffer",
      data,
    };

    const res = await axios.request(config);
    const fileName = `image-${Date.now()}.png`;
    const filePath = path.join(__dirname, "tmp", fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, res.data);

    return { status: true, message: "Image generated successfully", file: `/tmp/${fileName}` };
  },
};

// Chatbot route
app.get("/chat", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json({ status: false, error: "Missing query ?q=" });
  try {
    const answer = await venice.chatbot(q);
    res.json({ status: true, creator: "Chamod Nimsara", question: q, answer });
  } catch (e) {
    res.json({ status: false, error: e.message });
  }
});

// Text → Image route
app.get("/image", async (req, res) => {
  const p = req.query.prompt;
  if (!p) return res.json({ status: false, error: "Missing prompt ?prompt=" });
  try {
    const img = await venice.txt2img(p);
    res.json({ status: true, creator: "Chamod Nimsara", data: img });
  } catch (e) {
    res.json({ status: false, error: e.message });
  }
});

// Default route for testing
app.get("/", (req, res) => res.json({ status: true, message: "Venice AI API is working!" }));

// Dynamic port for Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚡ Venice API running on port ${PORT}`));

export default app;
