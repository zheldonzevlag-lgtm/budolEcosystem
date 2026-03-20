import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://budolpostgres:r00tPassword2026!@budol-db-production.cnu6imkq689x.ap-southeast-1.rds.amazonaws.com:5432/budolshap_1db"
    }
  }
})

async function main() {
  const result = await prisma.systemSettings.update({
    where: { id: "default" },
    data: {
      realtimeProvider: "SOCKET_IO",
      socketUrl: "https://budolws.duckdns.org"
    }
  })
  console.log("Successfully updated settings:", result.realtimeProvider, result.socketUrl)
}

main().catch(console.error).finally(() => prisma.$disconnect())
