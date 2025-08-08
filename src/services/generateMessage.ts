import { Client, Message } from "discord.js";
import { OpenAIClient } from "../adapters/openAI";
import { DBClient } from "../adapters/MongoDB";

type GenerateMessageInput = {
  client: Client;
  message: Message;
  assistantId: string;
};

const generateMessage = async ({
  client,
  message,
  assistantId,
}: GenerateMessageInput) => {
  const ai = OpenAIClient.Instance;
  const db = DBClient.Instance;

  const { reference, content } = message;

  const originalMessageId = reference?.messageId;
  // parse the mention data from the message
  const prompt = content.replace(/<@!?\d+>/, "").trim();

  const thinkingMessage = await message.reply({
    content: "🤔 Let me think about that...",
  });
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
    // Store the Original Message
    await db.storeThread(message, threadId);
    // Store the "thinking" message
    await db.storeThread(thinkingMessage, threadId);

    // Generate a response from the AI
    let aiResponse = await ai.generateMessage(threadId, assistantId, prompt);

    // Discord message length limit is 2000 characters, force the string length
    const stringLength = aiResponse.length;
    if (stringLength > 2000) {
      aiResponse =
        aiResponse.substring(0, 1963) +
        "...\n\n There I go droning on again...";
    }
    // Update the "thinking" message with the AI's response
    const finalMessage = await thinkingMessage.edit({
      content: aiResponse.substring(0, 2000),
    });
    // Store the Final Message ID
    await db.storeThread(finalMessage, threadId);
  } catch (error) {
    console.error("Error generating AI response:", error);
    const errorUpdate = await thinkingMessage.edit({
      content: "Sorry, I couldn't come up with a response.",
    });
    await db.storeThread(errorUpdate, threadId);
  }
};

export default generateMessage;
