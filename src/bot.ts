import { config } from "dotenv";
import { DiscordClient } from "./adapters/discord";
// import { OpenAIClient } from "./adapters/openAI";

config();

export const initializeBot = async () => {
  // const openAIClient = new OpenAIClient();
  const discordClient = DiscordClient.Instance;
  await discordClient.initializeGateway();
};
