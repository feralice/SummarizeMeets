# SumMeet AI — Frontend

Aplicação Angular que permite upload de gravações de reuniões, exibe resumos gerados por IA e exporta resultados em PDF.

---

## URLs

| Ambiente | URL |
|----------|-----|
| Produção | `https://d1lk17oezuw2r3.cloudfront.net` |
| Local | `http://localhost:4200` |

---

## Quick Start (Local)

### Pré-requisitos

- Node.js 24+
- Backend rodando em `http://localhost:3000`

### Instalação e execução

```bash
npm install

# Servidor de desenvolvimento (aponta para localhost:3000)
npm start
```

O app estará disponível em `http://localhost:4200` com hot-reload automático.

---

## Environments

O projeto usa Angular environment files para separar URLs por ambiente:

| Arquivo | Usado em | API URL |
|---------|----------|---------|
| `src/environments/environment.ts` | `npm start` / `ng serve` | `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Build de produção | `https://d1lk17oezuw2r3.cloudfront.net/api` |

O `angular.json` já está configurado com `fileReplacements` para trocar automaticamente os arquivos na build de produção.

---

## Build de Produção

```bash
# Gera os arquivos em dist/frontend/browser/
npm run build -- --configuration production
```

> Usa `environment.prod.ts` automaticamente — aponta para CloudFront.

---

## Deploy em Produção

```bash
# Na raiz do projeto
bash scripts/deploy-frontend.sh
```

O script faz o build, sincroniza com o S3 e invalida o cache do CloudFront.
Requer perfil AWS `summeet` configurado.

---

## Rotas

| Rota | Descrição | Guard |
|------|-----------|-------|
| `/login` | Login e cadastro | `noAuthGuard` |
| `/` | Upload + análise | `authGuard` |
| `/history` | Histórico de reuniões | `authGuard` |
| `/meeting/:id` | Detalhes da reunião | — |

---

## Fluxo de Upload

1. Usuário seleciona arquivo de vídeo/áudio
2. Frontend solicita `POST /api/upload-url` → recebe `{ uploadUrl, s3Key }`
3. Frontend faz `PUT <uploadUrl>` **direto no S3** (sem passar pelo backend)
4. Frontend notifica `POST /api/analyze-media` com `{ s3Key, meetingTitle }`
5. Backend processa em background e retorna `{ meetingId, status: "queued" }`
6. Frontend exibe progresso e resultado quando disponível

---

## Tecnologias

- **Angular 20+** — Standalone components
- **RxJS** — Gerenciamento de estado e chamadas HTTP
- **jsPDF + html2canvas** — Exportação em PDF
- **TypeScript 5**
