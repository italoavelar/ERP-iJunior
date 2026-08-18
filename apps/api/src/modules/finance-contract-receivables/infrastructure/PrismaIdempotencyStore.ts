import { Prisma, PrismaClient } from "@prisma/client";
import { CanonicalValue, IdempotencyFingerprint } from "../application/IdempotencyPolicy.js";
import { FinanceTransaction } from "./PrismaFinanceUnitOfWork.js";

export class IdempotencyConflictError extends Error { override name = "IdempotencyConflictError"; }
export interface CompletedIdempotency { key: string; commandType: string; actorUserId: string; fingerprint: IdempotencyFingerprint; resultType: string; resultId: string; resultPayload: Prisma.JsonValue; }

export class PrismaIdempotencyStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findCompleted(key: string): Promise<CompletedIdempotency | undefined> {
    const record = await this.prisma.idempotencyRecord.findUnique({ where: { key } });
    if (!record) return undefined;
    return {
      key: record.key, commandType: record.commandType, actorUserId: record.actorUserId,
      fingerprint: { canonicalParameters: record.semanticParameters as CanonicalValue, fingerprint: record.requestFingerprint },
      resultType: record.resultType, resultId: record.resultId, resultPayload: record.resultPayload
    };
  }

  async findCompletedInTransaction(tx: FinanceTransaction, key: string): Promise<CompletedIdempotency | undefined> {
    const record = await tx.idempotencyRecord.findUnique({ where: { key } });
    if (!record) return undefined;
    return {
      key: record.key, commandType: record.commandType, actorUserId: record.actorUserId,
      fingerprint: { canonicalParameters: record.semanticParameters as CanonicalValue, fingerprint: record.requestFingerprint },
      resultType: record.resultType, resultId: record.resultId, resultPayload: record.resultPayload
    };
  }

  assertReplayMatches(record: CompletedIdempotency, actorUserId: string, commandType: string, fingerprint: IdempotencyFingerprint): void {
    if (record.actorUserId !== actorUserId || record.commandType !== commandType || record.fingerprint.fingerprint !== fingerprint.fingerprint) {
      throw new IdempotencyConflictError("IDEMPOTENCY_CONFLICT");
    }
  }

  async complete(tx: FinanceTransaction, input: CompletedIdempotency): Promise<void> {
    await tx.idempotencyRecord.create({ data: {
      key: input.key, commandType: input.commandType, actorUserId: input.actorUserId,
      semanticParameters: input.fingerprint.canonicalParameters as Prisma.InputJsonValue,
      requestFingerprint: input.fingerprint.fingerprint, resultType: input.resultType, resultId: input.resultId,
      resultPayload: input.resultPayload === null ? Prisma.JsonNull : input.resultPayload as Prisma.InputJsonValue
    } });
  }
}
