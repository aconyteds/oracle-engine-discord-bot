import { ClientOptions, OpenAI } from "openai";
import { config } from "dotenv";

config();

export class OpenAIClient {
  private _instance!: OpenAIClient;
  private _ai!: OpenAI;
  constructor() {
    const clientOptions: ClientOptions = {
      apiKey: process.env.OPENAI_API_KEY,
    };
    this._ai = new OpenAI(clientOptions);
  }

  // Singleton pattern, returns an instance of OpenAIClient
  get Instance() {
    if (!this._instance) {
      this._instance = new OpenAIClient();
    }
    return this._instance;
  }
}
