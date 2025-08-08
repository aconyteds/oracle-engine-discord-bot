import { ClientOptions, OpenAI } from "openai";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatResponse = {
  messageId: string;
  content: string;
};

/**
 * Represents a client for interacting with the OpenAI API.
 */
export class OpenAIClient {
  public static _instance: OpenAIClient;
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
  public static get Instance(): OpenAIClient {
    if (!OpenAIClient._instance) {
      OpenAIClient._instance = new OpenAIClient();
    }
    return OpenAIClient._instance;
  }

  /**
   * Retrieves available models from OpenAI.
   *
   * @returns {Promise<OpenAI.Models.ModelsPage>} A promise that resolves to available models.
   */
  public listModels = async (): Promise<OpenAI.Models.ModelsPage> => {
    console.log("Listing available models");
    const response = await this._ai.models.list();
    return response;
  };

  /**
   * Stores conversation history in memory (simple in-memory storage).
   */
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  /**
   * Gets conversation history for a given conversation ID.
   *
   * @param conversationId - The ID of the conversation.
   * @returns The conversation history.
   */
  public getConversationHistory = (conversationId: string): ChatMessage[] => {
    return this.conversationHistory.get(conversationId) || [];
  };

  /**
   * Creates a new conversation.
   * @returns The ID of the created conversation.
   */
  public createConversation = (): string => {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.conversationHistory.set(conversationId, []);
    return conversationId;
  };

  /**
   * Creates a conversation and generates an initial response.
   * @param prompt - The initial prompt.
   * @param model - The model to use (defaults to gpt-3.5-turbo).
   * @param systemPrompt - Optional system prompt.
   * @returns A promise that resolves to a ChatResponse object containing the conversation ID and response.
   */
  public createAndRunConversation = async (
    prompt: string,
    model: string = "gpt-3.5-turbo",
    systemPrompt?: string
  ): Promise<{ conversationId: string; response: ChatResponse }> => {
    const conversationId = this.createConversation();
    const response = await this.generateMessage(conversationId, prompt, model, systemPrompt);
    return {
      conversationId,
      response,
    };
  };

  /**
   * Adds a message to a conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @param message - The message to add.
   */
  public addMessage = (
    conversationId: string,
    message: ChatMessage
  ): void => {
    const history = this.conversationHistory.get(conversationId) || [];
    history.push(message);
    this.conversationHistory.set(conversationId, history);
  };

  /**
   * Generates a message using the OpenAI Chat Completions API.
   *
   * @param conversationId - The ID of the conversation.
   * @param prompt - The user prompt.
   * @param model - The model to use (defaults to gpt-3.5-turbo).
   * @param systemPrompt - Optional system prompt.
   * @returns A Promise that resolves to the generated response.
   */
  public generateMessage = async (
    conversationId: string,
    prompt: string,
    model: string = "gpt-3.5-turbo",
    systemPrompt?: string
  ): Promise<ChatResponse> => {
    const history = this.conversationHistory.get(conversationId) || [];
    
    // Add user message to history
    const userMessage: ChatMessage = { role: "user", content: prompt };
    this.addMessage(conversationId, userMessage);

    // Build messages array for API call
    const messages: ChatMessage[] = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    // Add conversation history
    messages.push(...history);

    try {
      const response = await this._ai.chat.completions.create({
        model,
        messages,
        stream: false,
      });

      const assistantMessage = response.choices[0]?.message?.content || "";
      const messageId = response.id;
      
      // Add assistant response to history
      const assistantChatMessage: ChatMessage = { role: "assistant", content: assistantMessage };
      this.addMessage(conversationId, assistantChatMessage);

      return {
        messageId,
        content: assistantMessage,
      };
    } catch (error) {
      console.error("Error generating message:", error);
      throw error;
    }
  };
}
