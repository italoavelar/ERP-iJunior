import { Prisma, PrismaClient } from "@prisma/client";

export type FinanceTransaction = Prisma.TransactionClient;
export class ConcurrentOperationError extends Error { override name = "ConcurrentOperationError"; }
export class PaymentPlanAlreadyExistsError extends Error { override name = "PaymentPlanAlreadyExistsError"; }

function sqlState(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
}

/** Translates Prisma's unique violation without exposing persistence details to a use case. */
export function translatePaymentPlanCardinalityConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new PaymentPlanAlreadyExistsError("PAYMENT_PLAN_ALREADY_EXISTS");
  }
  throw error;
}

/** Owns the only accepted interactive transaction and payment-plan locking protocol. */
export class PrismaFinanceUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(operation: (tx: FinanceTransaction) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      } catch (error) {
        if ((sqlState(error) === "40P01" || sqlState(error) === "40001") && attempt < 2) continue;
        if (sqlState(error) === "40P01" || sqlState(error) === "40001") throw new ConcurrentOperationError("CONCURRENT_OPERATION_CONFLICT");
        throw error;
      }
    }
    throw new ConcurrentOperationError("CONCURRENT_OPERATION_CONFLICT");
  }

  async acquireIdempotencyLock(tx: FinanceTransaction, key: string): Promise<void> {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
  }

  async lockPaymentPlan(tx: FinanceTransaction, paymentPlanId: string): Promise<void> {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "PaymentPlan" WHERE "id" = ${paymentPlanId}::uuid FOR UPDATE`);
  }
}
