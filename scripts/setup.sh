#!/bin/bash
# Roda UMA VEZ após o cdk deploy --all
# Salva a chave SSH e preenche os secrets da aplicação
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS_PROFILE="summeet"
AWS_REGION="us-east-1"
KEY_FILE="summeet-key.pem"

echo ""
echo "=== Setup pós-CDK ==="

# ── Chave SSH ────────────────────────────────────────────────
echo ""
echo "▶ Salvando chave SSH da EC2..."

KEY_PAIR_ID=$(aws ec2 describe-key-pairs \
  --profile $AWS_PROFILE --region $AWS_REGION \
  --filters "Name=key-name,Values=summeet-key-pair" \
  --query "KeyPairs[0].KeyPairId" --output text)

aws ssm get-parameter \
  --profile $AWS_PROFILE --region $AWS_REGION \
  --name "/ec2/keypair/${KEY_PAIR_ID}" \
  --with-decryption \
  --query Parameter.Value \
  --output text > "$KEY_FILE"

chmod 400 "$KEY_FILE"
echo "  ✅ Chave salva em $KEY_FILE"

# ── Secrets ──────────────────────────────────────────────────
echo ""
echo "▶ Preenchendo secrets da aplicação..."
echo ""

read -rp "  GEMINI_API_KEY: " GEMINI_KEY
read -rp "  JWT_SECRET (enter para gerar automaticamente): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "  JWT_SECRET gerado: $JWT_SECRET"
fi

aws secretsmanager put-secret-value \
  --profile $AWS_PROFILE --region $AWS_REGION \
  --secret-id summeet-app-secrets \
  --secret-string "{\"GEMINI_API_KEY\":\"${GEMINI_KEY}\",\"JWT_SECRET\":\"${JWT_SECRET}\",\"dummy\":\"ignored\"}"

echo "  ✅ Secrets salvos no Secrets Manager"

# ── Resultado ────────────────────────────────────────────────
EC2_IP=$(jq -r '.SumMeetApp.Ec2PublicIp' infra/cdk-outputs.json)
CF_URL=$(jq -r '.SumMeetApp.CloudFrontUrl' infra/cdk-outputs.json)

echo ""
echo "=== Pronto! ==="
echo "  EC2:        $EC2_IP"
echo "  CloudFront: $CF_URL"
echo "  SSH:        ssh -i $KEY_FILE ec2-user@${EC2_IP}"
echo ""
echo "Próximos passos:"
echo "  ./scripts/deploy-backend.sh"
echo "  ./scripts/deploy-frontend.sh"
