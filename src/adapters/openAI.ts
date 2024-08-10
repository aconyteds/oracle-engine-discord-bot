import { ClientOptions, OpenAI } from "openai";
import { AssistantsPage } from "openai/resources/beta/assistants";
import { Text } from "openai/resources/beta/threads/messages";

// TODO:: Switch to a DB for storing thread information so that it persists across restarts
// discord.originalMessageId -> OpenAI.threadId
const THREAD_LOOKUP = new Map<string, string>();

type CreateThreadPayload = {
  threadId: string;
  runId: string;
};

export class OpenAIClient {
  public static _instance: OpenAIClient;
  private _ai!: OpenAI;
  private _assistantId!: string;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this._assistantId = process.env.OPENAI_ASSISTANT_ID || "";
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

  public storeThread = (discordMessageId: string, openAIThreadId: string) => {
    THREAD_LOOKUP.set(discordMessageId, openAIThreadId);
  };

  public getThread = (discordMessageId: string) => {
    return THREAD_LOOKUP.get(discordMessageId);
  };

  // List all of the assistants tied to the API key
  public listAssistants = async (): Promise<AssistantsPage> => {
    console.log("Listing assistants associated with the API key");
    const response = await this._ai.beta.assistants.list({
      order: "desc",
      limit: 20,
    });
    return response;
  };

  // Find an existing thread by ID
  public findThread = async (
    threadId: string
  ): Promise<OpenAI.Beta.Threads.Thread> => {
    console.log(`Finding thread: ${threadId}`);
    const response = await this._ai.beta.threads.retrieve(threadId);
    return response;
  };

  // List all runs for a Thread
  public listRuns = async (
    threadId: string
  ): Promise<OpenAI.Beta.Threads.Runs.RunsPage> => {
    console.log(`Listing runs for thread: ${threadId}`);
    const response = await this._ai.beta.threads.runs.list(threadId);
    return response;
  };

  /**
   * This method can be used to create a new thread.
   *
   * @param prompt A Text prompt to create a new thread with.
   * @returns ThreadID that can be used to lookup the response from the assistant.
   */
  public createThread = async (): Promise<string> => {
    const response = await this._ai.beta.threads.create();
    return response.id;
  };

  public createAndRunThread = async (
    prompt: string
  ): Promise<CreateThreadPayload> => {
    const response = await this._ai.beta.threads.createAndRun({
      assistant_id: this._assistantId,
      thread: {
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
    });
    return {
      threadId: response.thread_id,
      runId: response.id,
    };
  };

  // Add a message to a thread
  public addMessage = async (
    threadId: string,
    prompt: string
  ): Promise<void> => {
    await this._ai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt,
    });
  };

  // Generate a message for a thread
  public generateMessage = async (
    threadId: string,
    prompt?: string
  ): Promise<string> => {
    let response = "";
    const run = await this._ai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: this._assistantId,
      stream: false,
      additional_messages: prompt ? [{ role: "user", content: prompt }] : [],
    });

    if (run.status === "completed") {
      const messages = await this._ai.beta.threads.messages.list(run.thread_id);
      const messageList = messages.data;
      const latestMessage = messageList[0].content[0];
      if (latestMessage.type === "text") {
        response = latestMessage.text.value;
      }
    } else {
      console.log(run.status);
    }

    return response;
  };
}
