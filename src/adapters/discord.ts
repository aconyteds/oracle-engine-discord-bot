import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Interaction,
} from "discord.js";

export class DiscordClient {
  private _instance!: DiscordClient;
  private _token!: string;
  private _client!: Client;
  constructor() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.error("DISCORD_TOKEN is not defined");
      return;
    }
    this._token = token;
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this._client = client;

    client.once("ready", this.heandleReady);
    client.on("interactionCreate", this.handleInteractionCreate);

    client.login(this._token);
  }

  // Singleton pattern, returns an instance of DiscordClient
  get Instance() {
    if (!this._instance) {
      this._instance = new DiscordClient();
    }
    return this._instance;
  }

  private async heandleReady() {
    console.log("Ready!");

    // Register the /oracle slash command
    const rest = new REST({ version: "10" }).setToken(this._token);
    const commands = [
      {
        name: "oracle",
        description: "Invoke the Oracle",
      },
    ];

    try {
      console.log("Started refreshing application (/) commands.");
      if (!this._client.user) {
        console.error("Client user is not defined");
        return;
      }
      await rest.put(Routes.applicationCommands(this._client.user.id), {
        body: commands,
      });
      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
    }
  }

  private async handleInteractionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "oracle") {
      try {
        await interaction.user.send("Hello world");
        await interaction.reply({
          content: "I have sent you a private message!",
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error sending private message:", error);
        await interaction.reply({
          content: "Failed to send you a private message.",
          ephemeral: true,
        });
      }
    }
  }
}
