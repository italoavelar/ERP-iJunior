import { serve } from "@hono/node-server";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { ActivatePaymentPlan } from "./modules/finance-contract-receivables/application/ActivatePaymentPlan.js";
import { ChangeDraftPlanTotal } from "./modules/finance-contract-receivables/application/ChangeDraftPlanTotal.js";
import { CreateInstallment } from "./modules/finance-contract-receivables/application/CreateInstallment.js";
import { CreatePaymentPlan } from "./modules/finance-contract-receivables/application/CreatePaymentPlan.js";
import { DiscardPaymentPlan } from "./modules/finance-contract-receivables/application/DiscardPaymentPlan.js";
import { EditDraftInstallment } from "./modules/finance-contract-receivables/application/EditDraftInstallment.js";
import { FinanceCommandExecutor } from "./modules/finance-contract-receivables/application/FinanceCommandExecutor.js";
import { GetContractReceivables } from "./modules/finance-contract-receivables/application/GetContractReceivables.js";
import { GetFinancialAudit } from "./modules/finance-contract-receivables/application/GetFinancialAudit.js";
import { RegisterReceipt } from "./modules/finance-contract-receivables/application/RegisterReceipt.js";
import { RemoveDraftInstallment } from "./modules/finance-contract-receivables/application/RemoveDraftInstallment.js";
import { ReorderInstallments } from "./modules/finance-contract-receivables/application/ReorderInstallments.js";
import { ReturnPlanToDraft } from "./modules/finance-contract-receivables/application/ReturnPlanToDraft.js";
import { ReverseReceipt } from "./modules/finance-contract-receivables/application/ReverseReceipt.js";
import { LocalDate } from "./modules/finance-contract-receivables/domain/LocalDate.js";
import { PrismaDevContractReferenceAdapter } from "./modules/finance-contract-receivables/infrastructure/PrismaDevContractReferenceAdapter.js";
import { PrismaFinanceUnitOfWork } from "./modules/finance-contract-receivables/infrastructure/PrismaFinanceUnitOfWork.js";
import { PrismaIdempotencyStore } from "./modules/finance-contract-receivables/infrastructure/PrismaIdempotencyStore.js";
import { PrismaPaymentPlanLookup } from "./modules/finance-contract-receivables/infrastructure/PrismaPaymentPlanLookup.js";
import { PrismaTransactionalAuditWriter } from "./modules/finance-contract-receivables/infrastructure/PrismaTransactionalAuditWriter.js";
import { AuthService } from "./modules/platform-auth-shell/application/AuthService.js";
import { PrismaAuthRepository } from "./modules/platform-auth-shell/infrastructure/PrismaAuthRepository.js";
import { Argon2CredentialHasher } from "./modules/platform-auth-shell/infrastructure/Argon2CredentialHasher.js";
import { PrismaFinanceAuthorizationPort } from "./modules/platform-auth-shell/infrastructure/PrismaFinanceAuthorizationPort.js";
import { readSessionCookie } from "./modules/platform-auth-shell/http/cookies.js";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
if (process.env.NODE_ENV === "production" && process.env.CONTRACT_REFERENCE_ADAPTER !== "external") throw new Error("CONTRACT_REFERENCE_ADAPTER=external is required in production");
const prisma = new PrismaClient();
const authRepository = new PrismaAuthRepository(prisma);
const authService = new AuthService(authRepository, new Argon2CredentialHasher());
const authorization = new PrismaFinanceAuthorizationPort(authRepository);
const contractPort = new PrismaDevContractReferenceAdapter(prisma);
const unit = new PrismaFinanceUnitOfWork(prisma);
const executor = new FinanceCommandExecutor(authorization, unit, new PrismaIdempotencyStore(prisma));
const audit = new PrismaTransactionalAuditWriter();
const authenticate = async (request: Request) => {
  const principal = await authService.resolve(readSessionCookie(request));
  return principal ? { actorUserId: principal.id, capabilities: principal.capabilities } : undefined;
};
const finance = {
  authenticate,
  createPlan: new CreatePaymentPlan(contractPort, authorization, executor, audit),
  changeTotal: new ChangeDraftPlanTotal(authorization, executor, audit),
  createInstallment: new CreateInstallment(authorization, executor, audit),
  editInstallment: new EditDraftInstallment(authorization, executor, audit),
  removeInstallment: new RemoveDraftInstallment(authorization, executor, audit),
  reorderInstallments: new ReorderInstallments(authorization, executor, audit),
  activatePlan: new ActivatePaymentPlan(authorization, executor, contractPort, new PrismaPaymentPlanLookup(prisma), audit),
  returnPlanToDraft: new ReturnPlanToDraft(authorization, executor, audit),
  discardPlan: new DiscardPaymentPlan(authorization, executor, audit),
  registerReceipt: new RegisterReceipt(authorization, executor, audit),
  reverseReceipt: new ReverseReceipt(authorization, executor, audit),
  getReceivables: new GetContractReceivables(prisma, authorization, contractPort, { todayIn: () => LocalDate.parse(new Date().toISOString().slice(0, 10)) }),
  getAudit: new GetFinancialAudit(prisma, authorization)
};
const app = createApp(finance, authService);

const server = serve({ fetch: app.fetch, port });
console.log(`iJúnior API listening on http://localhost:${port}`);

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
