#!/bin/bash
# Deploy do frontend para o S3 / CloudFront
# Use sempre que atualizar o código do frontend
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS_PROFILE="summeet"
AWS_REGION="us-east-1"

[ -f "infra/cdk-outputs.json" ] || { echo "ERRO: infra/cdk-outputs.json não encontrado. Rode o cdk deploy primeiro."; exit 1; }

CF_URL=$(jq -r '.SumMeetApp.CloudFrontUrl' infra/cdk-outputs.json)
BUCKET=$(aws ssm get-parameter \
  --profile $AWS_PROFILE --region $AWS_REGION \
  --name "/summeet/s3/frontend-bucket" \
  --query Parameter.Value --output text)

echo ""
echo "=== Deploy Frontend ==="
echo "  CloudFront: $CF_URL"
echo "  Bucket:     $BUCKET"

# ── Substituir URL da API ─────────────────────────────────────
echo ""
echo "▶ Apontando API para CloudFront..."
find frontend/src -name "*.ts" -exec \
  sed -i "s|http://localhost:3000|${CF_URL}|g" {} \;

# ── Build ────────────────────────────────────────────────────
echo ""
echo "▶ Build de produção..."
cd frontend
npm run build -- --configuration production
cd ..

# ── Reverter URL local ────────────────────────────────────────
echo ""
echo "▶ Revertendo URL local (para não commitar alterado)..."
find frontend/src -name "*.ts" -exec \
  sed -i "s|${CF_URL}|http://localhost:3000|g" {} \;

# ── Subir para S3 ────────────────────────────────────────────
echo ""
echo "▶ Subindo para S3..."
aws s3 sync frontend/dist/frontend/browser/ "s3://${BUCKET}/" \
  --profile $AWS_PROFILE --delete

# ── Invalidar cache CloudFront ────────────────────────────────
echo ""
echo "▶ Invalidando cache do CloudFront..."
DIST_ID=$(aws cloudfront list-distributions \
  --profile $AWS_PROFILE \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='${BUCKET}.s3.amazonaws.com'].Id | [0]" \
  --output text)

if [ -n "$DIST_ID" ] && [ "$DIST_ID" != "None" ]; then
  aws cloudfront create-invalidation \
    --profile $AWS_PROFILE \
    --distribution-id "$DIST_ID" \
    --paths "/*" > /dev/null
  echo "  Cache invalidado."
fi

echo ""
echo "✅ Frontend no ar: $CF_URL"
