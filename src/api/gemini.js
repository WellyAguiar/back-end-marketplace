import { GoogleGenerativeAI } from "@google/generative-ai";

// Object to store active chat sessions
const chatSessions = {};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Initialize chat session if it doesn't exist
      if (!chatSessions[sessionId]) {
        chatSessions[sessionId] = model.startChat({
          history: [],
          generationConfig: {
            maxOutputTokens: 200,
          },
        });
      }

      const chat = chatSessions[sessionId];

      const result = await chat.sendMessage(message);

      const response = await result.response;

      const text = await response.text();

      res.status(200).json({ reply: text });
    } catch (error) {
      console.error(
        "Error making request to Gemini API:",
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
