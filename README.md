# Vantta

Vantta é um comparador de preços de supermercado: o usuário monta uma lista de
compras, o sistema compara os itens contra os preços cadastrados de cada
supermercado (importados via planilha por um admin) e mostra onde a compra
sai mais barata — item a item e no total do carrinho. O resultado pode ser
exportado em PDF.

## Estrutura de pastas

```
backend/            API REST em Node.js + Express + TypeScript
  src/
    controllers/     handlers HTTP (parsing de request, status codes)
    services/        regras de negócio (auth, listas, comparação, usuários)
    repositories/     acesso ao Postgres (SQL puro via node-postgres)
    models/           tipos de domínio
    middlewares/      autenticação JWT, autorização por role, upload
    routes/           definição das rotas Express
    utils/            helpers puros (JWT, parser de planilha, geração de PDF)
    db/               migrations, seed, pool de conexão
    tests/            testes unitários (vitest)
frontend/            App Next.js (App Router) + TypeScript + Tailwind CSS
  src/
    app/              páginas (login, dashboard, listas, comparação, admin)
    components/       componentes de UI reutilizáveis e AppHeader
    lib/               cliente da API, contexto de autenticação
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou acessível via `DATABASE_URL`)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL, JWT_SECRET etc.
npm run migrate        # cria as tabelas
npm run seed            # cria usuário admin inicial + dados de exemplo
npm run dev              # sobe a API em http://localhost:3001
```

Variáveis de ambiente (`backend/.env`):

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | connection string do Postgres |
| `JWT_SECRET` | segredo usado para assinar os tokens JWT |
| `JWT_EXPIRES_IN` | validade do token (ex.: `7d`) |
| `PORT` | porta da API (padrão `3001`) |
| `NODE_ENV` | `development` / `production` |
| `CORS_ORIGIN` | origem(s) permitida(s) para CORS, separadas por vírgula |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | credenciais do admin criado pelo seed |

Outros comandos úteis:

```bash
npm run test        # roda a suíte de testes (vitest)
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run build         # compila para dist/
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev            # sobe em http://localhost:3000
```

```bash
npm run build   # build de produção
npm run lint     # eslint
```

## Fluxo principal (experiência ideal)

1. Usuário faz login.
2. Cria uma lista de compras e adiciona os itens (nome do produto + quantidade).
3. Clica em "Comparar preços": a API casa cada item da lista com o produto
   mais parecido de cada supermercado cadastrado (matching por similaridade
   de texto) e calcula o total por supermercado, o vencedor e a economia.
4. O usuário pode exportar o resultado da comparação em PDF (mesmos dados já
   calculados na tela, sem recálculo).

Do lado do admin: cadastro de supermercados, upload de planilha (CSV/XLSX)
com os produtos e preços de cada supermercado, e gestão de usuários
(criar, editar, ativar/desativar, definir perfil admin/usuário).

## O que está implementado

- Autenticação por e-mail/senha com JWT, dois perfis (`admin` e `user`).
- CRUD de supermercados (admin) e upload de planilha de preços com relatório
  de linhas importadas/erros.
- Gestão de usuários (admin): criar, editar, ativar/desativar, excluir.
- Listas de compras do usuário: criar, renomear, excluir, adicionar/editar/
  remover itens.
- Motor de comparação de preços: casamento de produtos por similaridade de
  nome, cálculo de total por supermercado, ranking, vencedor e economia
  máxima — tudo calculado sob demanda em `GET /lists/:id/compare`.
- Exportação da comparação em PDF (`GET /lists/:id/pdf`), reaproveitando o
  mesmo resultado calculado pela comparação (cabeçalho com marca, resumo,
  tabela por supermercado, tabela item a item, rodapé).
- Telas responsivas (mobile-first) com estados de carregamento, erro e vazio
  em todas as telas principais, labels associados a inputs, foco de teclado
  visível e uso do verde da marca apenas em fundos/badges (não como cor de
  texto corrido, por contraste).
- Testes unitários do backend (parser de planilha, matching, comparação,
  JWT, middlewares, serviço de usuários).

## O que ficou fora do escopo do MVP

Conforme o documento técnico do Vantta, os itens abaixo fazem parte do
roadmap completo do produto mas **não** foram implementados nesta etapa:

- Pagamentos / planos pagos.
- Notificações (e-mail, push) de preços ou de novas listas.
- Recursos sociais (compartilhamento de listas entre usuários, comentários).
- IA para sugestão de produtos/substitutos além do matching por similaridade
  de texto já existente.
- Atualização automática de preços via integração com sistemas dos
  supermercados (hoje é 100% via upload manual de planilha pelo admin).
- Histórico de preços / gráficos de variação ao longo do tempo.
- Aplicativo mobile nativo (a versão web já é responsiva, mas não há app).
