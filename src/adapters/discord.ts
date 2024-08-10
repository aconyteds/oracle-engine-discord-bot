import {
  GatewayHeartbeatRequest,
  GatewayOpcodes,
  GatewayIdentify,
  Message,
  GatewayActivity,
  GatewayDispatchEvents,
  GatewayReceivePayload,
  GatewayHelloData,
  GatewayReadyDispatchData,
  GatewayMessageCreateDispatchData,
  GatewayIntentBits,
} from "discord.js";
import ws from "ws";
import Axios from "axios";

const DISCORD_GATEWAY_URL = "wss://gateway.discord.gg";
const RETRY_INTERVAL = 5000;

export class DiscordClient {
  public static _instance: DiscordClient;
  private _token!: string;
  private _applicationId!: string;
  private _intents!: number;
  // private _client!: Client;
  private _gatewayClient!: ws;
  private _sessionId!: string;
  private _connectionEstablished = false;
  private _heartbeatInterval = 5000;
  private _heartbeatIntervalId!: NodeJS.Timeout;
  private _sequenceNumber: number | null = -1;
  private gatewayUrl = DISCORD_GATEWAY_URL;

  private constructor() {
    this._token = process.env.DISCORD_TOKEN || "";
    this._applicationId = process.env.DISCORD_APPLICATION_ID || "";
    this._intents = parseInt(process.env.DISCORD_PERMISSION_INTENT || "0", 10);
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

  public set Intents(intents: number) {
    this._intents = intents;
  }

  public get Intents(): number {
    return this._intents;
  }

  /**
   * Method to initialize the gateway connection to Discord. Requires that `Token` and `Intents` are set.
   * @returns
   */
  public initializeGateway = async () => {
    await this.getGatewayUrl();

    if (this._gatewayClient && this._gatewayClient.readyState === ws.CLOSED) {
      this._gatewayClient.close();
    }

    this._connectionEstablished = false;

    this._gatewayClient = new ws(this.gatewayUrl + "/?v=10&encoding=json");

    this._gatewayClient.on("open", this.handleOpen);
    this._gatewayClient.on("error", this.handleError);
    this._gatewayClient.on("close", this.handleClose);
    this._gatewayClient.on("message", this.handleMessage);
  };

  private handleOpen = () => {
    if (DISCORD_GATEWAY_URL !== this.gatewayUrl) {
      const resumePayload = {
        op: GatewayOpcodes.Resume,
        d: {
          token: this._token,
          session_id: this._sessionId,
          seq: this._sequenceNumber,
        },
      };

      this._gatewayClient.send(JSON.stringify(resumePayload));
    }
  };

  private handleError = (error: Error) => {
    console.error("Error with WebSocket Connection to Discord:", error);
  };

  private handleClose = () => {
    if (this._connectionEstablished) {
      console.log("Gateway connection closed, trying to reconnect");
    }

    setTimeout(async () => {
      await this.initializeGateway();
    }, RETRY_INTERVAL);
  };

  // This is the most important method in this class. It handles all incoming messages from the gateway, and routes them to the proper handlers.
  private handleMessage = (data: ws.Data) => {
    // This is where we handle the incoming messages from the gateway
    const message = JSON.parse(data.toString()) as GatewayReceivePayload;
    // console.log("Received message:", JSON.stringify(message, null, 10));
    const { t, op, d, s } = message;

    switch (op as GatewayOpcodes) {
      case GatewayOpcodes.Hello:
        const { heartbeat_interval } = d as GatewayHelloData;
        this._heartbeatInterval = heartbeat_interval;
        this._connectionEstablished = true;
        this.initializeHeartbeat();
        if (DISCORD_GATEWAY_URL === this.gatewayUrl) {
          console.log(this.Intents);
          const payload: GatewayIdentify = {
            op: GatewayOpcodes.Identify,
            d: {
              token: this.Token,
              intents: this.Intents,
              properties: {
                os: "windows",
                browser: "oracle-engine",
                device: "oracle-engine",
              },
            },
          };
          // console.log(
          //   "Sending Identify payload:",
          //   JSON.stringify(payload, null, 2)
          // );
          this._gatewayClient.send(JSON.stringify(payload));
        }
        break;
      case GatewayOpcodes.Heartbeat:
        this.heartbeat();
        break;
      case 0:
        this._sequenceNumber = s;
        break;
    }

    switch (t as GatewayDispatchEvents) {
      case GatewayDispatchEvents.Ready:
        console.log("Gateway connection ready!");
        const { session_id, resume_gateway_url } =
          d as GatewayReadyDispatchData;
        this._sessionId = session_id;
        this.gatewayUrl = resume_gateway_url;
        break;
      case GatewayDispatchEvents.Resumed:
        console.log("Gateway connection resumed!");
        break;
      case GatewayDispatchEvents.MessageCreate:
        const { author, mentions, content } =
          d as GatewayMessageCreateDispatchData;
        if (author.id === this._applicationId) {
          return;
        }
        const areYouTalkingToMe = mentions.some(
          ({ id }) => id === this._applicationId
        );
        if (areYouTalkingToMe) {
          const { username, discriminator } = author;

          console.log(`${username}#${discriminator}: ${content}`);
          // TODO:: Add the Request to call the OpenAI API
        }
      // case "INTERACTION_CREATE":
      //   this.handleInteractionCreate(d);
      //   break;
    }
  };

  // Method to initialize the heartbeat interval, must be done after receiving the Hello payload from the gateway
  private initializeHeartbeat = () => {
    if (this._heartbeatIntervalId) clearInterval(this._heartbeatIntervalId);

    this._heartbeatIntervalId = setInterval(
      this.heartbeat,
      this._heartbeatInterval
    );
  };

  // Method to send a heartbeat to the gateway
  private heartbeat = () => {
    // console.log("Heartbeat");
    this._gatewayClient.send(
      JSON.stringify({
        op: GatewayOpcodes.Heartbeat,
        d: this._sequenceNumber,
      } as GatewayHeartbeatRequest)
    );
  };

  // Method to dynamically lookup the discord gateway URL
  public getGatewayUrl = async () => {
    try {
      const response = await Axios.get("https://discord.com/api/v10/gateway");
      this.gatewayUrl = response.data.url;
    } catch (error) {
      console.error("Error getting gateway URL:", error);
    }
  };
}
