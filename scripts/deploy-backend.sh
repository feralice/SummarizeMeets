#!/bin/bash
# Deploy do backend na EC2
# Use sempre que atualizar o código do backend
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS_PROFILE="summeet"
KEY_FILE="summeet-key.pem"
EC2_IP="44.206.85.231"

[ -f "$KEY_FILE" ] || { echo "ERRO: $KEY_FILE não encontrado."; exit 1; }

echo ""
echo "=== Deploy Backend → $EC2_IP ==="

# ── Enviar código ────────────────────────────────────────────
echo ""
echo "▶ Enviando código para a EC2..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '*.log' \
  -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" \
  backend/ "ec2-user@${EC2_IP}:/home/ec2-user/summeet/backend/"

# ── Instalar, compilar, migrar e iniciar ────────────────────
echo ""
echo "▶ Instalando, compilando e iniciando..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "ec2-user@${EC2_IP}" << 'REMOTE'
  set -e
  cd /home/ec2-user/summeet/backend

  echo "→ npm install..."
  npm install --silent

  echo "→ Buscando DATABASE_URL do Secrets Manager..."
  export DATABASE_URL=$(aws secretsmanager get-secret-value \
    --secret-id summeet-rds-credentials \
    --region us-east-1 \
    --query SecretString \
    --output text | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f\"postgresql://{d['username']}:{d['password']}@{d['host']}:{d['port']}/{d['dbname']}?schema=public&sslmode=no-verify\")
")

  echo "→ Gerando Prisma client..."
  npx prisma generate

  echo "→ Compilando TypeScript..."
  npm run compile

  echo "→ Rodando migrations..."
  npx prisma migrate deploy
  unset DATABASE_URL

  echo "→ Reiniciando com PM2..."
  pm2 describe summeet-backend > /dev/null 2>&1 \
    && pm2 restart summeet-backend \
    || pm2 start npm --name summeet-backend -- start

  pm2 save
  pm2 status
REMOTE

echo ""
echo "✅ Backend no ar!"
