/**
 * URL do banco. A integração do Neon na Vercel cria DATABASE_URL (com pool de
 * conexões) e DATABASE_URL_UNPOOLED (direta). O Prisma se dá melhor com a
 * direta — o pool em modo transação atrapalha migrations e prepared
 * statements —, então ela tem preferência quando existe.
 */
export const databaseUrl = () => process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
