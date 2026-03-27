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

### Pré-requisitos

- Node.js 24+
- Docker e Docker Compose

### Instalação

```bash
npm install

cp .env.example .env
# Edite .env com: GEMINI_API_KEY, JWT_SECRET, DATABASE_URL
```

### Banco de Dados

```bash
# Subir PostgreSQL local
docker-compose up -d

# Gerar Prisma Client e aplicar migrations
npx prisma generate
npx prisma migrate dev
```

### Executar

```bash
# Desenvolvimento (watch mode)
npm run dev

# Compilar TypeScript
npm run compile

# Produção (requer dist/ compilado)
npm start
```

Backend disponível em `http://localhost:3000`.

> Em produção na AWS, as variáveis de ambiente são carregadas automaticamente do SSM + Secrets Manager pelo `src/infrastructure/config/app-config.ts`. O `.env` só é usado localmente.

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com auto-reload (ts-node + nodemon) |
| `npm run compile` | Compila TypeScript → `dist/` |
| `npm start` | Executa `dist/server.js` (produção) |
| `npm run format` | Formata código com Prettier |

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
