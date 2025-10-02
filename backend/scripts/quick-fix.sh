#!/bin/bash

# Quick fix script для исправления проблем с деплоем
# Использование: ssh deploy@193.233.102.193 'bash -s' < scripts/quick-fix.sh

set -e  # Exit on error

echo "========================================="
echo "Quick Fix для actionable-sentiment-backend"
echo "========================================="
echo ""

# Проверка что мы в правильной директории
cd /home/deploy/actionable-sentiment-backend || {
    echo "❌ ERROR: Directory /home/deploy/actionable-sentiment-backend not found"
    exit 1
}

echo "✅ Working directory: $(pwd)"
echo ""

# 1. Остановка и очистка
echo "--- Step 1: Stopping containers and cleaning up ---"
docker compose down 2>/dev/null || true
docker rm -f sentiment-api 2>/dev/null || true
docker image prune -af
docker network prune -f
echo "✅ Cleanup completed"
echo ""

# 2. Проверка firewall
echo "--- Step 2: Checking firewall ---"
if sudo ufw status | grep -q "8000.*ALLOW"; then
    echo "✅ Port 8000 already allowed in UFW"
else
    echo "⚠️  Port 8000 not in UFW, adding..."
    sudo ufw allow 8000/tcp
    echo "✅ Port 8000 allowed"
fi
echo ""

# 3. Проверка/создание директорий
echo "--- Step 3: Creating directories ---"
mkdir -p database logs
chmod 755 database logs
echo "✅ Directories created"
echo ""

# 4. Проверка .env файла
echo "--- Step 4: Checking .env file ---"
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=sqlite+aiosqlite:///./database/bank_reviews.db
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=["http://193.233.102.193:3000","http://localhost:3000"]
EOF
    chmod 600 .env
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi
echo ""

# 5. Проверка docker-compose.yml
echo "--- Step 5: Checking docker-compose.yml ---"
if [ ! -f docker-compose.yml ]; then
    echo "❌ ERROR: docker-compose.yml not found!"
    echo "Please copy docker-compose.yml to server:"
    echo "scp docker-compose.yml deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/"
    exit 1
fi
echo "✅ docker-compose.yml found"
echo ""

# 6. Установка GITHUB_REPOSITORY
echo "--- Step 6: Setting GITHUB_REPOSITORY ---"
# Попытка определить из docker-compose.yml
REPO_LINE=$(grep "image:" docker-compose.yml | grep "ghcr.io" | head -1)
if [[ $REPO_LINE =~ ghcr\.io/([^/]+/[^/]+)/api ]]; then
    DEFAULT_REPO="${BASH_REMATCH[1]}"
    echo "Found repository from docker-compose.yml: $DEFAULT_REPO"
else
    DEFAULT_REPO="actionable-sentiment-backend/api"
    echo "⚠️  Could not determine repository, using default: $DEFAULT_REPO"
fi

export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-$DEFAULT_REPO}"
echo "✅ GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
echo ""

# 7. Login to GitHub Container Registry
echo "--- Step 7: Logging in to GitHub Container Registry ---"
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  WARNING: GITHUB_TOKEN not set"
    echo "Attempting to use existing Docker credentials..."
else
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
    echo "✅ Logged in to ghcr.io"
fi
echo ""

# 8. Pull образа
echo "--- Step 8: Pulling Docker image ---"
IMAGE_NAME="ghcr.io/$GITHUB_REPOSITORY/api:latest"
echo "Pulling: $IMAGE_NAME"
if docker pull "$IMAGE_NAME"; then
    echo "✅ Image pulled successfully"
else
    echo "❌ ERROR: Failed to pull image"
    echo "Please ensure:"
    echo "1. Image exists at $IMAGE_NAME"
    echo "2. You are logged in to ghcr.io"
    echo "3. You have permissions to pull the image"
    exit 1
fi
echo ""

# 9. Запуск контейнеров
echo "--- Step 9: Starting containers ---"
docker compose up -d
echo "✅ Containers started"
echo ""

# 10. Ожидание и проверка
echo "--- Step 10: Waiting for application to start ---"
sleep 15

# 11. Health check на localhost
echo "--- Step 11: Health check (localhost) ---"
for i in {1..12}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy on localhost"
        RESPONSE=$(curl -s http://localhost:8000/health)
        echo "Response: $RESPONSE"
        break
    else
        echo "⏳ Attempt $i/12: Waiting..."
        if [ $i -eq 12 ]; then
            echo "❌ ERROR: Health check failed on localhost"
            echo "Container logs:"
            docker compose logs --tail=50 api
            exit 1
        fi
        sleep 5
    fi
done
echo ""

# 12. Health check на внешнем IP
echo "--- Step 12: Health check (external IP) ---"
EXTERNAL_IP="193.233.102.193"
if curl -sf "http://$EXTERNAL_IP:8000/health" > /dev/null 2>&1; then
    echo "✅ Application is accessible from external IP"
    RESPONSE=$(curl -s "http://$EXTERNAL_IP:8000/health")
    echo "Response: $RESPONSE"
else
    echo "⚠️  WARNING: Not accessible from external IP"
    echo "Checking network configuration..."

    echo "Port binding:"
    sudo netstat -tulpn | grep 8000 || echo "Port 8000 not found"

    echo "UFW status:"
    sudo ufw status | grep 8000 || echo "Port 8000 not in UFW"

    echo "Container logs:"
    docker compose logs --tail=20 api | grep "Uvicorn running"
fi
echo ""

# 13. Итоговый статус
echo "========================================="
echo "Quick Fix completed!"
echo "========================================="
echo ""
echo "Container status:"
docker compose ps
echo ""
echo "Try accessing:"
echo "- Health: http://$EXTERNAL_IP:8000/health"
echo "- Docs: http://$EXTERNAL_IP:8000/docs"
echo ""
echo "To view logs: docker compose logs -f"
echo "========================================="
