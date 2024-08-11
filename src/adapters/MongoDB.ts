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
      const db = client.db(""); // Use the default database specified in the URI
      this._db = db;
      console.log("Connected to MongoDB Atlas");
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
    discordMessageId: string,
    openAIThreadId: string
  ): Promise<WithId<MessageThread> | null> => {
    const result = await this._db
      .collection<MessageThread>("MessageThread")
      .findOneAndUpdate(
        { discordMessageId },
        {
          $set: {
            lastUpdated: new Date(),
          },
          $inc: {
            messageCount: 1,
          },
          $setOnInsert: {
            openAIThreadId,
            discordMessageId,
            dateCreated: new Date(),
          },
        },
        {
          upsert: true, // Insert a new document if none exists
          projection: { _id: 0 }, // Exclude the _id field from the returned document
          returnDocument: "after", // Return the document after the update is applied
        }
      );

    // The `result.value` will contain the document after the operation is applied
    return result;
  };
}
