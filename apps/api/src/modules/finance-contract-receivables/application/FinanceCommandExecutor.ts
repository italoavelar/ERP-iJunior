import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort, FinanceCapability } from "./FinanceCapability.js";
import { CanonicalValue, fingerprintCommand } from "./IdempotencyPolicy.js";
import { PrismaFinanceUnitOfWork } from "../infrastructure/PrismaFinanceUnitOfWork.js";
import { IdempotencyConflictError, PrismaIdempotencyStore } from "../infrastructure/PrismaIdempotencyStore.js";

export class FinanceCommandExecutor {
  constructor(private readonly authorization: AuthorizationPort, private readonly unitOfWork: PrismaFinanceUnitOfWork, private readonly idempotency: PrismaIdempotencyStore) {}
  async execute<T extends Prisma.InputJsonValue>(input: { actor: AuthenticatedCommandContext; capability: FinanceCapability; key: string; command: string; parameters: CanonicalValue; run: (tx: Prisma.TransactionClient) => Promise<{ type: string; id: string; payload: T }> }): Promise<T> {
    await this.authorization.require(input.actor.actorUserId, input.capability);
    const fingerprint = fingerprintCommand(input.command, input.parameters);
    const existing = await this.idempotency.findCompleted(input.key);
    if (existing) { this.idempotency.assertReplayMatches(existing, input.actor.actorUserId, input.command, fingerprint); return existing.resultPayload as T; }
    return this.unitOfWork.execute(async (tx) => {
      await this.unitOfWork.acquireIdempotencyLock(tx, input.key);
      const replay = await this.idempotency.findCompletedInTransaction(tx, input.key);
      if (replay) { this.idempotency.assertReplayMatches(replay, input.actor.actorUserId, input.command, fingerprint); return replay.resultPayload as T; }
      const result = await input.run(tx);
      await this.idempotency.complete(tx, { key: input.key, commandType: input.command, actorUserId: input.actor.actorUserId, fingerprint, resultType: result.type, resultId: result.id, resultPayload: result.payload });
      return result.payload;
    }).catch((error: unknown) => { if (error instanceof IdempotencyConflictError) throw error; throw error; });
  }
}
