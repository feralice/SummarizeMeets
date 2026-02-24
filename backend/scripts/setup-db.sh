#!/bin/bash

# Este script aguarda o banco de dados PostgreSQL estar pronto,
# executa as migrações do Prisma e o seed de dados iniciais.

# Carrega variáveis de ambiente se o arquivo .env existir
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Extrair host e porta da DATABASE_URL se possível, caso contrário usar padrão
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}

echo "--- Iniciando Setup do Banco de Dados ---"

# Verifica se o container está de pé (simples check de porta)
echo "Aguardando banco de dados na porta $DB_PORT..."
until nc -z $DB_HOST $DB_PORT; do
  echo "Banco não disponível em $DB_HOST:$DB_PORT - aguardando..."
  sleep 2
done

echo "Banco detectado! Rodando Prisma Generate..."
npx prisma generate

echo "Executando migrações do Prisma..."
npx prisma migrate dev --name init

echo "Executando Seed de dados iniciais..."
npx ts-node prisma/seeds/seed.ts

echo "--- Setup concluído com sucesso! ---"
