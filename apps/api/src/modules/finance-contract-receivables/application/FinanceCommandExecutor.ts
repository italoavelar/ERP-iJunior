import { Prisma } from "@prisma/client";
import { AuthenticatedCommandContext, AuthorizationPort, FinanceCapability } from "./FinanceCapability.js";
import { CanonicalValue, fingerprintCommand } from "./IdempotencyPolicy.js";
import { PrismaFinanceUnitOfWork } from "../infrastructure/PrismaFinanceUnitOfWork.js";
import { PrismaIdempotencyStore } from "../infrastructure/PrismaIdempotencyStore.js";

export interface CommandResult<T extends Prisma.InputJsonValue> {
  readonly type: string;
  readonly id: string;
  readonly payload: T;
}

export class FinanceCommandExecutor {
  constructor(private readonly authorization: AuthorizationPort, private readonly unitOfWork: PrismaFinanceUnitOfWork, private readonly idempotency: PrismaIdempotencyStore) {}
  async execute<T extends Prisma.InputJsonValue, P = undefined>(input: {
    actor: AuthenticatedCommandContext;
    capability: FinanceCapability;
    key: string;
    command: string;
    parameters: CanonicalValue;
    prepare?: () => Promise<P>;
    run: (tx: Prisma.TransactionClient, prepared: P) => Promise<CommandResult<T>>;
  }): Promise<T> {
    await this.authorization.require(input.actor.actorUserId, input.capability);
    const fingerprint = fingerprintCommand(input.command, input.parameters);
    const existing = await this.idempotency.findCompleted(input.key);
    if (existing) { this.idempotency.assertReplayMatches(existing, input.actor.actorUserId, input.command, fingerprint); return existing.resultPayload as T; }
    const prepared = input.prepare ? await input.prepare() : undefined as P;
    return this.unitOfWork.execute(async (tx) => {
      await this.unitOfWork.acquireIdempotencyLock(tx, input.key);
      const replay = await this.idempotency.findCompletedInTransaction(tx, input.key);
      if (replay) { this.idempotency.assertReplayMatches(replay, input.actor.actorUserId, input.command, fingerprint); return replay.resultPayload as T; }
      const result = await input.run(tx, prepared);
      await this.idempotency.complete(tx, { key: input.key, commandType: input.command, actorUserId: input.actor.actorUserId, fingerprint, resultType: result.type, resultId: result.id, resultPayload: result.payload as unknown as Prisma.JsonValue });
      return result.payload;
    });
  }
}
