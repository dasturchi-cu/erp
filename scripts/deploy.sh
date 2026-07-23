#!/bin/bash
# ERP Avtomatik Deploy Skripti (Linux Server uchun)
set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # Rang yo'q

echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}       ERP Avtomatik Server Deploy Tizimi          ${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

# 1. Root huquqini tekshirish
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Xatolik: Ushbu skriptni root (sudo) huquqi bilan ishga tushiring!${NC}"
  exit 1
fi

# 2. Asosiy dasturlarni yangilash va o'rnatish
echo -e "${YELLOW}[1/6] Tizim yangilanmoqda va zarur paketlar o'rnatilmoqda...${NC}"
apt-get update && apt-get install -y curl git nginx certbot python3-certbot-nginx

# 3. Docker va Docker Compose o'rnatish
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker topilmadi. O'rnatilmoqda...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}Docker muvaffaqiyatli o'rnatildi.${NC}"
else
    echo -e "${GREEN}Docker allaqachon o'rnatilgan.${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Xatolik: Docker Compose v2 o'rnatilmagan! Uni o'rnating.${NC}"
    exit 1
fi

# 4. Loyiha papkasini aniqlash va o'tish
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Env faylini sozlash
echo -e "${YELLOW}[2/6] Konfiguratsiyani sozlash (.env)...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    # Maxfiy kalitlarni o'zgartirish
    SEC1=$(openssl rand -hex 16)
    SEC2=$(openssl rand -hex 16)
    sed -i "s/change-me-access-secret-min-32-chars-long/$SEC1/g" backend/.env
    sed -i "s/change-me-refresh-secret-min-32-chars-long/$SEC2/g" backend/.env
fi

# 5. Docker Compose-ni ishga tushirish (Build va Run)
echo -e "${YELLOW}[3/6] Docker konteynerlari yig'ilmoqda va ishga tushirilmoqda...${NC}"
docker compose -f docker-compose.prod.yml up --build -d

# 6. Prisma migratsiyalarini bajarish
echo -e "${YELLOW}[4/6] Ma'lumotlar bazasi migratsiyalari ishga tushirilmoqda...${NC}"
echo "Konteynerlar to'liq ishlashini 10 soniya kutamiz..."
sleep 10

docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy || true
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed || true

# 7. Nginx Reverse Proxy Sozlash
echo -e "${YELLOW}[5/6] Nginx reverse proxy sozlanmoqda...${NC}"

# Domen so'rash
echo -e "${CYAN}ERP dasturi uchun domenni kiriting (masalan: app.sizning-erpingiz.uz):${NC}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domen kiritilmadi! Nginx sozlash o'tkazib yuborildi.${NC}"
else
    NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
    
    cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:80; # Docker frontend porti
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/"
    rm -f /etc/nginx/sites-enabled/default || true
    nginx -t
    systemctl restart nginx
    echo -e "${GREEN}Nginx muvaffaqiyatli sozlandi.${NC}"
    
    # SSL olish
    echo -e "${YELLOW}[6/6] Let's Encrypt yordamida SSL sertifikati (HTTPS) olinmoqda...${NC}"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
    echo -e "${GREEN}SSL sertifikati muvaffaqiyatli o'rnatildi va HTTPS yoqildi!${NC}"
fi

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}   ERP Tizimi muvaffaqiyatli serverga o'rnatildi! ${NC}"
if [ -n "$DOMAIN" ]; then
    echo -e "${GREEN}   Dastur manzili: https://$DOMAIN${NC}"
fi
echo -e "${GREEN}   Login: admin@erp.uz  /  Parol: Admin123!      ${NC}"
echo -e "${GREEN}==================================================${NC}"
