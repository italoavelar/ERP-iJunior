# ERP iJunior — módulo financeiro

Front-end em Vite + React + TypeScript e API em Express + Prisma sobre PostgreSQL.

## Estrutura

```
.                  front-end (Vite + React)
├─ src/            telas, componentes e hooks
├─ server/         API (Express + Prisma)
│  ├─ src/         rotas, serviços e validação
│  └─ prisma/      schema e migrations
└─ docker-compose.yml   PostgreSQL de desenvolvimento
```

## Rodando

Pré-requisitos: Node 22 e Docker.

```bash
# 1. banco
docker compose up -d

# 2. API (porta 3333)
cd server
cp .env.example .env
npm install
npm run db:migrate     # aplica as migrations
npm run db:seed        # time e atividades de demonstração
npm run db:import      # projetos, parcelas e sprints (ver "Dados de projetos")
npm run dev

# 3. front-end (porta 5173), em outro terminal
npm install
npm run dev
```

## API

Base: `http://localhost:3333`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Verificação de saúde |
| GET | `/api/people` | Lista o time |
| GET | `/api/activities?status=open\|done` | Lista atividades |
| POST | `/api/activities` | Cria atividade |
| PATCH | `/api/activities/:id` | Edita título, detalhes ou responsáveis |
| POST | `/api/activities/:id/toggle` | Alterna concluída/aberta |
| DELETE | `/api/activities/:id` | Remove atividade |
| GET | `/api/installments` | Todas as parcelas de todos os projetos (calendário e tabela) |
| GET | `/api/projects?status=running\|finished` | Lista projetos |
| GET | `/api/projects/:id` | Detalhe do projeto, com o plano de parcelas |
| PATCH | `/api/projects/:id` | Edita nome, descrição, P.O., produto e situação |
| DELETE | `/api/projects/:id` | Exclui o projeto com suas parcelas e sprints |
| PATCH | `/api/projects/:id/installments/:number` | Edita pagamento, data de pagamento, vencimento ou valor da parcela |
| PUT | `/api/projects/:id/installments` | Refaz o plano: preço, nº de parcelas, 1º vencimento e pagas |
| PATCH | `/api/projects/:id/sprints/:number` | Valida uma sprint (`{ "validated": boolean }`) e libera a cobrança das parcelas ligadas a ela |

O total contratado e o valor pago de um projeto são somados a partir das
parcelas, não guardados em coluna — editar uma parcela recalcula os dois.

Erros saem como `{ "error": "…" }`; falhas de validação incluem `issues` com o campo e a mensagem.

## Dados de projetos

Os projetos reais (clientes, contratos, parcelas) ficam em
`server/prisma/data/projetos.json`. **O arquivo tem dados de clientes: o
repositório deve ser privado.** Eles entram no banco com:

```bash
cd server
npm run db:import -- --prune   # --prune remove do banco o que não está no arquivo
```

Sem esse arquivo, o import usa `projetos.example.json`, com dados fictícios.
O arquivo serve para a carga inicial: depois dela, o banco é a fonte da verdade,
e rodar o import de novo sobrescreve o que foi editado ou excluído pela tela. A
importação confere, antes de gravar, se as parcelas de cada projeto somam o
total e o valor recebido esperados.

Parcelas podem ficar sem vencimento quando dependem de um marco (entrega,
assinatura, emissão da nota). Nos projetos pagos por sprint, a parcela aponta para a sprint que a
libera: validar a sprint na tela de parcelas dá a ela o vencimento do dia.

## Publicar na Vercel

São dois projetos na Vercel apontando para o mesmo repositório — um para a API
(pasta `server`) e outro para o front (raiz) — e um banco Postgres no Neon.

As migrations rodam sozinhas no deploy de **produção** da API. Por isso a
branch de produção dos dois projetos deve ser a `desenvolvimento`, que é onde
está este código (a `main` ainda tem a versão antiga).

**1. Banco.** Na Vercel: *Storage → Create Database → Neon*. Ao conectar o
banco ao projeto da API (passo 2), ela cria `DATABASE_URL` e
`DATABASE_URL_UNPOOLED` — a API usa a segunda, que é a conexão direta.

**2. Projeto da API.** *Add New → Project →* este repositório.
- **Root Directory:** `server`
- **Framework Preset:** Other (o `server/vercel.json` cuida do build)
- **Variáveis:** as do banco (passo 1) e `CORS_ORIGIN`, com o endereço do front
  e o padrão dos previews, separados por vírgula — ex.:
  `https://erp-ijunior.vercel.app,https://erp-ijunior-*.vercel.app`. Dá para
  pôr um valor provisório e corrigir no passo 5.
- **Settings → Git → Production Branch:** `desenvolvimento`. O primeiro deploy,
  feito a partir da `main`, falha por não achar a pasta `server`: troque a branch
  e faça *Redeploy*.
- Confira em `https://<endereço-da-api>/health`, que deve responder `{"status":"ok"}`.

**3. Carga inicial**, uma vez só, de um computador com o repositório. Use a
connection string do Neon (*Storage → o banco → .env.local*, valor de
`DATABASE_URL_UNPOOLED`):

```bash
cd server && npm install
export DATABASE_URL="postgresql://...neon.tech/..."   # vence o .env local
npm run db:seed && npm run db:import
```

Não rode o import de novo depois: ele sobrescreve o que foi editado pela tela.

**4. Projeto do front.** *Add New → Project →* o mesmo repositório.
- **Root Directory:** `./` · **Framework:** Vite
- **Variável:** `VITE_API_URL` = endereço da API (ex.:
  `https://erp-ijunior-api.vercel.app`). Sem ela o build falha de propósito, com
  uma mensagem explicando.
- **Production Branch:** `desenvolvimento`, como na API.

**5.** Volte à API, ajuste `CORS_ORIGIN` com o endereço real do front e faça
*Redeploy*. Se as telas mostrarem "Não foi possível falar com o servidor", é
quase sempre `VITE_API_URL` ou `CORS_ORIGIN`.

## Scripts do servidor

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com reload |
| `npm run build` / `start` | Compila para `dist/` e roda o compilado |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:migrate` | Cria e aplica migration em desenvolvimento |
| `npm run db:deploy` | Aplica migrations existentes (produção) |
| `npm run db:seed` | Time e atividades de demonstração (idempotente) |
| `npm run db:import` | Projetos, parcelas e sprints a partir de `prisma/data/` |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run vercel-build` | Build usado pela Vercel (gera o client, aplica migrations em produção, compila) |

## Front-end e API

As telas consomem a API por `src/lib/api.ts`. A URL vem de `VITE_API_URL`
(veja `.env.example`); sem ela, o padrão é `http://localhost:3333`.

Com a API fora do ar, cada tela mostra o erro com um botão de recarregar, em
vez de aparentar uma lista vazia.
