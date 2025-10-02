#!/bin/bash

###############################################################################
# Скрипт первичной настройки STAGING сервера (89.23.99.74)
#
# Запустите этот скрипт НА STAGING СЕРВЕРЕ с правами root или sudo
#
# Что делает скрипт:
# 1. Устанавливает Docker и Docker Compose
# 2. Создает пользователя deploy с sudo правами
# 3. Настраивает SSH ключи для deploy пользователя
# 4. Создает структуру директорий проекта
# 5. Настраивает firewall (UFW)
# 6. Создает базовый .env файл для staging
###############################################################################

set -e  # Остановка при ошибке

echo "========================================="
echo "🚀 STAGING Server Setup Script"
echo "Server: 89.23.99.74"
echo "========================================="

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Переменные
DEPLOY_USER="deploy"
PROJECT_DIR="/home/${DEPLOY_USER}/actionable-sentiment-backend"
STAGING_IP="89.23.99.74"

# Проверка что скрипт запущен с правами root или sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
   exit 1
fi

echo -e "${YELLOW}📦 Step 1: Installing Docker and Docker Compose${NC}"

# Обновление пакетов
apt-get update

# Установка зависимостей
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление Docker GPG ключа
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавление Docker репозитория
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверка установки
docker --version
docker compose version

echo -e "${GREEN}✅ Docker installed successfully${NC}"

echo -e "${YELLOW}👤 Step 2: Creating deploy user${NC}"

# Создание пользователя deploy если не существует
if id "$DEPLOY_USER" &>/dev/null; then
    echo -e "${YELLOW}⚠️  User $DEPLOY_USER already exists${NC}"
else
    useradd -m -s /bin/bash $DEPLOY_USER
    echo -e "${GREEN}✅ User $DEPLOY_USER created${NC}"
fi

# Добавление deploy в группу docker
usermod -aG docker $DEPLOY_USER

# Добавление deploy в sudoers (для управления firewall и системных команд)
if ! grep -q "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/ufw" /etc/sudoers.d/$DEPLOY_USER 2>/dev/null; then
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/ufw, /usr/bin/systemctl" > /etc/sudoers.d/$DEPLOY_USER
    chmod 440 /etc/sudoers.d/$DEPLOY_USER
    echo -e "${GREEN}✅ Sudo privileges configured for $DEPLOY_USER${NC}"
fi

echo -e "${YELLOW}🔑 Step 3: Setting up SSH for deploy user${NC}"

# Создание .ssh директории
mkdir -p /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh

# Создание файла authorized_keys если не существует
touch /home/$DEPLOY_USER/.ssh/authorized_keys
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

# Установка владельца
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh

echo -e "${GREEN}✅ SSH directory created${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Add your GitHub Actions public SSH key to:${NC}"
echo -e "${YELLOW}   /home/$DEPLOY_USER/.ssh/authorized_keys${NC}"
echo ""
echo -e "Generate SSH key pair on your local machine:"
echo -e "  ${YELLOW}ssh-keygen -t ed25519 -C \"github-actions-staging\" -f ~/.ssh/github_staging${NC}"
echo -e "Then add PUBLIC key to authorized_keys:"
echo -e "  ${YELLOW}cat ~/.ssh/github_staging.pub | ssh root@$STAGING_IP 'cat >> /home/$DEPLOY_USER/.ssh/authorized_keys'${NC}"
echo -e "And add PRIVATE key to GitHub Secrets as ${YELLOW}STAGING_SSH_KEY${NC}"
echo ""

echo -e "${YELLOW}📁 Step 4: Creating project directories${NC}"

# Создание директорий проекта
mkdir -p $PROJECT_DIR/{database,logs}
chown -R $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR

# Установка прав доступа (важно для SQLite WAL mode)
chmod 777 $PROJECT_DIR/database
chmod 755 $PROJECT_DIR/logs

echo -e "${GREEN}✅ Project directories created at $PROJECT_DIR${NC}"

echo -e "${YELLOW}📝 Step 5: Creating .env file for STAGING${NC}"

# Создание .env файла
cat > $PROJECT_DIR/.env << 'EOF'
DATABASE_URL=sqlite+aiosqlite:///./database/bank_reviews.db
ENVIRONMENT=staging
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://89.23.99.74:3000","http://localhost:3000"]
EOF

chown $DEPLOY_USER:$DEPLOY_USER $PROJECT_DIR/.env
chmod 600 $PROJECT_DIR/.env

echo -e "${GREEN}✅ .env file created${NC}"

echo -e "${YELLOW}🔥 Step 6: Configuring firewall (UFW)${NC}"

# Установка UFW если не установлен
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

# Базовая конфигурация UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Разрешение SSH (важно!)
ufw allow 22/tcp

# Разрешение порта приложения
ufw allow 8000/tcp

# Опционально: порт для фронтенда
ufw allow 3000/tcp

# Применение правил
ufw reload

echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""
ufw status

echo -e "${YELLOW}🐳 Step 7: Testing Docker for deploy user${NC}"

# Тестирование docker от имени deploy
sudo -u $DEPLOY_USER docker ps || echo -e "${YELLOW}⚠️  Deploy user needs to re-login for docker group to take effect${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}✅ STAGING Server Setup Complete!${NC}"
echo "========================================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Setup SSH keys for GitHub Actions:"
echo "   - Generate: ssh-keygen -t ed25519 -C 'github-actions-staging' -f ~/.ssh/github_staging"
echo "   - Add public key to: /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "   - Add private key to GitHub Secret: STAGING_SSH_KEY"
echo ""
echo "2. Add GitHub Secrets to your repository:"
echo "   STAGING_HOST = $STAGING_IP"
echo "   STAGING_USER = $DEPLOY_USER"
echo "   STAGING_SSH_KEY = (private key content)"
echo "   STAGING_PATH = $PROJECT_DIR"
echo ""
echo "3. Copy database file (if needed):"
echo "   scp database/bank_reviews.db $DEPLOY_USER@$STAGING_IP:$PROJECT_DIR/database/"
echo ""
echo "4. Login to GitHub Container Registry as deploy user:"
echo "   su - $DEPLOY_USER"
echo "   echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
echo ""
echo "5. Test SSH connection from your machine:"
echo "   ssh -i ~/.ssh/github_staging $DEPLOY_USER@$STAGING_IP"
echo ""
echo "🚀 Ready for CI/CD deployment!"
echo "========================================="
