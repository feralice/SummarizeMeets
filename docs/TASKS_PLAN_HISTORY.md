# Plan: Meeting History and Details Pages (Task 11)

Este documento detalha os passos necessários para implementar a feature de histórico e detalhes de reuniões, permitindo que o usuário visualize suas análises anteriores.

## 1. Backend (Infra & Use Cases)

### Step 1.1: Persistência da Análise
Atualmente, o vídeo é analisado mas o resultado não é salvo.
- **Arquivo:** `backend/src/use-cases/analyze-video/analyze-video.ts`
- **Mudança:** Injetar `IMeetingRepository` e salvar o resultado no banco de dados.
- **Input:** Adicionar `userId` e `title` (opcional ou extraído do vídeo) ao input do use case.

### Step 1.2: Novos Use Cases
- Criar `ListUserMeetingsUseCase`: Busca todas as reuniões de um `userId`.
- Criar `GetMeetingDetailsUseCase`: Busca uma reunião específica pelo `id`.

### Step 1.3: Rotas da API
- **Arquivo:** `backend/src/interfaces/http/video-upload.router.ts` (ou criar um novo `meeting.router.ts`)
- `POST /api/analyze-video`: Atualizar para receber `userId` no body.
- `GET /api/meetings/user/:userId`: Retorna a lista de reuniões.
- `GET /api/meetings/:id`: Retorna os detalhes de uma reunião.

---

## 2. Frontend (Core & Services)

### Step 2.1: Identificação do Usuário (Mock)
Como o login não está pronto, usaremos um ID persistente no navegador.
- Criar `AuthService` ou `UserIdService`:
  - Ao iniciar, verifica se existe um `uuid` no `localStorage`.
  - Se não existir, gera um novo e salva.
  - Disponibiliza esse `userId` para os outros serviços.

### Step 2.2: Atualização do VideoService
- **Arquivo:** `frontend/src/app/core/services/send-video.service.ts`
- Adicionar `userId` ao `FormData` no método `analyzeVideo`.
- Criar método `getUserMeetings(userId: string): Observable<Meeting[]>`.
- Criar método `getMeetingById(id: string): Observable<Meeting>`.

---

## 3. Frontend (UI & UX)

### Step 3.1: Página de Histórico
- Criar componente `MeetingHistoryComponent`.
- Layout: Tabela ou lista de Cards contendo:
  - Título da reunião.
  - Data de criação.
  - Badge de status (pending/completed/failed).
  - Botão "Ver Detalhes".

### Step 3.2: Página de Detalhes
- Criar componente `MeetingDetailsComponent`.
- Capturar o `id` da URL usando `ActivatedRoute`.
- Exibir os dados da reunião (reaproveitar ou estender o `MeetingResultComponent`).
- Seções: Sumário, Tópicos Principais, Ações/Tarefas e Decisões.

### Step 3.3: Roteamento e Navegação
- **Arquivo:** `frontend/src/app/app.routes.ts`
- Adicionar rotas:
  - `/history`: `MeetingHistoryComponent`
  - `/meeting/:id`: `MeetingDetailsComponent`
- Atualizar o `HeaderComponent` para incluir links de navegação ("Nova Análise" e "Histórico").

---

## 4. Fluxo de Execução Recomendado

1. **Back-end:** Criar um usuário de teste no banco para usar o ID manualmente durante os testes iniciais.
2. **Back-end:** Implementar a persistência no `analyze-video`.
3. **Back-end:** Implementar as rotas de listagem e detalhes.
4. **Front-end:** Implementar o serviço de `userId` e atualizar o upload.
5. **Front-end:** Criar a página de Histórico (listagem).
6. **Front-end:** Criar a página de Detalhes.
