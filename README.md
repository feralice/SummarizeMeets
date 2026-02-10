# SummarizeMeets

MotoAcademy grupo 4

Plataforma web que transforma gravações de reuniões em resumos, decisões e itens de ação usando IA generativa.

## Pré-requisitos

- Node.js (v18+)
- Docker e Docker Compose
- Angular CLI

## Como rodar o projeto

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
# Edite o .env com sua GEMINI_API_KEY

# Subir o banco de dados (PostgreSQL)
docker-compose up -d

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma migrate deploy

# Rodar o servidor
npm run dev
```

O backend estará disponível em `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar o servidor de desenvolvimento
npm start
```

O frontend estará disponível em `http://localhost:4200`.

## Estrutura do Projeto

```
SummarizeMeets/
├── backend/
│   ├── prisma/              # Schema e migrations do banco
│   ├── src/
│   │   ├── domain/          # Entidades e interfaces de repositório
│   │   ├── infrastructure/  # Implementações (Prisma, Gemini)
│   │   ├── interfaces/http/ # Rotas Express
│   │   ├── use-cases/       # Casos de uso da aplicação
│   │   └── server.ts        # Configuração do Express
│   ├── requests/            # Arquivos .http para testar endpoints
│   ├── docs/                # Documentação do banco
│   └── docker-compose.yml   # PostgreSQL container
├── frontend/
│   └── src/app/             # Aplicação Angular
└── README.md
```

## API Endpoints

### Usuários

| Método   | Rota             | Descrição         |
| -------- | ---------------- | ----------------- |
| `POST`   | `/api/users`     | Criar usuário     |
| `GET`    | `/api/users`     | Listar usuários   |
| `GET`    | `/api/users/:id` | Buscar por ID     |
| `PUT`    | `/api/users/:id` | Atualizar usuário |
| `DELETE` | `/api/users/:id` | Deletar usuário   |

### Mídia

| Método | Rota                 | Descrição            |
| ------ | -------------------- | -------------------- |
| `POST` | `/api/analyze-media` | Analisar áudio/vídeo |

## Tecnologias

- **Frontend:** Angular
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **IA:** Google Gemini
- **Containerização:** Docker

## Variáveis de Ambiente

| Variável         | Descrição                       |
| ---------------- | ------------------------------- |
| `DATABASE_URL`   | URL de conexão com o PostgreSQL |
| `GEMINI_API_KEY` | Chave da API do Google Gemini   |
| `PORT`           | Porta do servidor               |

## Documentação

- [Banco de Dados](backend/docs/DATABASE.md)
- [Requests HTTP](backend/requests/)
