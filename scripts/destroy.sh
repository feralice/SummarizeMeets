#!/bin/bash
# Derruba toda a infraestrutura e limpa os recursos órfãos
# Use após a apresentação para parar de ser cobrado
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS_PROFILE="summeet"
AWS_REGION="us-east-1"

echo ""
echo "=== Destruindo infraestrutura SumMeet ==="
echo ""
echo "⚠️  Isso vai deletar TUDO: EC2, RDS, S3, CloudFront, VPC e secrets."
read -rp "Tem certeza? Digite 'sim' para confirmar: " CONFIRM

[ "$CONFIRM" = "sim" ] || { echo "Cancelado."; exit 0; }

# ── CDK Destroy ───────────────────────────────────────────────
echo ""
echo "▶ Destruindo stacks CDK..."
cd infra
npx cdk destroy --all --force --profile $AWS_PROFILE
cd "$ROOT"

# ── Secrets Manager ───────────────────────────────────────────
echo ""
echo "▶ Deletando secrets (força imediata, sem período de recovery)..."

for SECRET in summeet-app-secrets summeet-rds-credentials; do
  if aws secretsmanager describe-secret \
      --secret-id $SECRET \
      --profile $AWS_PROFILE \
      --region $AWS_REGION > /dev/null 2>&1; then
    aws secretsmanager delete-secret \
      --secret-id $SECRET \
      --force-delete-without-recovery \
      --profile $AWS_PROFILE \
      --region $AWS_REGION
    echo "  ✅ $SECRET deletado"
  else
    echo "  ℹ️  $SECRET não encontrado, pulando"
  fi
done

# ── SSM Parameters ────────────────────────────────────────────
echo ""
echo "▶ Deletando SSM parameters..."

aws ssm delete-parameters \
  --profile $AWS_PROFILE \
  --region $AWS_REGION \
  --names \
    /summeet/s3/recordings-bucket \
    /summeet/s3/frontend-bucket \
    /summeet/cloudfront/url \
    /summeet/rds/endpoint \
    /summeet/rds/secret-arn \
  > /dev/null 2>&1 && echo "  ✅ Parameters deletados" || echo "  ℹ️  Alguns parameters não encontrados"

# ── KeyPair ───────────────────────────────────────────────────
echo ""
echo "▶ Deletando KeyPair..."

aws ec2 delete-key-pair \
  --key-name summeet-key-pair \
  --profile $AWS_PROFILE \
  --region $AWS_REGION > /dev/null 2>&1 && echo "  ✅ KeyPair deletado" || echo "  ℹ️  KeyPair não encontrado"

rm -f summeet-key.pem
rm -f infra/cdk-outputs.json

# ── Resultado ────────────────────────────────────────────────
echo ""
echo "✅ Infraestrutura completamente removida."
echo "   Nenhum recurso AWS ativo. Cobrança encerrada."
