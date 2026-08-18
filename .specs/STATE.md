# STATE

## Decisions

### AD-001
- **Decision**: Não implementar funcionalidades enquanto a definição global do produto estiver em revisão.
- **Reason**: O ERP requer alinhamento prévio de visão, domínios, fluxos, entidades, regras e requisitos transversais.
- **Trade-off**: A entrega da primeira funcionalidade é adiada para reduzir retrabalho e decisões contraditórias entre módulos.
- **Scope**: Todas as futuras features do ERP iJúnior.
- **Date**: 2026-08-18
- **Status**: active

### AD-002
- **Decision**: O ERP separa CRM / Comercial, Projetos, Financeiro e Plataforma Compartilhada; RH poderá se tornar domínio próprio no futuro.
- **Reason**: Cada domínio possui regras e ciclos de vida próprios, enquanto serviços transversais e entidades compartilhadas exigem governança comum.
- **Trade-off**: Features precisam respeitar fronteiras e integrar referências, em vez de centralizar todo comportamento em um modelo único.
- **Scope**: Todas as features dos domínios de negócio e da plataforma.
- **Date**: 2026-08-18
- **Status**: active

### AD-003
- **Decision**: CRM usa a hierarquia CrmWorkspace → CrmPipe → CrmStage → CrmCard; CrmCard, ProjectTask, CrmWorkspace e Project Workspace são conceitos distintos.
- **Reason**: CRM é uma plataforma de processos configuráveis e a execução de projetos exige um modelo operacional próprio.
- **Trade-off**: Não será criada uma entidade universal como GenericCard para simplificar artificialmente os domínios.
- **Scope**: Features de CRM, Projetos, integrações e serviços compartilhados relacionados.
- **Date**: 2026-08-18
- **Status**: active

### AD-004
- **Decision**: Escopo contratado é separado da execução operacional e preservado por baseline ou versão; mudanças contratuais usam Change Request ou mecanismo equivalente com histórico.
- **Reason**: Backlog e tasks precisam evoluir sem reescrever o acordo firmado com o cliente.
- **Trade-off**: Mudanças de escopo, prazo, valor ou critérios exigem registro e fluxo explícito.
- **Scope**: Features de Comercial, Projetos, Financeiro, contratos e handoff.
- **Date**: 2026-08-18
- **Status**: active

### AD-005
- **Decision**: Integrações preservam referência de origem e entidades compartilhadas possuem fonte de verdade; relações de negócio não são redigitadas entre módulos.
- **Reason**: O ERP deve manter rastreabilidade ponta a ponta e evitar dados divergentes.
- **Trade-off**: Cada feature deve identificar o domínio proprietário e tratar transferências, referências e correções de forma explícita.
- **Scope**: Todas as features que criem, consultem ou integrem dados entre domínios.
- **Date**: 2026-08-18
- **Status**: active

### AD-006
- **Decision**: Alterações críticas são auditáveis e fatos históricos, como contrato assinado, escopo contratado e parcela paga, não são sobrescritos silenciosamente.
- **Reason**: A operação precisa explicar decisões, correções e efeitos financeiros ao longo do tempo.
- **Trade-off**: Ajustes, estornos, aditivos e correções exigem mecanismos de histórico em vez de edição in-place.
- **Scope**: Features de todos os domínios que alterem fatos críticos.
- **Date**: 2026-08-18
- **Status**: active

### AD-007
- **Decision**: Valor pago e valor restante são derivados de parcelas e movimentações financeiras, não campos manuais primários; o Financeiro não edita pipeline de CRM nem backlog de projetos.
- **Reason**: Saldo financeiro e responsabilidade de domínio precisam permanecer consistentes e auditáveis.
- **Trade-off**: Funcionalidades financeiras devem registrar eventos primários e calcular valores derivados, mantendo acesso de leitura ao contexto externo necessário.
- **Scope**: Features de Financeiro, Contract, Project, integração e relatórios.
- **Date**: 2026-08-18
- **Status**: superseded by AD-014

### AD-008
- **Decision**: Cargo organizacional, papel de projeto e privilégio administrativo são conceitos distintos; PLATFORM_ADMIN não ignora regras de negócio.
- **Reason**: A autorização precisa preservar alçadas, segregação de funções e governança de processos.
- **Trade-off**: O controle de acesso exige contexto e não pode depender apenas de uma permissão administrativa ampla.
- **Scope**: Identidade, acesso, aprovação e todas as features com ações restritas.
- **Date**: 2026-08-18
- **Status**: active

### AD-009
- **Decision**: Analytics é camada de leitura e não é fonte de verdade operacional.
- **Reason**: Indicadores devem refletir os domínios sem substituir seus registros e ciclos de vida.
- **Trade-off**: Features analíticas não devem introduzir caminhos de escrita para dados de negócio.
- **Scope**: Analytics, relatórios, exportações e integrações de leitura.
- **Date**: 2026-08-18
- **Status**: active

### AD-010
- **Decision**: Contract pertence ao Comercial; após assinatura válida, é fato contratual compartilhado e imutável in-place, consumido por referência por Projetos e Financeiro.
- **Reason**: A formalização comercial deve ter uma fonte única, enquanto execução e financeiro precisam usar o mesmo fato contratual sem disputar seu ciclo de vida.
- **Trade-off**: Financeiro cria PaymentPlan, Installment, Obligation e Invoice próprios a partir das condições aplicáveis, sem editar o Contract.
- **Scope**: Features de oportunidade, proposta, contrato, handoff, projeto e financeiro.
- **Date**: 2026-08-18
- **Status**: active

