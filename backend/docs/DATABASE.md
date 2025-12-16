# Documentação do Banco de Dados

## Início Rápido

```bash
# 1. Subir banco de dados
docker-compose up -d

# 2. Aplicar schema
npx prisma migrate dev

# 3. Testar
npm run test:db
```

## Configuração

### Variáveis de Ambiente

Configure o arquivo `.env` com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/summarizemeets?schema=public"
```

## Guia de Configuração

### 1. Iniciar PostgreSQL com Docker

```bash
cd backend
docker-compose up -d
```

**O que acontece:**
- Docker baixa a imagem PostgreSQL 15
- Cria container chamado `summarizemeets-postgres`
- PostgreSQL roda na porta 5433
- Dados são salvos no volume `postgres_data`

**Verificar se está rodando:**
```bash
docker ps
```

### 2. Aplicar Migrações do Prisma

```bash
npx prisma migrate dev
```

**O que acontece:**
- Prisma lê o arquivo `prisma/schema.prisma`
- Cria tabelas `users` e `meetings`
- Gera Prisma Client em `src/generated/prisma/`
- Salva migração em `prisma/migrations/`

**Verificar se tabelas foram criadas:**
```bash
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\dt"
```

### 3. Executar Testes

```bash
npm run test:db
```

## Estrutura do Banco de Dados

### Tabela: users

Armazena informações dos usuários.

| Campo     | Tipo        | Descrição                      |
| --------- | ----------- | ------------------------------ |
| id        | TEXT (UUID) | Identificador único do usuário |
| name      | TEXT        | Nome completo                  |
| email     | TEXT        | Email único                    |
| password  | TEXT        | Senha criptografada            |
| createdAt | TIMESTAMP   | Data de criação                |
| updatedAt | TIMESTAMP   | Data da última atualização     |

**Índices:**
- `users_email_key`: Índice único no campo email

**Relacionamentos:**
- Um usuário pode ter várias reuniões (1:N)

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

**Índices:**
- `meetings_pkey`: Chave primária no campo id

**Relacionamentos:**
- Cada reunião pertence a um usuário (N:1)
- Exclusão em cascata: quando um usuário é deletado, suas reuniões também são

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

### Comandos Docker

```bash
# Parar banco (mantém dados)
docker-compose stop

# Parar e remover container (mantém dados)
docker-compose down

# Parar e apagar tudo
docker-compose down -v

# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs -f
```

### Comandos Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações
npx prisma migrate deploy

# Resetar banco (apaga tudo e recria)
npx prisma migrate reset --force

# Verificar status das migrações
npx prisma migrate status

# Abrir Prisma Studio (GUI em http://localhost:5555)
npx prisma studio
```

### Inspeção do Banco de Dados

```bash
# Ver estrutura da tabela users
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\d users"

# Ver estrutura da tabela meetings
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\d meetings"

# Contar registros
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets \
  -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM meetings;"
```

## Resolução de Problemas

### Problema: Porta 5433 já em uso

**Solução:**
Mudar porta no `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"
```

E no `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/summarizemeets?schema=public"
```

### Problema: Container unhealthy

**Solução:**
```bash
# Ver logs
docker-compose logs

# Recriar
docker-compose down
docker-compose up -d
```

### Problema: Tabelas não foram criadas

**Solução:**
```bash
# Executar migração novamente
npx prisma migrate dev

# Verificar
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\dt"
```

## Resumo de Comandos

| Comando | O que faz |
|---------|-----------|
| `docker-compose up -d` | Inicia PostgreSQL |
| `npx prisma migrate dev` | Cria tabelas |
| `npm run test:db` | Testa conexão |
| `docker-compose down` | Para banco |
| `npx prisma studio` | Abre GUI |
