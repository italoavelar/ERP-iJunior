/**
 * Build da API na Vercel.
 *
 * - gera o Prisma Client sempre: a Vercel reaproveita node_modules entre
 *   deploys e serviria um client desatualizado depois de mudar o schema
 * - aplica as migrations só no deploy de produção, para que o preview de uma
 *   branch não altere o banco de produção
 * - compila para dist/, que é o que api/index.js importa
 */
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL nas variáveis de ambiente do projeto na Vercel.')
  process.exit(1)
}

run('npx prisma generate')

if (process.env.VERCEL_ENV === 'production') {
  // Migrations pela conexão direta, quando o Neon fornece uma (ver src/lib/databaseUrl.ts).
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL },
  })
} else {
  console.log(`VERCEL_ENV=${process.env.VERCEL_ENV ?? 'local'}: migrations não aplicadas (só em produção).`)
}

run('npx tsc -p tsconfig.json')

// A API não tem arquivos estáticos; a Vercel só exige que o diretório exista.
mkdirSync('public', { recursive: true })
