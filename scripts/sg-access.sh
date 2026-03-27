#!/bin/bash
# Gerencia acesso SSH ao Security Group da EC2
#
# Uso:
#   ./sg-access.sh add     — adiciona seu IP atual ao SG (libera SSH)
#   ./sg-access.sh remove  — remove seu IP atual do SG
#   ./sg-access.sh list    — lista os IPs com acesso SSH liberado
#   ./sg-access.sh ssh     — abre SSH direto na EC2 (adiciona IP se necessário)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AWS_PROFILE="summeet"
AWS_REGION="us-east-1"
SG_NAME="summeet-vpc-dev-ec2-sg"
KEY_FILE="summeet-key.pem"

# ── Helpers ───────────────────────────────────────────────────
die() { echo "ERRO: $1"; exit 1; }

get_my_ip() {
  curl -s ifconfig.me
}

get_sg_id() {
  aws ec2 describe-security-groups \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --filters "Name=group-name,Values=${SG_NAME}" \
    --query "SecurityGroups[0].GroupId" \
    --output text
}

get_ec2_ip() {
  [ -f "infra/cdk-outputs.json" ] || die "infra/cdk-outputs.json não encontrado."
  jq -r '.SumMeetApp.Ec2PublicIp' infra/cdk-outputs.json
}

# ── Adicionar IP ──────────────────────────────────────────────
add_ip() {
  MY_IP=$(get_my_ip)
  SG_ID=$(get_sg_id)

  echo ""
  echo "▶ Adicionando ${MY_IP}/32 ao Security Group..."
  echo "  SG: $SG_ID"

  # Verifica se a regra já existe
  EXISTING=$(aws ec2 describe-security-groups \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --group-ids "$SG_ID" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\`].IpRanges[?CidrIp=='${MY_IP}/32'].CidrIp" \
    --output text)

  if [ -n "$EXISTING" ]; then
    echo "  ℹ️  ${MY_IP}/32 já tem acesso SSH. Nada a fazer."
    return
  fi

  aws ec2 authorize-security-group-ingress \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr "${MY_IP}/32"

  echo "  ✅ SSH liberado para ${MY_IP}"
}

# ── Remover IP ────────────────────────────────────────────────
remove_ip() {
  MY_IP=$(get_my_ip)
  SG_ID=$(get_sg_id)

  echo ""
  echo "▶ Removendo ${MY_IP}/32 do Security Group..."

  EXISTING=$(aws ec2 describe-security-groups \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --group-ids "$SG_ID" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\`].IpRanges[?CidrIp=='${MY_IP}/32'].CidrIp" \
    --output text)

  if [ -z "$EXISTING" ]; then
    echo "  ℹ️  ${MY_IP}/32 não está na lista. Nada a fazer."
    return
  fi

  aws ec2 revoke-security-group-ingress \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr "${MY_IP}/32"

  echo "  ✅ Acesso SSH de ${MY_IP} removido."
}

# ── Listar IPs ────────────────────────────────────────────────
list_ips() {
  SG_ID=$(get_sg_id)

  echo ""
  echo "▶ IPs com acesso SSH liberado:"
  aws ec2 describe-security-groups \
    --profile $AWS_PROFILE --region $AWS_REGION \
    --group-ids "$SG_ID" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\`].IpRanges[].{IP:CidrIp,Descricao:Description}" \
    --output table
}

# ── SSH direto ────────────────────────────────────────────────
open_ssh() {
  [ -f "$KEY_FILE" ] || die "$KEY_FILE não encontrado. Rode ./setup.sh primeiro."

  add_ip

  EC2_IP=$(get_ec2_ip)
  echo ""
  echo "▶ Conectando em ec2-user@${EC2_IP}..."
  echo ""
  ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "ec2-user@${EC2_IP}"
}

# ── Entrypoint ────────────────────────────────────────────────
case "${1:-add}" in
  add)    add_ip ;;
  remove) remove_ip ;;
  list)   list_ips ;;
  ssh)    open_ssh ;;
  *)
    echo ""
    echo "Uso: ./sg-access.sh [add|remove|list|ssh]"
    echo ""
    echo "  add    — adiciona seu IP atual (libera SSH)"
    echo "  remove — remove seu IP atual"
    echo "  list   — lista todos os IPs com SSH liberado"
    echo "  ssh    — adiciona IP e abre SSH na EC2"
    echo ""
    ;;
esac
