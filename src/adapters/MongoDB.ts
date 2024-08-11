import { MongoClient, Db, UUID, WithId } from "mongodb";
import { config } from "dotenv";

config();

type MessageThread = {
  id: UUID;
  discordMessageId: string;
  openAIThreadId: string;
  messageCount: number;
  dateCreated: Date;
  lastUpdated: Date;
};

export class DBClient {
  public static _instance: DBClient;
  private _db!: Db;

  constructor() {
    const mongoUri = process.env.MONGO_URI || "";
    if (!mongoUri) {
      console.error("MONGO_URI is not defined");
      process.exit(1);
    }
    this.connectToMongoDB(mongoUri);
  }

  public static get Instance(): DBClient {
    if (!DBClient._instance) {
      DBClient._instance = new DBClient();
    }
    return DBClient._instance;
  }
  private connectToMongoDB = async (mongoUri: string) => {
    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db("DiscordBot"); // Use the default database specified in the URI
      this._db = db;
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  };

  public getMessageThreadID = async (discordMessageId: string) => {
    const existingThread = await this._db
      .collection<MessageThread>("MessageThread")
      .findOne(
        { discordMessageId },
        {
          projection: {
            openAIThreadId: 1,
          },
        }
      );
    return existingThread?.openAIThreadId;
  };

  public storeThread = async (
    referencedMessageId: string | undefined,
    discordMessageId: string,
    openAIThreadId: string
  ): Promise<WithId<MessageThread> | null> => {
    // Find the previous item based on the referenced message ID
    const prevItem = await this._db
      .collection<MessageThread>("MessageThread")
      .findOne({
        discordMessageId: referencedMessageId,
      });

    // Use the previous item's discordMessageId if it exists; otherwise, use the current discordMessageId
    const targetDiscordMessageId =
      prevItem?.discordMessageId || discordMessageId;

    // Perform the upsert operation
    const result = await this._db
      .collection<MessageThread>("MessageThread")
      .findOneAndUpdate(
        {
          discordMessageId: targetDiscordMessageId,
        },
        {
          $set: {
            lastUpdated: new Date(),
          },
          $inc: {
            messageCount: 1,
          },
          $setOnInsert: {
            discordMessageId: targetDiscordMessageId,
            openAIThreadId,
            dateCreated: new Date(),
          },
        },
        {
          upsert: true, // Insert a new document if none exists
          returnDocument: "after", // Return the document after the update is applied
        }
      );
    return result;
  };
}
