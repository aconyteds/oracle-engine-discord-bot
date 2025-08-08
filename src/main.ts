import { config } from "dotenv";
import express, { Express } from "express";
import { initializeBot } from "./bot";
import { OpenAIClient } from "./adapters/openAI";
import { authenticateToken } from "./middleware/authentication";

config();

export const main = (): Express => {
  // Create an express app
  const app = express();
  // Middleware to parse JSON bodies
  app.use(express.json());

  // Middleware to parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("DISCORD_PUBLIC_KEY is not defined");
    process.exit(1);
  }

  // Initialize the bot
  initializeBot();

  app.get("/healthCheck", (req, res) => {
    res.status(200).send(true);
  });

  app.get("/models", authenticateToken, async (req, res) => {
    const ai = OpenAIClient.Instance;
    const models = await ai.listModels();
    res.status(200).send(models);
  });

  app.get("/conversations/:conversationId/history", authenticateToken, async (req, res) => {
    const ai = OpenAIClient.Instance;
    const conversationId = req.params.conversationId;
    const history = ai.getConversationHistory(conversationId);
    res.status(200).send(history);
  });

  app.post("/conversations", authenticateToken, async (req, res) => {
    const ai = OpenAIClient.Instance;
    const conversationId = ai.createConversation();
    res.status(201).send({ conversationId });
  });

  return app;
};
