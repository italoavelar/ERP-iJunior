CREATE OR REPLACE FUNCTION finance_assert_ledger_relationship_integrity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  transaction_plan UUID;
  installment_plan UUID;
  transaction_type "FinancialTransactionType";
  original_receipt UUID;
  original_allocation_transaction UUID;
  original_allocation_installment UUID;
  original_transaction_type "FinancialTransactionType";
  original_transaction_plan UUID;
BEGIN
  SELECT "paymentPlanId", "type", "originalReceiptId"
    INTO transaction_plan, transaction_type, original_receipt
    FROM "FinancialTransaction" WHERE "id" = NEW."transactionId";
  SELECT "paymentPlanId" INTO installment_plan FROM "Installment" WHERE "id" = NEW."installmentId";

  IF transaction_plan IS NULL OR installment_plan IS NULL OR transaction_plan <> installment_plan THEN
    RAISE EXCEPTION 'finance ledger transaction and installment must belong to the same payment plan';
  END IF;
  IF transaction_type = 'RECEIPT' THEN
    IF NEW."originalAllocationId" IS NOT NULL THEN
      RAISE EXCEPTION 'finance receipt allocation cannot have an original allocation';
    END IF;
  ELSIF transaction_type = 'REVERSAL' THEN
    IF NEW."originalAllocationId" IS NULL THEN
      RAISE EXCEPTION 'finance reversal allocation must reference an original allocation';
    END IF;
    SELECT allocation."transactionId", allocation."installmentId", transaction."type", transaction."paymentPlanId"
      INTO original_allocation_transaction, original_allocation_installment, original_transaction_type, original_transaction_plan
      FROM "TransactionAllocation" allocation
      JOIN "FinancialTransaction" transaction ON transaction."id" = allocation."transactionId"
      WHERE allocation."id" = NEW."originalAllocationId";
    IF original_allocation_transaction IS NULL OR original_allocation_transaction <> original_receipt
      OR original_allocation_installment <> NEW."installmentId"
      OR original_transaction_type <> 'RECEIPT' OR original_transaction_plan <> transaction_plan THEN
      RAISE EXCEPTION 'finance reversal allocation must target an allocation of its parent receipt in the same plan';
    END IF;
  ELSE
    RAISE EXCEPTION 'finance transaction type is invalid';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER finance_ledger_relationship_integrity
AFTER INSERT OR UPDATE ON "TransactionAllocation"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION finance_assert_ledger_relationship_integrity();
