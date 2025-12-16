# Database Setup - Docker + Prisma + Testes

```bash
# 1. Subir banco
docker-compose up -d

# 2. Aplicar schema
npx prisma migrate dev

# 3. Testar
npm run test:arch
```

---

## Passo a Passo Completo

### 1. Iniciar PostgreSQL no Docker

```bash
cd backend
docker-compose up -d
```

**O que acontece:**
- Docker baixa a imagem PostgreSQL 15
- Cria container chamado `summarizemeets-postgres`
- PostgreSQL roda na porta **5433**
- Dados ficam salvos no volume `postgres_data`

**Verificar se está rodando:**
```bash
docker ps
```

**Deve aparecer:**
```
NAME                      STATUS
summarizemeets-postgres   Up X minutes (healthy)
```

**Sucesso:** Se mostra `(healthy)`
**Erro:** Se não aparece ou mostra `(unhealthy)`

---

### 2. Aplicar Migrações do Prisma

```bash
npx prisma migrate dev
```

**O que acontece:**
- Prisma lê o arquivo `prisma/schema.prisma`
- Cria tabelas `users` e `meetings` no PostgreSQL
- Gera Prisma Client em `src/generated/prisma/`
- Salva migração em `prisma/migrations/`

**Saída esperada:**
```
Generated Prisma Client
Database schema is up to date!
```

**Verificar se tabelas foram criadas:**
```bash
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\dt"
```

**Deve mostrar:**
```
 public | _prisma_migrations | table | postgres
 public | meetings           | table | postgres
 public | users              | table | postgres
```

---

```bash
npm run test:arch
```

**O que acontece:**
- Script cria usuário de teste
- Cria 2 reuniões
- Busca reuniões do usuário
- Valida erros (email duplicado, etc)
- Limpa tudo automaticamente

**Saída esperada:**
```
Iniciando testes de arquitetura Clean Code...
Database connected successfully

═══════════════════════════════════════════════════
TESTE 1: Criar Usuário (Create User Use Case)
Usuário criado com sucesso!

═══════════════════════════════════════════════════
TESTE 3: Criar Reunião (Create Meeting Use Case)
Reunião criada com sucesso!

═══════════════════════════════════════════════════
TESTE 6: Validação de Erros
Erro capturado corretamente: "User with this email already exists"
Erro capturado corretamente: "Invalid email format"

TODOS OS TESTES PASSARAM COM SUCESSO!
```

---

## Verificações

### Verificar Docker
```bash
# Container está rodando?
docker ps | grep summarizemeets

# Ver logs
docker-compose logs

# Ver recursos (CPU, memória)
docker stats summarizemeets-postgres
```

---

### Verificar Prisma
```bash
# Status das migrações
npx prisma migrate status

# Abrir GUI do banco (http://localhost:5555)
npx prisma studio
```

---

### Verificar Banco de Dados
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

---

## Comandos Úteis

### Docker

```bash
# Parar banco (mantém dados)
docker-compose stop

# Parar e remover container (mantém dados)
docker-compose down

# Parar e APAGAR TUDO (cuidado!)
docker-compose down -v

# Reiniciar
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f
```

---

### Prisma

```bash
# Gerar Prisma Client novamente
npx prisma generate

# Resetar banco (apaga tudo e recria)
npx prisma migrate reset --force

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Abrir Prisma Studio (GUI)
npx prisma studio
```

---

## Troubleshooting

### Problema: Porta 5433 já em uso

**Erro:**
```
Error: bind: address already in use
```

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

---

### Problema: Container unhealthy

**Solução:**
```bash
# Ver logs
docker-compose logs

# Reiniciar
docker-compose restart

# Recriar
docker-compose down
docker-compose up -d
```

---

### Problema: Tabelas não foram criadas

**Solução:**
```bash
# Garantir que está no diretório correto
cd backend

# Executar migração novamente
npx prisma migrate dev

# Verificar
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\dt"
```

---

### Problema: Teste falha com "email already exists"

**Causa:** Dados de teste anterior ainda no banco

**Solução:**
```bash
# Limpar banco
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets \
  -c "DELETE FROM meetings; DELETE FROM users;"

# Rodar teste novamente
npm run test:arch
```

---

## Checklist de Validação

Execute esta checklist para garantir que tudo está funcionando:

```bash
# 1. Docker rodando?
docker ps | grep summarizemeets
# Deve mostrar container com status "healthy"

# 2. Banco conecta?
docker exec summarizemeets-postgres psql -U postgres -c "SELECT 1;"
# Deve mostrar "1"

# 3. Tabelas existem?
docker exec summarizemeets-postgres \
  psql -U postgres -d summarizemeets -c "\dt"
# Deve mostrar 3 tabelas (users, meetings, _prisma_migrations)

# 4. Prisma Client gerado?
ls -la src/generated/prisma/
# Deve mostrar vários arquivos .d.ts e .js

# 5. Teste passa?
npm run test:arch
# Deve mostrar "TODOS OS TESTES PASSARAM COM SUCESSO!"
```

---

## Resumo

| Comando | O que faz |
|---------|-----------|
| `docker-compose up -d` | Inicia PostgreSQL |
| `npx prisma migrate dev` | Cria tabelas |
| `npm run test:arch` | Testa tudo |
| `docker-compose down` | Para banco |
| `npx prisma studio` | Abre GUI |

---