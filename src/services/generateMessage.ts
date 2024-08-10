import { Client, Message } from "discord.js";

type GenerateMessageInput = {
  client: Client;
  message: Message;
};

const generateMessage = async ({ client, message }: GenerateMessageInput) => {
  const { author, content } = message;

  const { username, discriminator } = author;

  console.log(`${username}#${discriminator}: ${content}`);

  // Send a response to the same channel
  await message.channel.send({
    content: `You said: ${content}`,
  });
};

export default generateMessage;
