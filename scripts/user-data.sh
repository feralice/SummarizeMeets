#!/bin/bash
set -e

# Atualizar pacotes
yum update -y

# Instalar Node.js 24 LTS (Krypton — LTS atual em 2026)
curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
yum install -y nodejs

# Instalar nginx
yum install -y nginx

# Instalar pm2 globalmente
npm install -g pm2

# Criar diretório da aplicação
mkdir -p /home/ec2-user/summeet
chown ec2-user:ec2-user /home/ec2-user/summeet

# Configurar nginx como reverse proxy
cat > /etc/nginx/conf.d/summeet.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 500m;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX

# Habilitar e iniciar nginx
systemctl enable nginx
systemctl start nginx

# Configurar pm2 para iniciar com o sistema
su - ec2-user -c "pm2 startup systemd -u ec2-user --hp /home/ec2-user" | tail -1 | bash

echo "Setup concluído!"
