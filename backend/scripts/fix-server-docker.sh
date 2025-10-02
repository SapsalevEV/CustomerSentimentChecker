#!/bin/bash

set -e  # Exit on error

echo "========================================="
echo "Исправление Docker на сервере"
echo "Дата: $(date)"
echo "========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Определяем переменные
GITHUB_USER="esapsalev"
GITHUB_REPO="actionable-sentiment"
DEPLOY_PATH="/home/deploy/actionable-sentiment-backend"

echo -e "\n${YELLOW}--- 1. Проверка версии Docker ---${NC}"
docker --version
docker compose version 2>/dev/null || echo "⚠️  Docker Compose V2 не найден через 'docker compose'"

echo -e "\n${YELLOW}--- 2. Установка GITHUB_REPOSITORY в .env ---${NC}"
cd "$DEPLOY_PATH"

# Создаем или обновляем переменную в .env
if grep -q "^GITHUB_REPOSITORY=" .env 2>/dev/null; then
    echo "Обновляем существующую переменную GITHUB_REPOSITORY..."
    sed -i "s|^GITHUB_REPOSITORY=.*|GITHUB_REPOSITORY=${GITHUB_USER}/${GITHUB_REPO}|" .env
else
    echo "Добавляем переменную GITHUB_REPOSITORY..."
    echo "GITHUB_REPOSITORY=${GITHUB_USER}/${GITHUB_REPO}" >> .env
fi

echo -e "${GREEN}✅ GITHUB_REPOSITORY установлена${NC}"
echo "Содержимое .env:"
cat .env

echo -e "\n${YELLOW}--- 3. Обновление docker-compose.yml ---${NC}"
# Проверяем содержимое docker-compose.yml
if [ -f docker-compose.yml ]; then
    echo "Содержимое docker-compose.yml:"
    cat docker-compose.yml

    # Если используется старый формат с переменной, обновляем
    if grep -q "GITHUB_REPOSITORY" docker-compose.yml; then
        echo -e "${YELLOW}⚠️  Обнаружена переменная GITHUB_REPOSITORY в docker-compose.yml${NC}"
        echo "Заменяем на прямую ссылку на образ..."

        # Создаем резервную копию
        cp docker-compose.yml docker-compose.yml.backup

        # Заменяем переменную на прямое значение
        sed -i "s|ghcr.io/\${GITHUB_REPOSITORY:-.*}/api:latest|ghcr.io/${GITHUB_USER}/${GITHUB_REPO}/api:latest|" docker-compose.yml

        echo -e "${GREEN}✅ docker-compose.yml обновлен${NC}"
        echo "Новое содержимое:"
        grep "image:" docker-compose.yml
    fi
else
    echo -e "${RED}❌ docker-compose.yml не найден!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}--- 4. Остановка старых контейнеров ---${NC}"
# Используем docker compose (V2 синтаксис)
docker compose down 2>/dev/null || docker compose down 2>/dev/null || echo "Контейнеры уже остановлены"

echo -e "\n${YELLOW}--- 5. Загрузка образа из GitHub Registry ---${NC}"
IMAGE_NAME="ghcr.io/${GITHUB_USER}/${GITHUB_REPO}/api:latest"
echo "Образ: $IMAGE_NAME"

# Пробуем загрузить образ (может потребоваться авторизация)
if docker pull "$IMAGE_NAME"; then
    echo -e "${GREEN}✅ Образ успешно загружен${NC}"
else
    echo -e "${RED}❌ Не удалось загрузить образ${NC}"
    echo "Возможные причины:"
    echo "1. Образ приватный и требуется авторизация: docker login ghcr.io"
    echo "2. Образ не существует по указанному пути"
    echo "3. Проблемы с сетью"

    echo -e "\n${YELLOW}Проверяем доступные образы локально:${NC}"
    docker images | grep -E "sentiment|actionable"

    read -p "Продолжить попытку запуска с локальным образом? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "\n${YELLOW}--- 6. Запуск контейнеров ---${NC}"
# Пробуем docker compose (V2), затем docker compose (V1)
if command -v docker compose &> /dev/null; then
    echo "Используем Docker Compose V2..."
    docker compose up -d
elif command -v docker compose &> /dev/null; then
    echo "Используем Docker Compose V1..."
    docker compose up -d
else
    echo -e "${RED}❌ Docker Compose не найден!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}--- 7. Проверка статуса контейнеров ---${NC}"
sleep 5
docker compose ps 2>/dev/null || docker compose ps 2>/dev/null

echo -e "\n${YELLOW}--- 8. Проверка логов (последние 30 строк) ---${NC}"
docker compose logs --tail=30 api 2>/dev/null || docker compose logs --tail=30 api 2>/dev/null

echo -e "\n${YELLOW}--- 9. Health check ---${NC}"
echo "Ожидание запуска приложения (10 секунд)..."
sleep 10

if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check успешен!${NC}"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo -e "${RED}❌ Health check не прошел${NC}"
    echo "Проверяем логи контейнера:"
    docker compose logs --tail=50 api 2>/dev/null || docker compose logs --tail=50 api 2>/dev/null
fi

echo -e "\n${YELLOW}--- 10. Проверка порта 8000 ---${NC}"
if netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo -e "${GREEN}✅ Порт 8000 слушается${NC}"
    netstat -tuln | grep ":8000 "
elif ss -tuln 2>/dev/null | grep -q ":8000 "; then
    echo -e "${GREEN}✅ Порт 8000 слушается${NC}"
    ss -tuln | grep ":8000 "
else
    echo -e "${RED}❌ Порт 8000 не слушается${NC}"
fi

echo -e "\n========================================="
echo "Диагностика завершена"
echo "========================================="
