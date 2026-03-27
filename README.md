# SumMeet AI

Plataforma web que transforma gravações de reuniões (Google Meet, Teams, Zoom) em resumos estruturados, decisões e itens de ação usando Google Gemini.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 20+ (standalone) |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL via Prisma ORM |
| IA | Google Gemini |
| Upload | AWS S3 Pre-signed URLs |
| Infra | EC2 + RDS + S3 + CloudFront (AWS) |

## Estrutura do Projeto

```
SummarizeMeets/
├── backend/              # API Node.js + Express
├── frontend/             # Aplicação Angular
├── scripts/              # Scripts de deploy
│   ├── deploy-backend.sh # Re-deploy do backend na EC2
│   └── deploy-frontend.sh # Re-deploy do frontend no S3
├── docs/infra/           # Guias passo a passo da infraestrutura AWS
├── scripts/user-data.sh          # Script de bootstrap da EC2
```

---

## Ambiente de Produção (AWS)

**URL:** `https://d1lk17oezuw2r3.cloudfront.net`

| Recurso | Detalhes |
|---------|---------|
| CloudFront | `E3TZGRL830WWMY` — CDN para frontend + proxy da API |
| EC2 | `i-07ce4c4906a05cc62` — t3.micro, `44.206.85.231` |
| RDS | PostgreSQL 17, `summeet-rds` |
| S3 Frontend | `summeet-app` |
| S3 Recordings | `summeet-recordings` |

### Re-deploy

```bash
# Backend (após alterar código em backend/)
bash scripts/deploy-backend.sh

# Frontend (após alterar código em frontend/)
bash scripts/deploy-frontend.sh
```

> Ambos os scripts requerem o arquivo `summeet-key.pem` na raiz do projeto e o perfil AWS `summeet` configurado.

---

## Desenvolvimento Local

### Pré-requisitos

- Node.js 24+
- Docker (para o PostgreSQL local)
- Angular CLI

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar .env a partir do exemplo
cp .env.example .env
# Edite com: GEMINI_API_KEY, JWT_SECRET e DATABASE_URL

# Subir PostgreSQL local
docker-compose up -d

# Gerar Prisma Client e rodar migrations
npx prisma generate
npx prisma migrate dev

# Rodar em desenvolvimento
npm run dev
```

Backend disponível em `http://localhost:3000`.

> Na AWS, as variáveis de ambiente são carregadas automaticamente do SSM + Secrets Manager pelo `app-config.ts`. O arquivo `.env` só é usado localmente.

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar em desenvolvimento (aponta para localhost:3000)
npm start
```

Frontend disponível em `http://localhost:4200`.

> O arquivo `src/environments/environment.ts` aponta para `localhost:3000`.
> O `src/environments/environment.prod.ts` aponta para a URL do CloudFront e é usado automaticamente no build de produção.

---

## Infraestrutura AWS

A infra foi configurada manualmente via AWS CLI. Documentação completa passo a passo em [`docs/infra/`](docs/infra/):

| Etapa | Descrição |
|-------|-----------|
| [01 - VPC e Security Groups](docs/infra/01-vpc-security-groups.md) | Rede privada e regras de firewall |
| [02 - RDS PostgreSQL](docs/infra/02-rds-postgresql.md) | Banco de dados gerenciado |
| [03 - S3 e IAM](docs/infra/03-s3-iam.md) | Buckets e permissões |
| [04 - Secrets Manager e SSM](docs/infra/04-secrets-ssm.md) | Secrets e parâmetros |
| [05 - EC2 e Backend](docs/infra/05-ec2-backend.md) | Servidor e primeiro deploy |
| [06 - CloudFront e Frontend](docs/infra/06-cloudfront-frontend.md) | CDN e deploy do Angular |

---

## Rotas da API

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

## Fluxo de Upload

1. Frontend solicita `POST /api/upload-url` com `{ mimeType }` → recebe `{ uploadUrl, s3Key }`
2. Frontend faz `PUT <uploadUrl>` **direto no S3** com o arquivo (sem passar pelo EC2)
3. Frontend notifica `POST /api/analyze-media` com `{ s3Key, meetingTitle }`
4. Backend processa em background: baixa do S3, envia ao Gemini, salva resultado no RDS
