CREATE OR REPLACE FUNCTION finance_reject_history_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'finance history is append-only';
END;
$$;

CREATE TRIGGER finance_ledger_append_only
BEFORE UPDATE OR DELETE ON "FinancialTransaction"
FOR EACH ROW EXECUTE FUNCTION finance_reject_history_mutation();
CREATE TRIGGER finance_allocation_append_only
BEFORE UPDATE OR DELETE ON "TransactionAllocation"
FOR EACH ROW EXECUTE FUNCTION finance_reject_history_mutation();
CREATE TRIGGER audit_event_append_only
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW EXECUTE FUNCTION finance_reject_history_mutation();
