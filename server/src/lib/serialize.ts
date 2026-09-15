import type { Prisma } from '@prisma/client'

/** Decimal do Prisma vira número no JSON — os valores do domínio cabem com folga em double. */
export const toNumber = (d: Prisma.Decimal) => d.toNumber()

/** Datas trafegam como `YYYY-MM-DD`, que é o formato que o front já consome. */
export const toISODate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

/** `YYYY-MM-DD` para Date em UTC, sem deslocar o dia pelo fuso local. */
export const fromISODate = (s: string) => new Date(`${s}T00:00:00.000Z`)
