# ERP iJúnior

## Bloco 3 local

1. Copie `.env.example` para um arquivo local ignorado e preencha os quatro pares de credenciais de desenvolvimento.
2. Execute `npm run db:migrate:test` para validar as migrações em PostgreSQL isolado, ou aplique as migrações no banco local.
3. Execute `npm run db:seed:dev` com `DATABASE_URL` definido. O seed é idempotente e nunca imprime senhas ou hashes.
4. Inicie a API com `npm run dev:api` e o frontend com `npm run dev --workspace=@ijunior/web`.

O Vite usa proxy same-origin para `/auth` e `/api`. O adapter persistido
`DevContractReference` é somente para desenvolvimento/testes; o runtime de
produção falha fechado até que a infraestrutura injete um
`ContractReferencePort` externo real. Não há fallback para fixture. Comercial e
Projetos são placeholders no Bloco 3.

## Runbook do MVP Financeiro

Requisitos: Node 22, npm 10, PostgreSQL 12+ e `psql` disponível no `PATH`.

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate:test
npm run db:seed:dev
npm run dev:api
npm run dev --workspace=@ijunior/web
```

O arquivo `.env` é local e ignorado. Preencha os quatro pares de credenciais
`DEV_MANAGER_*`, `DEV_VP_*`, `DEV_NO_FINANCE_*` e `DEV_PLATFORM_ADMIN_*`, além
de `DATABASE_URL`. O seed é idempotente e não imprime senhas ou hashes.

Contas de desenvolvimento:

- Gerente Financeiro: grants operacionais de Financeiro;
- Vice-Presidente: grants do gerente mais retorno a DRAFT, descarte e reversal;
- Usuário sem FinanceCapability: nenhum grant financeiro;
- `PLATFORM_ADMIN`: somente o privilégio explícito de plataforma, sem bypass.

Verificações locais:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run validate:finance-coverage
python3 .claude/skills/tlc-spec-driven/scripts/validate_tasks.py --strict .specs/features/finance-contract-receivables
python3 .claude/skills/tlc-spec-driven/scripts/validate_spec.py --strict .specs/features/finance-contract-receivables
python3 .claude/skills/tlc-spec-driven/scripts/validate_tasks.py --strict .specs/features/platform-auth-shell
python3 .claude/skills/tlc-spec-driven/scripts/validate_spec.py --strict .specs/features/platform-auth-shell
git diff --check
```

`npm run test:e2e` sobe um PostgreSQL temporário vazio, aplica todas as
migrations, executa seed controlado, inicia a API Hono real e usa o proxy
same-origin do Vite com Chromium real. Nenhuma jornada E2E usa mock de backend.
