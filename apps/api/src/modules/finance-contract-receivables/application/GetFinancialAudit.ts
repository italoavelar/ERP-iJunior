import { PrismaClient } from "@prisma/client";
import { AuthorizationPort } from "./FinanceCapability.js";

export class GetFinancialAudit {
  constructor(private readonly prisma: PrismaClient, private readonly authorization: AuthorizationPort) {}
  async execute(actorUserId: string, contractId: string, page: { cursor?: string; limit?: number } = {}) {
    await this.authorization.require(actorUserId, "FINANCIAL_AUDIT_READ");
    const limit = Math.max(1, Math.min(page.limit ?? 50, 100));
    const rows = await this.prisma.auditEvent.findMany({ where: { contractId, domain: "finance-contract-receivables" }, orderBy: [{ occurredAt: "asc" }, { id: "asc" }], take: limit + 1, ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}) });
    const hasMore = rows.length > limit; const events = rows.slice(0, limit);
    return { contractId, events: events.map((event) => ({ id: event.id, action: event.action, aggregateType: event.aggregateType, aggregateId: event.aggregateId, paymentPlanId: event.paymentPlanId, transactionId: event.transactionId, actorUserId: event.actorUserId, reason: event.reason, context: event.context, occurredAt: event.occurredAt.toISOString() })), nextCursor: hasMore ? events.at(-1)!.id : null };
  }
}
