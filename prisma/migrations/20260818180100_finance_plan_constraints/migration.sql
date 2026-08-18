CREATE UNIQUE INDEX payment_plan_one_live_contract ON "PaymentPlan" ("contractId") WHERE "discardedAt" IS NULL;

ALTER TABLE "PaymentPlan"
  ADD CONSTRAINT finance_payment_plan_brl CHECK ("currency" = 'BRL'),
  ADD CONSTRAINT finance_payment_plan_positive_total CHECK ("totalCents" > 0);
ALTER TABLE "Installment" ADD CONSTRAINT finance_installment_positive_cents CHECK ("originalCents" > 0);
ALTER TABLE "FinancialTransaction"
  ADD CONSTRAINT finance_transaction_positive_cents CHECK ("amountCents" > 0),
  ADD CONSTRAINT finance_transaction_receipt_reversal_shape CHECK (("type" = 'RECEIPT' AND "originalReceiptId" IS NULL) OR ("type" = 'REVERSAL' AND "originalReceiptId" IS NOT NULL));
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT finance_allocation_positive_cents CHECK ("amountCents" > 0);
