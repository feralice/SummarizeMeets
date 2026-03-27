# Scripts de Deploy — SumMeet

Scripts para gerenciar o ciclo de vida da infraestrutura e deploy da aplicação.

> **Pré-requisito:** AWS CLI configurado com o perfil `summeet`
> ```bash
> aws configure --profile summeet
> # Access Key, Secret Key, região: us-east-1, output: json
> ```

---

## Fluxo completo (primeiro deploy)

```
1. cdk deploy --all      ← você faz, acompanha o terminal
2. ./scripts/setup.sh          ← roda uma vez só
3. ./scripts/deploy-backend.sh
4. ./scripts/deploy-frontend.sh
```

---

## Scripts

### `setup.sh`
**Quando usar:** uma única vez, logo após o `cdk deploy --all`.

Faz duas coisas:
- Baixa a chave SSH da EC2 do SSM e salva como `summeet-key.pem` na raiz
- Pergunta sua `GEMINI_API_KEY` e `JWT_SECRET` e salva no Secrets Manager

```bash
./scripts/setup.sh
```

---

### `deploy-backend.sh`
**Quando usar:** sempre que atualizar código no `backend/`.

O que faz, em ordem:
1. Copia o código para a EC2 via `rsync` (exclui `node_modules`, `dist`, `.env`)
2. Entra na EC2 via SSH e executa:
   - `npm install`
   - `npm run compile` (TypeScript → dist/)
   - `npx prisma generate`
   - `npx prisma migrate deploy`
   - Reinicia o processo com PM2

```bash
./scripts/deploy-backend.sh
```

---

### `deploy-frontend.sh`
**Quando usar:** sempre que atualizar código no `frontend/`.

O que faz, em ordem:
1. Lê a URL do CloudFront do `cdk-outputs.json`
2. Substitui `http://localhost:3000` pela URL do CloudFront nos services Angular
3. Faz `npm run build --configuration production`
4. Reverte a URL de volta para `localhost` (para não commitar alterado)
5. Faz sync dos arquivos para o bucket S3
6. Invalida o cache do CloudFront

```bash
./scripts/deploy-frontend.sh
```

---

### `sg-access.sh`
**Quando usar:** para liberar ou revogar acesso SSH à EC2.

Como cada pessoa do time tem IP diferente (e IPs mudam), este script adiciona/remove seu IP atual do Security Group sem precisar alterar o CDK.

```bash
./scripts/sg-access.sh add     # libera seu IP atual para SSH
./scripts/sg-access.sh remove  # revoga seu IP (faça ao terminar)
./scripts/sg-access.sh list    # lista todos os IPs com acesso
./scripts/sg-access.sh ssh     # adiciona IP e abre SSH na EC2 (atalho)
```

> Cada membro do time deve ter o perfil `summeet` configurado e rodar `add` com suas próprias credenciais.

---

### `destroy.sh`
**Quando usar:** ao terminar a apresentação, para parar de ser cobrado.

O que deleta:
- Stacks CDK: EC2, RDS, VPC, S3, CloudFront (`cdk destroy --all`)
- Secrets Manager: `summeet-app-secrets` e `summeet-rds-credentials` (imediato, sem os 7 dias de recovery)
- SSM Parameters: todos os `/summeet/*`
- KeyPair da EC2
- Arquivos locais: `summeet-key.pem` e `infra/cdk-outputs.json`

```bash
./scripts/destroy.sh
```

> Pede confirmação antes de executar.

---

## Atualizações rápidas

```bash
# Só o backend mudou
./scripts/deploy-backend.sh

# Só o frontend mudou
./scripts/deploy-frontend.sh

# Ambos mudaram
./scripts/deploy-backend.sh && ./scripts/deploy-frontend.sh
```

---

## Estrutura dos scripts

Todos os scripts resolvem o caminho automaticamente para a raiz do projeto. Podem ser chamados de qualquer diretório:

```bash
# Qualquer um desses funciona:
./scripts/setup.sh
bash scripts/setup.sh
cd scripts && ./setup.sh
```
