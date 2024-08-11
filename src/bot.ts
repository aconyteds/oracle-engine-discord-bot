import { config } from "dotenv";
import { DiscordClient } from "./adapters/discordClient";

config();

export const initializeBot = async () => {
  const discordClient = DiscordClient.Instance;
  await discordClient.initializeGateway();
};
