SummarizeMeets - Backend

Backend da aplicação SummarizeMeets - Sistema de resumo inteligente de reuniões usando IA.

---

## Arquitetura

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

### **Domain Layer (Domínio)**
- Entidades de negócio (`User`, `Meeting`)
- Interfaces de repositórios (contratos)
- **Zero dependências** de frameworks externos

### **Infrastructure Layer (Infraestrutura)**
- Implementações de repositórios (Prisma)
- Configuração de banco de dados
- Providers externos (Gemini AI)

### **Interface Layer (Interface)**
- Controllers e Routes HTTP
- Middlewares de validação
- Entrada/saída de dados

### **Use Cases (Casos de Uso)**
- Lógica de aplicação
- Orquestração de entidades e repositories
- Validações de negócio

---

## Quick Start

### **1. Pré-requisitos**
- Node.js 22+
- Docker e Docker Compose
- npm

### **2. Instalação**

```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env
```

### **3. Configurar Banco de Dados**

```bash
# Iniciar PostgreSQL no Docker
docker-compose up -d

# Aplicar migrações
npx prisma migrate dev

# Testar conexão
npm run test:db
```

**Sucesso:** Deve mostrar "Todos os testes passaram!"

### **4. Executar Aplicação**

```bash
# Modo desenvolvimento
npm run dev

# Compilar TypeScript
npm run compile

# Modo produção
npm start
```

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento (watch) |
| `npm run compile` | Compila TypeScript para JavaScript |
| `npm start` | Executa versão compilada (produção) |
| `npm run test:db` | Testa conexão e operações do banco |
| `npm run format` | Formata código com Prettier |

---

## Banco de Dados

### **Tecnologias**
- **PostgreSQL 15**
- **Prisma ORM 7**
- **Porta:** 5433

### Documentação Completa

- **[DATABASE.md](docs/DATABASE.md)** - Documentação completa do banco de dados
- **[DATABASE_SETUP.md](docs/DATABASE_SETUP.md)** - Guia passo a passo de configuração

---

## Tecnologias

### **Core**
- **TypeScript 5.9**
- **Node.js 22**
- **Express 5**

### **Database**
- **PostgreSQL 15**
- **Prisma ORM 7**
- **@prisma/adapter-pg**

### **AI/ML**
- **Google Generative AI (Gemini)**

### **Utilities**
- **Multer** - Upload de arquivos
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logger HTTP
- **Dotenv** - Variáveis de ambiente

### **Dev Tools**
- **ts-node** - Execução TypeScript
- **Nodemon** - Auto-reload
- **Prettier** - Code formatter
