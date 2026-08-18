CREATE OR REPLACE FUNCTION finance_guard_plan_reference_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."contractId" IS DISTINCT FROM OLD."contractId"
    OR NEW."clientId" IS DISTINCT FROM OLD."clientId"
    OR NEW."currency" IS DISTINCT FROM OLD."currency" THEN
    RAISE EXCEPTION 'finance payment plan canonical references are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER finance_plan_reference_immutable
BEFORE UPDATE ON "PaymentPlan"
FOR EACH ROW EXECUTE FUNCTION finance_guard_plan_reference_immutable();

CREATE OR REPLACE FUNCTION finance_guard_plan_history_freeze()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  plan_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'PaymentPlan' THEN
    plan_id := OLD."id";
  ELSE
    plan_id := OLD."paymentPlanId";
  END IF;
  IF EXISTS (SELECT 1 FROM "FinancialTransaction" WHERE "paymentPlanId" = plan_id) THEN
    RAISE EXCEPTION 'finance payment plan with financial history is structurally frozen';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER finance_plan_history_freeze
BEFORE UPDATE OR DELETE ON "PaymentPlan"
FOR EACH ROW EXECUTE FUNCTION finance_guard_plan_history_freeze();
CREATE TRIGGER finance_installment_history_freeze
BEFORE UPDATE OR DELETE ON "Installment"
FOR EACH ROW EXECUTE FUNCTION finance_guard_plan_history_freeze();
