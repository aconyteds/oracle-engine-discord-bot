import { Client, Message } from "discord.js";
import { OpenAIClient } from "../adapters/openAI";
import { DBClient } from "../adapters/MongoDB";

type GenerateMessageInput = {
  client: Client;
  message: Message;
};

const generateMessage = async ({ client, message }: GenerateMessageInput) => {
  const ai = OpenAIClient.Instance;
  const db = DBClient.Instance;

  const { reference, content, id } = message;

  const originalMessageId = reference?.messageId;

  // parse the mention data from the message
  const prompt = content.replace(/<@!?\d+>/, "").trim();

  const thinkingMessage = await message.reply({
    content: "🤔 Let me think about that...",
  });

  try {
    let threadId;
    if (originalMessageId) {
      threadId = await db.getMessageThreadID(originalMessageId);
    }
    if (!threadId) {
      // Create a new thread for the assistant
      threadId = await ai.createThread();
      await db.storeThread(id, threadId);
    }

    // Generate a response from the AI
    const aiResponse = await ai.generateMessage(threadId, prompt);

    // Update the "thinking" message with the AI's response
    await thinkingMessage.edit({
      content: aiResponse,
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    await thinkingMessage.edit({
      content: "Sorry, I couldn't come up with a response.",
    });
  }
};

export default generateMessage;
