# ERP iJúnior

## Bloco 3 local

1. Copie `.env.example` para um arquivo local ignorado e preencha os quatro pares de credenciais de desenvolvimento.
2. Execute `npm run db:migrate:test` para validar as migrações em PostgreSQL isolado, ou aplique as migrações no banco local.
3. Execute `npm run db:seed:dev` com `DATABASE_URL` definido. O seed é idempotente e nunca imprime senhas ou hashes.
4. Inicie a API com `npm run dev:api` e o frontend com `npm run dev --workspace=@ijunior/web`.

O Vite usa proxy same-origin para `/auth` e `/api`. Em produção, configure um `ContractReferencePort` externo e `CONTRACT_REFERENCE_ADAPTER=external`; o adapter persistido `DevContractReference` é somente para desenvolvimento/testes. Comercial e Projetos são placeholders no Bloco 3.
