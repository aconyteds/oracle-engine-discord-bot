import { config } from "dotenv";
import express, { Express } from "express";
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from "discord-interactions";
import { initializeBot } from "./bot";
import { OpenAIClient } from "./adapters/openAI";

config();

export const main = (): Express => {
  // Create an express app
  const app = express();
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

  /**
   * Interactions endpoint URL where Discord will send HTTP requests
   * Parse request body and verifies incoming requests using discord-interactions package
   */
  app.post(
    "/interactions",
    verifyKeyMiddleware(publicKey),
    async function (req, res) {
      // Interaction type and data
      const { type, data } = req.body;

      /**
       * Handle verification requests
       */
      if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
      }

      /**
       * Handle slash command requests
       * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
       */
      if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        // "test" command
        if (name === "test") {
          // Send a message into the channel where command was triggered from
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              // Fetches a random emoji to send from a helper function
              content: `hello world`,
            },
          });
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: "unknown command" });
      }

      console.error("unknown interaction type", type);
      return res.status(400).json({ error: "unknown interaction type" });
    }
  );

  return app;
};
