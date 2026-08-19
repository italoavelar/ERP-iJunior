import { AuthorizationPort, CapabilityMissingError, FinanceCapability } from "../../finance-contract-receivables/application/FinanceCapability.js";
import { AuthRepository } from "../domain/authTypes.js";

export class PrismaFinanceAuthorizationPort implements AuthorizationPort {
  constructor(private readonly repository: AuthRepository) {}

  async list(actorUserId: string): Promise<ReadonlySet<FinanceCapability>> {
    return this.repository.listCapabilities(actorUserId, new Date());
  }

  async require(actorUserId: string, capability: FinanceCapability): Promise<void> {
    if (!(await this.list(actorUserId)).has(capability)) throw new CapabilityMissingError(`CAPABILITY_MISSING:${capability}`);
  }
}
