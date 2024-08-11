import { config } from "dotenv";
import { DiscordClient } from "./adapters/discordClient";
import { OpenAIClient } from "./adapters/openAI";
import { DBClient } from "./adapters/MongoDB";

config();

export const initializeBot = async () => {
  const discordClient = DiscordClient.Instance;
  await DBClient.Instance;
  await discordClient.initializeGateway();
};
