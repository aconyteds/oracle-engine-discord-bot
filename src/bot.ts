import { config } from "dotenv";
import { DiscordClient } from "./adapters/discord";
// import { OpenAIClient } from "./adapters/openAI";

config();

export const initializeBot = async () => {
  // const openAIClient = new OpenAIClient();
  const discordClient = DiscordClient.Instance;
  // discordClient.Intents = parseInt(
  //   process.env.DISCORD_PERMISSION_INTEGER || "0",
  //   10
  // );
  await discordClient.initializeGateway();
};
