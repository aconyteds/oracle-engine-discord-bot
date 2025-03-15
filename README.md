This is a Discord Bot intended to work with an OpenAI Assistant to provide AI Assisted Answers for a configured Campaign.

# Local Development

This service is built using NodeJS and Typescript. To get started, you will need to have NodeJS installed on your machine. You will need to run `npm ci` to install the dependencies.

The Service uses Prisma to work with a MongoDB. You will need to install MongoDB on your machine and configure the connection string in the `.env` file using the `DATABASE_URL` variable. This will need to look something like the following:

```bash
mongodb://127.0.0.1:37018/DiscordBot?directConnection=true&retryWrites=true&w=majority
```

You will also need a couple of other values in the Environment file:

```bash
OPENAI_API_KEY
DISCORD_TOKEN
DISCORD_APPLICATION_ID # The ID of the Bot Account
DISCORD_PUBLIC_KEY
```

You can get the `OPENAI_API_KEY` from the OpenAI Dashboard. The `DISCORD_TOKEN` is the Bot Token you get from the Discord Developer Portal. The `DISCORD_APPLICATION_ID` and `DISCORD_PUBLIC_KEY` are used for the Interaction Endpoint. These variables should be set to the values you get from the respective providers.

## Seeding the Database

To get started using the application, you will need to format the DB so that the collections exist, and you will want to seed the `ServerConfigurations` Collection with data relative to your own Discord Server. You can do this by running the following command:

```bash
npm run seed
```

This will not work without first creating a `dbConfigurations.private.ts` file in the `scripts` directory. This file should look like the following:

```typescript
import { ServerConfigurations } from "@prisma/client";

export const DISCORD_SERVER_CONFIGURATIONS: Omit<
  ServerConfigurations,
  "id" | "dateCreated" | "dateUpdated"
>[] = [
  {
    active: true,
    nickname: `Your Test Server Channel Name`,
    assistantId: "The ID of the assistant in your OpenAI account",
    discordGuildId: "Your Guild ID",
    discordChannelId: "Your Channel ID",
  },
];
```

Once you have the configurations in place, you can run the seed command to populate the database with the necessary data so that the server will listen for messages in the correct channel. When this is running, and you have registered the bot with your Discord Server, you should be able to start this server with the following command:

```bash
npm run dev
```

This will run the server, and make the WebSocket connection to discord. As messages are received, the server will check that the channel is currently active, and pull the appropriate assistant to respond. The Server configuration will be stored in memory for 24 hours to prevent hammering the DB repeatedly for an invalid configuration.

So long as the bot has been added to a channel, the server configuration is in place, and the assistant is correctly configured, the bot should respond to messages in the channel with the appropriate responses from the assistant. If the configuration is not valid or the assistant is not set up correctly, the bot will not respond.
