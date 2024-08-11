import { Client, Message, GatewayIntentBits } from "discord.js";
import { generateMessage } from "../services";

export class DiscordClient {
  public static _instance: DiscordClient;
  private _token!: string;
  private _applicationId!: string;
  private _client!: Client;

  private constructor() {
    this._token = process.env.DISCORD_TOKEN || "";
    this._applicationId = process.env.DISCORD_APPLICATION_ID || "";

    this._client = new Client({
      ws: {
        version: 10,
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });
  }

  // Singleton pattern, returns an instance of DiscordClient
  public static get Instance(): DiscordClient {
    if (!DiscordClient._instance) {
      DiscordClient._instance = new DiscordClient();
    }
    return DiscordClient._instance;
  }

  public set Token(token: string) {
    this._token = token;
  }

  public get Token(): string {
    if (!this._token) {
      console.error(
        "Token is not defined, unable to initialize gateway. Please ensure the proper variables are set, and that you have passed the token using DiscordClient.Token."
      );
      process.exit(1);
    }
    return this._token;
  }

  /**
   * Method to initialize the gateway connection to Discord. Requires that `Token` and `Intents` are set.
   * @returns
   */
  public initializeGateway = async () => {
    if (!this._client) {
      console.error(
        "Client is not defined, unable to initialize gateway. Please ensure the proper variables are set, and that you have passed the token using DiscordClient.Token."
      );
      process.exit(1);
    }
    this._client.login(this.Token);

    this._client.once("ready", this.handleReady);
    this._client.on("error", this.handleError);
    this._client.on("messageCreate", this.handleMessage);
  };

  private handleReady = () => {
    console.log("Client is ready!");
  };

  private handleError = (error: Error) => {
    console.error("Error with WebSocket Connection to Discord:", error);
  };

  // This is the most important method in this class. It handles all incoming messages from the gateway, and routes them to the proper handlers.
  private handleMessage = (message: Message) => {
    if (message.content === "!ping") {
      message.channel.send("Pong!");
      return;
    }
    const { author, mentions, channelId } = message;
    if (!process.env.DISCORD_CHANNEL_ID) {
      console.log("No channel ID provided, nothing to monitor.");
      return;
    }
    const channelList = process.env.DISCORD_CHANNEL_ID.split(",");
    if (!channelList.includes(channelId)) {
      console.log(`Bot not listening to this channel.${channelId}`);
      return;
    }

    // Check if the message author is the bot itself
    if (author.id === this._applicationId) {
      return;
    }

    // Check if the bot is mentioned in the message
    const areYouTalkingToMe = mentions.users.has(this._applicationId);

    if (!areYouTalkingToMe) {
      return;
    }
    generateMessage({
      client: this._client,
      message,
    });
  };
}
