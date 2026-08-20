# Homologação: Vercel + Neon

Este runbook prepara dois projetos Vercel para o mesmo repositório, mantendo o
domínio público apenas no Web. Não há CORS como caminho principal: o browser
chama caminhos relativos e a Function interna do Web faz o proxy autenticado
para a API.

## Arquitetura

```text
Browser ── https://DOMINIO_WEB/{auth,api}/... ──► Vercel Web
                                                     │ rewrite + Function interna
                                                     ▼
                                               Vercel API (Hono)
                                                     │ DATABASE_URL (pooled)
                                                     ▼
                                                Neon PostgreSQL
```

`/auth/*` e `/api/*` são reescritos antes do fallback da SPA. A Function do
Web só aceita o origin configurado em `BACKEND_URL`; ela encaminha `Cookie`,
`Origin` e `Set-Cookie`, portanto `ijunior_session` é emitido para o domínio
Web. O frontend não possui URL absoluta da API e continua usando
`credentials: "include"`.

## Configuração exata dos projetos Vercel

Crie dois projetos a partir de `italoavelar/ERP-iJunior`. Em ambos, mantenha
habilitada a opção de incluir arquivos fora do Root Directory: a API usa o
schema e as migrations canônicas em `prisma/` na raiz do monorepo.

| Campo | Vercel Web | Vercel API |
| --- | --- | --- |
| Root Directory | `apps/web` | `apps/api` |
| Framework | `Vite` | `Hono` |
| Node | `22.x` (o repo exige `>=22 <23`) | `22.x` (o repo exige `>=22 <23`) |
| Install Command | `npm ci` | `npm ci` |
| Build Command | `npm run build` | `npm run build:vercel` |
| Output Directory | `dist` | não configurar; Hono é detectado como Function |

O `src/index.ts` da API é o entrypoint nativo da Vercel: exporta a mesma app
Hono composta por `buildRuntime()` que o servidor local usa. `server.ts`
continua exclusivamente responsável por `@hono/node-server` e `npm run dev:api`.

### Variáveis de ambiente

Configure valores reais apenas no painel Vercel/Neon, nunca em arquivos
versionados. Não use valor com barra final para `WEB_ORIGINS`; `BACKEND_URL`
aceita origin HTTPS, com ou sem barra final.

| Projeto / ambiente | Variável | Valor / regra |
| --- | --- | --- |
| API / Production | `NODE_ENV` | `production` |
| API / Production | `DATABASE_URL` | URL pooled do Neon, usada pelo runtime Prisma |
| API / Production | `DIRECT_URL` | URL direct (não pooled) do Neon, usada por `prisma migrate deploy` |
| API / Production | `WEB_ORIGINS` | origin exato do Web, por exemplo `https://erp-ijunior.vercel.app` |
| API / Production | `CONTRACT_REFERENCE_ADAPTER` | `prisma` |
| Web / Production | `BACKEND_URL` | origin HTTPS do projeto API, por exemplo `https://erp-api.vercel.app` |

Não defina `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGINS` ou
`CONTRACT_REFERENCE_ADAPTER` para Preview da API. O build de Preview não roda
migrations e uma invocação sem banco falha fechada. Também deixe
`BACKEND_URL` ausente no Preview Web até existir um banco/ambiente isolado;
as chamadas autenticadas então falham fechadas, sem alcançar homologação.

`VERCEL_ENV` é fornecida pela Vercel e não deve ser criada manualmente. Apenas
quando ela é `production`, o build da API executa, nesta ordem:

```text
prisma generate --schema ../../prisma/schema.prisma
prisma migrate deploy --schema ../../prisma/schema.prisma
npm run build
```

Em Preview ele roda `prisma generate` e build, mas nunca `migrate deploy`.
Para ativar Preview útil no futuro, crie um branch/database Neon separado e
associe apenas as variáveis Preview a ele.

## Neon e migrations

1. Crie um projeto Neon na região mais próxima das Functions Vercel escolhidas.
2. Copie a connection string pooled para `DATABASE_URL`.
3. Copie a connection string direct/não pooled para `DIRECT_URL`.
4. Cadastre ambas somente no ambiente Production do projeto API.
5. No primeiro deploy API, o build aplicará `prisma migrate deploy` a partir de `prisma/migrations`.
6. Verifique no log do build que todas as migrations foram aplicadas (ou já estavam aplicadas).
7. Execute uma única vez o bootstrap abaixo, a partir de uma máquina controlada.

O schema Prisma 6.19.2 usa `DATABASE_URL` para aplicação e `directUrl` para
CLI/migrations. Não há `db push`, `migrate reset` nem seed no deployment. A
pool é preservada no driver Prisma atual; transactions interativas,
`SERIALIZABLE`, `FOR UPDATE`, advisory locks e clientes transaction-scoped não
foram trocados.

Antes de um primeiro deploy, valide localmente o mesmo mecanismo duas vezes
contra um PostgreSQL vazio com `npm run db:migrate:verify`. O comando usa
`prisma migrate deploy` (não SQL manual), confirma a criação inicial e a
idempotência da segunda execução, sem seed ou reset.

## Bootstrap controlado

