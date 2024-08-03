import { DiscordClient } from "./adapters/discord";
import { OpenAIClient } from "./adapters/openAI";
import { config } from "dotenv";

config();

const main = async () => {
  const discordClient = new DiscordClient();
  const openAIClient = new OpenAIClient();

  const client = discordClient.Instance;

  client.Instance;
};

main();
