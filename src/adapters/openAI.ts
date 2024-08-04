import { ClientOptions, OpenAI } from "openai";
export class OpenAIClient {
  private _instance!: OpenAIClient;
  private _ai!: OpenAI;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not defined");
      return;
    }
    const clientOptions: ClientOptions = {
      apiKey,
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
