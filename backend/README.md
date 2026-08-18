# Vantta Backend

API em Node.js + Express + TypeScript para o Vantta (comparador de preços de supermercado).

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edite .env com sua DATABASE_URL, JWT_SECRET etc.
```

Crie o banco de dados (se ainda não existir):

```bash
createdb vantta
```

Rode as migrations:

```bash
npm run migrate
```

Crie o usuário admin inicial (usa as variáveis `SEED_ADMIN_*` do `.env`):

```bash
npm run seed
```

Suba o servidor em modo desenvolvimento:

```bash
npm run dev
```

O servidor sobe em `http://localhost:3001` (ou na porta definida em `PORT`).

## Scripts

- `npm run dev` — servidor com hot reload (tsx watch)
- `npm run build` — compila TypeScript para `dist/`
- `npm start` — roda o build compilado
- `npm run typecheck` — checa tipos sem gerar output (`tsc --noEmit`)
- `npm run migrate` — aplica migrations SQL pendentes (idempotente, controla estado na tabela `schema_migrations`)
- `npm run seed` — cria o usuário admin inicial se ainda não existir
- `npm test` — roda os testes unitários (vitest)
- `npm run lint` — roda o eslint

## Estrutura

```
src/
  controllers/   recebe requisição, valida entrada, chama serviço
  services/      regra de negócio
  repositories/  acesso ao banco (CRUD puro)
  models/        definição das entidades/tipos
  middlewares/   autenticação e verificação de role
  routes/        definição dos endpoints
  utils/         funções auxiliares (jwt, etc.)
  db/            pool de conexão, migrations SQL e runner, seed
  tests/         testes unitários (não dependem de banco real)
```

## Autenticação

- `POST /auth/login` — `{ email, password }` → `{ token, user }`. Retorna 401 se credenciais inválidas, 403 se o usuário estiver `inactive`. Rate limited (10 tentativas / 15 min).
- `POST /auth/logout` — stateless, apenas endpoint de conveniência (o token é descartado no client).
- Rotas `/admin/*` exigem JWT válido + `role=admin` (middleware `authenticate` + `requireRole('admin')`).
- Rotas `/lists/*` exigem JWT válido (middleware `authenticate`).

Envie o token nas próximas requisições via header:

```
Authorization: Bearer <token>
```

## Testando manualmente

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vantta.com","password":"<sua senha do seed>"}'
```

## Status desta etapa (MVP - fundação + Fase 1 do roadmap)

Implementado nesta etapa: setup do projeto, schema do banco (5 tabelas), migrations, seed de admin, autenticação completa (login + JWT + bcrypt), middlewares `authenticate`/`requireRole`, e rotas protegidas esqueleto (`/admin/*`, `/lists/*`) que retornam `501 Not implemented yet` — a proteção de auth/role nelas já está ativa e testável.

Não implementado ainda (próximas etapas): CRUD de supermercados, upload/parse de planilha de preços, CRUD de listas de compras, motor de comparação de preços, geração de PDF, CRUD de usuários admin.
