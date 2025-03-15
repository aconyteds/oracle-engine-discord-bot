import { PrismaClient } from "@prisma/client";
import { DISCORD_SERVER_CONFIGURATIONS } from "./dbConfigurations.private";

const prisma = new PrismaClient();

async function main() {
  for (const config of DISCORD_SERVER_CONFIGURATIONS) {
    await prisma.serverConfigurations.upsert({
      where: { discordChannelId: config.discordChannelId },
      update: config,
      create: config,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
