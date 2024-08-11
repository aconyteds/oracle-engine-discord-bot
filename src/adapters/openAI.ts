import { ClientOptions, OpenAI } from "openai";
import { AssistantsPage } from "openai/resources/beta/assistants";

type CreateThreadPayload = {
  threadId: string;
  runId: string;
};

/**
 * Represents a client for interacting with the OpenAI API.
 */
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

  /**
   * Retrieves a list of assistants associated with the API key.
   *
   * @returns {Promise<AssistantsPage>} A promise that resolves to an AssistantsPage object containing the list of assistants.
   */
  public listAssistants = async (): Promise<AssistantsPage> => {
    console.log("Listing assistants associated with the API key");
    const response = await this._ai.beta.assistants.list({
      order: "desc",
      limit: 20,
    });
    return response;
  };

  /**
   * Finds a thread by its ID.
   *
   * @param threadId - The ID of the thread to find.
   * @returns A promise that resolves to the retrieved thread.
   */
  public findThread = async (
    threadId: string
  ): Promise<OpenAI.Beta.Threads.Thread> => {
    console.log(`Finding thread: ${threadId}`);
    const response = await this._ai.beta.threads.retrieve(threadId);
    return response;
  };

  /**
   * Retrieves a list of runs for a given thread.
   *
   * @param threadId - The ID of the thread.
   * @returns A Promise that resolves to a RunsPage object containing the list of runs.
   */
  public listRuns = async (
    threadId: string
  ): Promise<OpenAI.Beta.Threads.Runs.RunsPage> => {
    console.log(`Listing runs for thread: ${threadId}`);
    const response = await this._ai.beta.threads.runs.list(threadId);
    return response;
  };

  /**
   * Creates a thread.
   * @returns The ID of the created thread.
   */
  public createThread = async (): Promise<string> => {
    const response = await this._ai.beta.threads.create();
    return response.id;
  };

  /**
   * Creates and runs a thread in the OpenAI assistant.
   * @param prompt - The prompt for the thread.
   * @returns A promise that resolves to a CreateThreadPayload object containing the thread ID and run ID.
   */
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

  /**
   * Adds a message to a thread.
   *
   * @param threadId - The ID of the thread.
   * @param prompt - The content of the message.
   * @returns A promise that resolves when the message is added.
   */
  public addMessage = async (
    threadId: string,
    prompt: string
  ): Promise<void> => {
    await this._ai.beta.threads.messages.create(threadId, {
      role: "user",
      content: prompt,
    });
  };

  /**
   * Generates a message using the OpenAI API.
   *
   * @param threadId - The ID of the thread.
   * @param prompt - The optional prompt for the message.
   * @returns A Promise that resolves to the generated message.
   */
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
