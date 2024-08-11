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

  const { reference, content } = message;

  const originalMessageId = reference?.messageId;
  // parse the mention data from the message
  const prompt = content.replace(/<@!?\d+>/, "").trim();

  const thinkingMessage = await message.reply({
    content: "🤔 Let me think about that...",
  });

  let lastId = thinkingMessage.id;
  let threadId;

  try {
    if (originalMessageId) {
      try {
        threadId = await db.getMessageThreadID(originalMessageId);
      } catch (error) {
        console.warn("unable to get thread ID from DB:", error);
      }
    }
    if (!threadId) {
      // Create a new thread for the assistant
      threadId = await ai.createThread();
    }

    // Generate a response from the AI
    const aiResponse = await ai.generateMessage(threadId, prompt);

    // Update the "thinking" message with the AI's response
    const finalMessage = await thinkingMessage.edit({
      content: aiResponse,
    });
    lastId = finalMessage.id;
  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorUpdate = await thinkingMessage.edit({
      content: "Sorry, I couldn't come up with a response.",
    });
    lastId = errorUpdate.id;
  }
  if (!threadId) {
    return;
  }
  try {
    await db.storeThread(originalMessageId, lastId, threadId);
  } catch (error) {
    console.error("Error storing thread in DB:", error);
  }
};

export default generateMessage;
