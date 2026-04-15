SumMeet AI — Backend

API Node.js + Express responsável por autenticação, upload para S3, análise com Google Gemini e armazenamento no PostgreSQL.

---

## Arquitetura

Clean Architecture com separação clara de responsabilidades:

- **`domain/`** — Entidades e interfaces de repositório. Zero dependências externas.
- **`infrastructure/`** — Prisma, S3Provider, GeminiProvider, app-config (carrega vars do AWS)
- **`use-cases/`** — Lógica de negócio (analyze-video, list-meetings, etc.)
- **`interfaces/http/`** — Routers e middlewares Express

---

## Quick Start (Local)

> **Pré-requisito obrigatório: Docker**
> O banco de dados local roda via Docker. Sem Docker rodando, o `npm run dev` não consegue conectar ao PostgreSQL.

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com seus valores reais:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/summarizemeets?schema=public"
GEMINI_API_KEY=sua-chave-do-gemini
JWT_SECRET=uma-string-longa-e-aleatoria
S3_RECORDINGS_BUCKET=summeet-recordings
AWS_REGION=us-east-1
```

### 3. Subir o banco local

```bash
docker-compose up -d
```

Isso sobe um PostgreSQL na porta `5433` (para não conflitar com instâncias locais na 5432).

### 4. Aplicar migrations e gerar client

```bash
npx prisma migrate dev
```

### 5. Executar

```bash
npm run dev
```

O script já inclui `SKIP_AWS_CONFIG=true`, que faz o backend ignorar SSM/Secrets Manager e usar o `.env` local. Sem esse flag, o backend tentaria conectar ao RDS da AWS (necessário credenciais e VPN).

Backend disponível em `http://localhost:3000`.

Swagger UI disponível em `http://localhost:3000/api/docs` (spec JSON em `/api/docs.json`).

> **Produção (EC2):** usa `npm start` sem o flag, carregando tudo do SSM + Secrets Manager automaticamente.

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com auto-reload (ts-node + nodemon) |
| `npm run compile` | Compila TypeScript → `dist/` |
| `npm start` | Executa `dist/server.js` (produção) |
| `npm test` | Roda os testes unitários (Jest) |
| `npm run format` | Formata código com Prettier |

---

## Testes

```bash
npm test
```

Cobertura com Jest + Supertest (52 testes, 11 suites):

- **Middleware** — `auth.middleware`: token válido, expirado, inválido, ausente, secret não configurado
- **Routers** — `media-upload.router`: upload URL, analyze-media, validações de input, fila cheia
- **Use cases** — `login-user`, `register-user`, `create-user`, `list-user-meetings`, `get-meeting-details`, `analyze-video`
- **Domain** — `Meeting` entity: getters, status default, toJSON
- **Infrastructure** — `QueueService`: concorrência, limites, stats; `extract-json`: parsing de JSON puro, markdown e texto com ruído

---

## Variáveis de Ambiente

O arquivo `.env.example` documenta todas as variáveis necessárias para rodar localmente.

| Variável | Descrição | Origem em produção |
|----------|-----------|-------------------|
| `DATABASE_URL` | Connection string PostgreSQL | Secrets Manager |
| `GEMINI_API_KEY` | Chave Google Gemini | Secrets Manager |
| `JWT_SECRET` | Secret para assinar tokens | Secrets Manager |
| `S3_RECORDINGS_BUCKET` | Nome do bucket de gravações | SSM Parameter Store |
| `AWS_REGION` | Região AWS | `us-east-1` (default) |

---

## Rotas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/register` | Cadastro | Pública |
| `POST` | `/api/auth/login` | Login | Pública |
| `POST` | `/api/upload-url` | Gera pre-signed PUT URL para S3 | JWT |
| `POST` | `/api/analyze-media` | Inicia análise do arquivo no S3 | JWT |
| `GET` | `/api/meetings/:id` | Detalhes de uma reunião | JWT |
| `GET` | `/api/meetings/:id/download-url` | Pre-signed GET URL do arquivo | JWT |
| `GET` | `/api/meetings/user/:userId` | Lista reuniões do usuário | JWT |
| `GET` | `/api/history` | Histórico do usuário autenticado | JWT |

---

## Tecnologias

- **Node.js 24** + **TypeScript 5** + **Express 5**
- **Prisma ORM 7** — PostgreSQL 17
- **Google Gemini** (`@google/genai`)
- **AWS SDK v3** — S3, SSM, Secrets Manager
- **JWT** + **bcrypt** — Autenticação
- **Zod** — Validação da resposta do Gemini
- **pino** — Logging estruturado
- **pm2** — Process manager em produção

---

## Deploy em Produção

```bash
# Na raiz do projeto
bash scripts/deploy-backend.sh
```

O script faz rsync do código, instala dependências, compila e reinicia o pm2 na EC2.
Requer `summeet-key.pem` na raiz e perfil AWS `summeet` configurado.

Após o deploy, o Swagger UI está disponível em:

```
https://d1lk17oezuw2r3.cloudfront.net/api/docs
```
