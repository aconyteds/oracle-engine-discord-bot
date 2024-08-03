import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

describe("Discord Bot Login", () => {
  it("should login to Discord successfully", async () => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    let loginSuccessful = false;

    client.once("ready", () => {
      console.log("Logged in as", client.user?.tag);
      loginSuccessful = true;
      client.destroy(); // Disconnect the client after login
    });

    await client.login(process.env.DISCORD_TOKEN).catch((error) => {
      console.error("Login failed:", error);
    });

    expect(loginSuccessful).toBe(true);
  });
});