Depois das migrations, exporte temporariamente `DATABASE_URL` (pooled),
`DIRECT_URL` (direct), `STAGING_MANAGER_EMAIL` e
`STAGING_MANAGER_PASSWORD` em uma máquina segura e execute:

```bash
npm ci
npm run db:generate
npm run db:seed:staging
```

O script cria somente uma conta sanitizada de homologação com as capabilities
operacionais necessárias. Ele não cria contratos, clientes, projetos ou
fixtures DEV; se o e-mail já existe, não muda senha, privilégios ou carteira.
Assim, repetição é segura e nenhuma seed roda automaticamente. Não use dados
pessoais reais nem versiona senha.

`CONTRACT_REFERENCE_ADAPTER=prisma` é obrigatório em produção e seleciona o
Contract Registry real no PostgreSQL. Não há fallback para adapter DEV,
fixture ou contrato falso.

## Primeiro deploy

1. Crie Neon e registre as URLs pooled/direct no API Production.
2. Crie o projeto Vercel API com os campos da tabela e as variáveis Production, exceto `WEB_ORIGINS` por enquanto.
3. Faça o primeiro deploy da API. Ele pode falhar antes de `WEB_ORIGINS`; isso confirma a validação fechada. Para aplicar migrations, configure provisoriamente o origin Web que será usado ou crie o Web antes do teste de runtime.
4. Execute o bootstrap de homologação uma única vez após as migrations.
5. Crie o projeto Vercel Web, configure `BACKEND_URL` com o origin da API e faça deploy.
6. Copie o domínio definitivo do Web para `WEB_ORIGINS` da API, como origin explícito HTTPS.
7. Redeploy a API para aplicar a allowlist e depois redeploy o Web se `BACKEND_URL` tiver mudado.
8. Execute o smoke test.

Para evitar uma primeira API com runtime indisponível, é aceitável definir
`WEB_ORIGINS` antes do primeiro deploy usando o domínio de produção reservado
para o projeto Web (ou depois que ele for criado), desde que seja exato e HTTPS.

## Smoke test de homologação

Substitua `WEB_URL`, e use as credenciais criadas no bootstrap. Os cookies são
guardados num arquivo temporário local, nunca no repositório.

```bash
curl -fsS https://WEB_URL/health
curl -fsS -c /tmp/ijunior.cookies -H 'Origin: https://WEB_URL' \
  -H 'Content-Type: application/json' \
  --data '{"email":"EMAIL","password":"SENHA"}' https://WEB_URL/auth/login
curl -fsS -b /tmp/ijunior.cookies https://WEB_URL/auth/me
curl -fsS -b /tmp/ijunior.cookies https://WEB_URL/api/dashboard
curl -fsS -b /tmp/ijunior.cookies https://WEB_URL/api/portfolio/contracts
curl -fsS -b /tmp/ijunior.cookies https://WEB_URL/api/portfolio/projects
curl -i -b /tmp/ijunior.cookies -c /tmp/ijunior.cookies -X POST \
  -H 'Origin: https://WEB_URL' https://WEB_URL/auth/logout
```

Confirme no navegador também: login emite `ijunior_session` com `HttpOnly`,
`Secure`, `SameSite=Lax`, `Path=/`; `/auth/me` reconhece a sessão; um refresh
em `/`, `/login`, `/finance`, `/finance/contracts/:contractId`, `/projects`,
`/projects/:projectId` e `/commercial` não retorna 404; logout revoga sessão.
O `/health` prova somente que a API responde e nunca expõe configuração ou
segredos.

## Deploys futuros, atenção e rollback

Com `main` como Production Branch nos dois projetos, `git push origin main`
cria os dois deployments. A API migra somente na build Production; o Web
recebe os assets e rewrites. Para migration nova, revise previamente SQL,
compatibilidade backward-safe e logs do `migrate deploy`; nunca faça reset
automático em homologação.

Um rollback de aplicação é o redeploy de um deployment anterior na Vercel. Ele
não desfaz schema/dados. Rollback de banco requer migration compensatória
revisada ou restauração Neon planejada; migrations destrutivas não têm rollback
automático.

## Segurança e troubleshooting

- A API exige `DATABASE_URL`; em produção exige também `WEB_ORIGINS` HTTPS sem
  wildcard e `CONTRACT_REFERENCE_ADAPTER=prisma`.
- Mutations seguem validando `Origin`; não foi adicionado CORS permissivo.
- O runtime usa Node (não Edge), portanto `argon2` 0.45.1 continua usando sua
  instalação nativa Linux/Node 22. `npm ci` e a suíte executam hash/verificação
  sem filesystem persistente; se a instalação Vercel falhar, interrompa o
  deploy em vez de trocar o algoritmo.
- PrismaClient é criado uma vez por módulo aquecido da Function, não por
  request; o código não pressupõe processo permanente e continua fechando a
  instância no servidor local.
- Não há persistência de sessão, upload ou dados no filesystem da Function.
- Se a API não encontra `prisma/`, habilite **Include source files outside of
  the Root Directory** no projeto API e redeploy. Se uma Preview precisar ser
  funcional, use banco Neon separado; não forneça as URLs da homologação.
- Logs estruturados continuam sem password, cookie, token de sessão, URLs do
  banco ou hash Argon2. Use logs Vercel para `requestId`, rota, status e erro
  de domínio.
