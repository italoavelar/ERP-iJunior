import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

// Carrega server/.env quando existe. Em produção as variáveis vêm do ambiente,
// e as já definidas têm precedência sobre o arquivo.
const envFile = fileURLToPath(new URL('../.env', import.meta.url))
if (existsSync(envFile)) process.loadEnvFile(envFile)

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Variáveis de ambiente inválidas:\n${issues}`)
}

/**
 * Origens do CORS, separadas por vírgula. Um `*` vale qualquer trecho, o que
 * cobre os previews da Vercel: `https://erp-ijunior-*.vercel.app`.
 */
const corsOrigin = (pattern: string): string | RegExp =>
  pattern.includes('*')
    ? new RegExp(`^${pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\/]/g, '\\$&')).join('[^/]*')}$`)
    : pattern.replace(/\/+$/, '')

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(corsOrigin),
}