### AD-011
- **Decision**: Assinatura válida de Contract habilita o handoff Comercial → Projetos, que cria ou prepara o Project Workspace sem iniciar necessariamente a execução ativa.
- **Reason**: O processo precisa eliminar redigitação e separar formalização, preparação e início operacional.
- **Trade-off**: Features de Projetos devem modelar uma transição posterior de preparação para execução ativa com regras próprias.
- **Scope**: Features de contrato, assinatura, handoff, criação de projeto e início operacional.
- **Date**: 2026-08-18
- **Status**: active

### AD-012
- **Decision**: Ownership é autoridade sobre ciclo de vida, não exclusividade de leitura; User, Member, Client, Contact e Partner pertencem à Plataforma Compartilhada, e Document, Meeting, Notification e AuditEvent são serviços transversais.
- **Reason**: Os domínios precisam reutilizar identidades e referências sem criar fontes concorrentes de verdade.
- **Trade-off**: Todo consumidor deve respeitar o owner e consultar referências ou projeções autorizadas em vez de editar dados de outro domínio.
- **Scope**: Todas as features que criem, leiam ou integrem entidades compartilhadas e serviços transversais.
- **Date**: 2026-08-18
- **Status**: active

### AD-013
- **Decision**: Cargo organizacional não concede automaticamente PlatformPrivilege; a atribuição administrativa é explícita, auditável e não bypassa regras de negócio.
- **Reason**: A segregação entre estrutura organizacional, responsabilidade de projeto e administração protege alçadas e aprovações.
- **Trade-off**: Features com ações administrativas ou restritas devem verificar privilégio, contexto e regra de domínio separadamente.
- **Scope**: Identidade, acesso, administração, aprovações e todas as features com ações restritas.
- **Date**: 2026-08-18
- **Status**: active

### AD-014
- **Decision**: Valor pago e valor restante são derivados de parcelas e movimentações financeiras; Financeiro consome Contract e Project por referência, sem editar pipeline de CRM ou backlog de Projetos.
- **Reason**: Saldo financeiro, ownership e rastreabilidade precisam permanecer consistentes e auditáveis.
- **Trade-off**: Funcionalidades financeiras registram eventos primários e calculam valores derivados, mantendo somente a leitura autorizada do contexto externo necessário.
- **Scope**: Features de Financeiro, Contract, Project, integrações e relatórios.
- **Date**: 2026-08-18
- **Status**: active

## Handoff

- **Feature**: `finance-contract-receivables` / `.specs/features/finance-contract-receivables/spec.md`
- **Phase / Task**: Execute / T03 concluída; T04 autorizada no batch atual
- **Completed**: Pendências FIN-002, FIN-003, PLA-001 e recorte de PLA-003 fechados para a feature; `spec.md` validado em modo estrito; `design.md` cobre 71 requisitos e passou revisão adversarial de modelo relacional, dinheiro, transações, auditoria, idempotência, concorrência e autorização; `tasks.md` possui 48 tasks, matriz de testes, dependências sem ciclos e cobertura dos 71 requisitos; T01 criou workspace npm, baseline TypeScript estrito, testes de foundation, lint, `.env.example` e regras de ignore sem iniciar a API, frontend, Prisma ou domínio; T02 criou a fronteira Hono mínima testável, o ponto de registro de módulos e o build real da API, sem iniciar ORM, rotas financeiras, autorização ou idempotência; T03 criou o shell React/TypeScript/Vite, seu build real e um teste de montagem sem backend, sem telas, cliente, capacidades ou fluxos financeiros
- **In-progress** (file:line): none — T04 ainda não foi iniciada
- **Next step**: Executar somente T04 no batch autorizado; T05 permanece fora deste batch.
- **Blockers**: none
- **Technical decision (T01)**: npm foi escolhido porque o repositório não possuía manifest, lockfile ou decisão prévia de package manager. `package.json` fixa `npm@10.9.8`; React/Vite, Hono e Prisma não foram instalados diretamente nesta task.
- **Technical decision (T02)**: Hono é a única dependência runtime da API nesta foundation. `createApp` e `registerApiModules` separam bootstrap HTTP de futuros adapters de domínio; `/health` é a única rota de prova.
- **Technical decision (T03)**: React, React DOM, Vite e o plugin React formam o único toolchain frontend. O harness usa `happy-dom` somente para montar o shell React em teste; `jsdom`, router, client de dados e bibliotecas de componentes não foram adicionados.
- **Principal files (T01)**: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.*.config.ts`, `.env.example`, `.gitignore`, `apps/api/package.json`, `apps/web/package.json`, `prisma/.gitkeep` e `tests/foundation/*`.
- **Principal files (T02)**: `apps/api/src/app.ts`, `apps/api/src/app.api.test.ts`, `apps/api/tsconfig*.json`, `apps/api/package.json`, `vitest.api.config.ts` e scripts-raiz de build/typecheck.
- **Principal files (T03)**: `apps/web/index.html`, `apps/web/src/{main,App}.tsx`, `apps/web/src/App.web.test.tsx`, `apps/web/{tsconfig,vite}.config.ts`, `apps/web/package.json`, `vitest.web.config.ts` e scripts-raiz de build/typecheck.
- **Verification (T01)**: `npm run build`, `npm run check`, `npm run test:unit`, `npm run test:integration`, `npm run test:api`, `npm run test:web`, `validate_tasks.py --strict` e `validate_spec.py --strict` passaram.
- **Verification (T02)**: `npm run test:api` (3 testes), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check` (8 testes), `git diff --check`, `validate_tasks.py --strict` e `validate_spec.py --strict` passaram.
- **Verification (T03)**: `npm run test:web` (2 testes), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run check` (9 testes), `git diff --check`, `validate_tasks.py --strict` e `validate_spec.py --strict` passaram.
- **Branch**: main
