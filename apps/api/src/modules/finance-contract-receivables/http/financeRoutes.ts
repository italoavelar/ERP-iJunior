import { Hono } from "hono";
import { FinanceAuthenticator, FinanceEnv, authenticationMiddleware } from "./financeCommandMiddleware.js";
import { PaymentPlanRouteUseCases, registerPaymentPlanRoutes } from "./paymentPlanRoutes.js";
import { registerReceivableTransactionRoutes } from "./receivableTransactionRoutes.js";
import { registerReceivablesQueryRoutes } from "./receivablesQueryRoutes.js";
import { RegisterReceipt } from "../application/RegisterReceipt.js";
import { ReverseReceipt } from "../application/ReverseReceipt.js";
import { GetContractReceivables } from "../application/GetContractReceivables.js";
import { GetFinancialAudit } from "../application/GetFinancialAudit.js";

export interface FinanceRouteDependencies extends PaymentPlanRouteUseCases { authenticate: FinanceAuthenticator; registerReceipt: RegisterReceipt; reverseReceipt: ReverseReceipt; getReceivables: GetContractReceivables; getAudit: GetFinancialAudit; }
export function registerFinanceRoutes(app: Hono<FinanceEnv>, dependencies: FinanceRouteDependencies): void {
  app.use("/api/finance/*", authenticationMiddleware(dependencies.authenticate));
  registerPaymentPlanRoutes(app, dependencies);
  registerReceivableTransactionRoutes(app, dependencies);
  registerReceivablesQueryRoutes(app, dependencies);
}
