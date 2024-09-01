import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Message } from "discord.js";

config();

export type StoreThreadInput = {
  discordMessageId: string;
  openAIThreadId: string;
  discordChannelId: string;
  discordUserId: string;
  discordGuildId: string | null;
};

export class DBClient {
  public static _instance: DBClient;
  private _db!: PrismaClient;

  constructor() {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not defined");
      process.exit(1);
    }
    const client = new PrismaClient();
    this._db = client;
  }

  public static get Instance(): DBClient {
    if (!DBClient._instance) {
      DBClient._instance = new DBClient();
    }
    return DBClient._instance;
  }

  public getMessageThreadID = async (discordMessageId: string) => {
    const existingThread = await this._db.messageThread.findFirst({
      where: {
        discordMessageId,
      },
      select: {
        openAIThreadId: true,
      },
    });
    return existingThread?.openAIThreadId;
  };

  public storeThread = async (
    data: Message,
    openAIThreadId?: string
  ): Promise<void> => {
    try {
      await this._db.messageThread.create({
        data: {
          openAIThreadId: openAIThreadId || "",
          discordMessageId: data.id,
          discordChannelId: data.channelId,
          discordUserId: data.author.id,
          discordGuildId: data.guildId,
          discordUsername: data.author.displayName,
        },
      });
    } catch (error) {
      console.error("Error storing thread in DB:", error);
    }
  };
}
