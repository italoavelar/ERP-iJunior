import { PrismaClient } from '@prisma/client'
import { databaseUrl } from './databaseUrl.js'

/** Instância única — `tsx watch` recarrega o módulo e abriria uma conexão por reload. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
