import { config } from "dotenv";
import express, { Express } from "express";
import { initializeBot } from "./bot";
import { OpenAIClient } from "./adapters/openAI";
import { authenticateToken, login } from "./middleware/authentication";

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

  // Must login to use any other methods
  app.post("/login", login);

  app.use(authenticateToken);

  app.get("/assistants", async (req, res) => {
    const ai = OpenAIClient.Instance;
    const threads = await ai.listAssistants();
    res.status(200).send(threads);
  });

  app.get("/threads/:threadId", async (req, res) => {
    const ai = OpenAIClient.Instance;
    const threadId = req.params.threadId;
    const thread = await ai.findThread(threadId);
    res.status(200).send(thread);
  });

  app.get("/threads/:threadId/runs", async (req, res) => {
    const ai = OpenAIClient.Instance;
    const threadId = req.params.threadId;
    const runs = await ai.listRuns(threadId);
    res.status(200).send(runs);
  });

  return app;
};
