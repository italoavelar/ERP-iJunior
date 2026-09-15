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
npm run db:seed        # popula com os dados de demonstração
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
| GET | `/api/projects?status=running\|finished` | Lista projetos |
| GET | `/api/projects/:id` | Detalhe do projeto, com o plano de parcelas |
| PATCH | `/api/projects/:id` | Edita nome, descrição, P.O., produto e situação |
| PATCH | `/api/projects/:id/nf` | Marca a NF da primeira parcela em aberto (`{ "issued": boolean }`) |
| PATCH | `/api/projects/:id/installments/:number/nf` | Marca a NF de uma parcela específica |
| PATCH | `/api/projects/:id/installments/:number` | Edita pagamento, NF ou valor da parcela |
| PUT | `/api/projects/:id/installments` | Refaz o plano: preço, nº de parcelas, 1º vencimento e pagas |

O total contratado e o valor pago de um projeto são somados a partir das
parcelas, não guardados em coluna — editar uma parcela recalcula os dois.

Erros saem como `{ "error": "…" }`; falhas de validação incluem `issues` com o campo e a mensagem.

## Scripts do servidor

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com reload |
| `npm run build` / `start` | Compila para `dist/` e roda o compilado |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:migrate` | Cria e aplica migration em desenvolvimento |
| `npm run db:deploy` | Aplica migrations existentes (produção) |
| `npm run db:seed` | Popula o banco (idempotente) |
| `npm run db:studio` | Abre o Prisma Studio |

## Front-end e API

As telas consomem a API por `src/lib/api.ts`. A URL vem de `VITE_API_URL`
(veja `.env.example`); sem ela, o padrão é `http://localhost:3333`.

Com a API fora do ar, cada tela mostra o erro com um botão de recarregar, em
vez de aparentar uma lista vazia.
