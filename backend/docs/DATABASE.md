# Documentação do Banco de Dados

## Configuração

### Variáveis de Ambiente

Configure o arquivo `.env` com a seguinte variável:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/summarizemeets?schema=public"
```

### Docker

O banco de dados PostgreSQL roda em um container Docker. Para iniciar:

```bash
docker-compose up -d
```

Para parar:

```bash
docker-compose down
```

Para parar e remover volumes (apaga todos os dados):

```bash
docker-compose down -v
```

## Estrutura do Banco de Dados

### Tabela: users

Armazena informações dos usuários do sistema.

| Campo     | Tipo        | Descrição                      |
| --------- | ----------- | ------------------------------ |
| id        | TEXT (UUID) | Identificador único do usuário |
| name      | TEXT        | Nome completo do usuário       |
| email     | TEXT        | Email único do usuário         |
| password  | TEXT        | Senha criptografada            |
| createdAt | TIMESTAMP   | Data de criação do registro    |
| updatedAt | TIMESTAMP   | Data da última atualização     |

**Índices:**

- `users_email_key`: Índice único no campo email

**Relacionamentos:**

- Um usuário pode ter várias reuniões (1:N)

### Tabela: meetings

Armazena informações sobre as reuniões processadas.

| Campo        | Tipo        | Descrição                             |
| ------------ | ----------- | ------------------------------------- |
| id           | TEXT (UUID) | Identificador único da reunião        |
| meetingTitle | TEXT        | Título da reunião                     |
| meetingDate  | TIMESTAMP   | Data e hora da reunião                |
| summary      | TEXT        | Resumo gerado pela IA                 |
| actionPoints | TEXT        | Pontos de ação identificados          |
| notes        | TEXT        | Notas adicionais (opcional)           |
| status       | TEXT        | Status da reunião (padrão: 'pending') |
| createdAt    | TIMESTAMP   | Data de criação do registro           |
| updatedAt    | TIMESTAMP   | Data da última atualização            |
| userId       | TEXT (UUID) | ID do usuário dono da reunião         |

**Índices:**

- `meetings_pkey`: Chave primária no campo id

**Relacionamentos:**

- Cada reunião pertence a um usuário (N:1)
- Exclusão em cascata: quando um usuário é deletado, suas reuniões também são

## Comandos Prisma

### Gerar Prisma Client

```bash
npx prisma generate
```

### Criar uma nova migração

```bash
npx prisma migrate dev --name nome_da_migracao
```

### Aplicar migrações

```bash
npx prisma migrate deploy
```

### Resetar banco de dados

```bash
npx prisma migrate reset
```

## Scripts Disponíveis

### Testar Conexão com o Banco

```bash
npm run test:db
```

Este script:

1. Conecta ao banco de dados
2. Cria um usuário de teste
3. Cria uma reunião de teste
4. Verifica o relacionamento entre User e Meeting
5. Remove os dados de teste
6. Confirma que tudo está funcionando

## Modelo de Dados (Prisma Schema)

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

## Notas Importantes

1. **Prisma 7**: Este projeto usa Prisma 7, que requer o uso de adapters para conexão com o banco.
2. **Segurança**: Sempre use hashing (ex: bcrypt) para senhas antes de salvar no banco.
3. **UUID**: IDs são gerados automaticamente como UUIDs.
4. **Timestamps**: `createdAt` e `updatedAt` são gerenciados automaticamente pelo Prisma.
5. **Relacionamentos**: O relacionamento User-Meeting é 1:N com exclusão em cascata.
