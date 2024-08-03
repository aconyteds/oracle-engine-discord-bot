import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

describe("Discord Bot Login", () => {
  let client: Client;

  beforeAll(() => {
    client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });
  });

  afterAll(async () => {
    await client.destroy();
  });

  it("should login to Discord successfully", async () => {
    await new Promise<void>((resolve, reject) => {
      client.once("ready", () => {
        console.log("Logged in as", client.user?.tag);
        resolve();
      });

      client.login(process.env.DISCORD_TOKEN).catch((error) => {
        console.error("Login failed:", error);
        reject(error);
      });
    });

    // If we reach this point, the login was successful
    expect(client.user).not.toBeNull();
    expect(client.user?.tag).toBeDefined();
  });
});
