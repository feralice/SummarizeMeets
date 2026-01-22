# Documentação do Banco de Dados

## Início Rápido

```bash
# 1. Subir banco de dados
docker-compose up -d

# 2. Gerar Prisma Client
npx prisma generate

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. Testar
npm run test:db
```

## Configuração

### Variáveis de Ambiente

Configure o arquivo `.env` com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/summarizemeets?schema=public"
GEMINI_API_KEY=GEMINI_API_KEY
```

## Estrutura do Banco de Dados

### Tabela: users

Armazena informações dos usuários.

| Campo     | Tipo        | Descrição                      |
| --------- | ----------- | ------------------------------ |
| id        | TEXT (UUID) | Identificador único do usuário |
| name      | TEXT        | Nome completo                  |
| email     | TEXT        | Email único                    |
| password  | TEXT        | Senha hashada com bcrypt       |
| createdAt | TIMESTAMP   | Data de criação                |
| updatedAt | TIMESTAMP   | Data da última atualização     |

**Índices:**
- `users_email_key`: Índice único no campo email

**Relacionamentos:**
- Um usuário pode ter várias reuniões (1:N)

**Segurança:**
- Senhas são hashadas com `bcrypt` (salt rounds = 10) antes de salvar
- O campo `password` nunca é retornado nas respostas da API

### Tabela: meetings

Armazena informações sobre as reuniões.

| Campo        | Tipo        | Descrição                             |
| ------------ | ----------- | ------------------------------------- |
| id           | TEXT (UUID) | Identificador único da reunião        |
| meetingTitle | TEXT        | Título da reunião                     |
| meetingDate  | TIMESTAMP   | Data e hora da reunião                |
| summary      | TEXT        | Resumo gerado pela IA                 |
| actionPoints | TEXT        | Pontos de ação identificados          |
| notes        | TEXT        | Notas adicionais (opcional)           |
| status       | TEXT        | Status da reunião (padrão: 'pending') |
| createdAt    | TIMESTAMP   | Data de criação                       |
| updatedAt    | TIMESTAMP   | Data da última atualização            |
| userId       | TEXT (UUID) | ID do usuário dono da reunião         |

**Relacionamentos:**
- Cada reunião pertence a um usuário (N:1)
- Exclusão em cascata: quando um usuário é deletado, suas reuniões também são

## API de Usuários (CRUD)

### Endpoints

| Método   | Rota              | Descrição             | Status codes        |
| -------- | ----------------- | --------------------- | ------------------- |
| `POST`   | `/api/users`      | Criar usuário         | 201, 400, 409, 500  |
| `GET`    | `/api/users`      | Listar todos          | 200, 500            |
| `GET`    | `/api/users/:id`  | Buscar por ID         | 200, 404, 500       |
| `PUT`    | `/api/users/:id`  | Atualizar usuário     | 200, 404, 409, 500  |
| `DELETE` | `/api/users/:id`  | Deletar usuário       | 204, 404, 500       |


## Schema do Prisma

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  meetings  Meeting[]

  @@map("users")
}

model Meeting {
  id            String   @id @default(uuid())
  meetingTitle  String
  meetingDate   DateTime
  summary       String   @db.Text
  actionPoints  String   @db.Text
  notes         String?  @db.Text
  status        String   @default("pending")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("meetings")
}
```

## Comandos Úteis

### Docker

| Comando                      | O que faz                        |
| ---------------------------- | -------------------------------- |
| `docker-compose up -d`       | Inicia PostgreSQL                |
| `docker-compose stop`        | Para o banco                     |
| `docker-compose down`        | Para e remove container          |
| `docker-compose logs -f`     | Ver logs do container            |

### Prisma

| Comando                                   | O que faz                              |
| ----------------------------------------- | -------------------------------------- |
| `npx prisma generate`                     | Gera Prisma Client                     |
| `npx prisma migrate dev --name <nome>`    | Cria nova migration                    |
| `npx prisma migrate deploy`               | Aplica migrations pendentes            |
| `npx prisma migrate reset --force`        | Reseta banco                           |
