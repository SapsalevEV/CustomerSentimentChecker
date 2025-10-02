#!/bin/bash

# Исправление пути к Docker образу на сервере
# Использование: ssh deploy@193.233.102.193 'bash -s' < scripts/fix-docker-image-path.sh

set -e  # Остановка при ошибке

echo "========================================="
echo "Исправление конфигурации Docker"
echo "Дата: $(date)"
echo "========================================="
echo ""

# Переход в директорию проекта
cd /home/deploy/actionable-sentiment-backend || {
    echo "❌ ОШИБКА: Директория не найдена!"
    exit 1
}

echo "✅ Рабочая директория: $(pwd)"
echo ""

# Правильный путь к образу бэкенда (явно указан, не зависит от переменных)
IMAGE_PATH="ghcr.io/sapsalevev/actionable-sentiment-backend/api:latest"

echo "--- 1. Проверка .env файла ---"
if [ -f .env ]; then
    echo "✅ .env найден"
    echo "Содержимое .env:"
    cat .env
else
    echo "⚠️  .env не найден, создаём..."
    cat > .env << EOF
DATABASE_URL=sqlite+aiosqlite:///./database/bank_reviews.db
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=["http://193.233.102.193:3000"]
EOF
    echo "✅ .env создан"
fi
echo ""

echo "ℹ️  ПРИМЕЧАНИЕ: docker-compose.yml теперь использует явный путь к образу"
echo "   Образ бэкенда: ${IMAGE_PATH}"
echo "   Переменная GITHUB_REPOSITORY больше не влияет на бэкенд"
echo ""

echo "--- 2. Остановка старых контейнеров ---"
docker compose down || true
echo "✅ Контейнеры остановлены"
echo ""

echo "--- 3. Обновление docker-compose.yml ---"
echo "ℹ️  Копирование актуального docker-compose.yml будет выполнено через GitHub Actions"
echo "   Или вы можете скопировать вручную: scp docker-compose.yml deploy@193.233.102.193:..."
echo ""

echo "--- 4. Проверка доступности образа в ghcr.io ---"
if docker manifest inspect ${IMAGE_PATH} > /dev/null 2>&1; then
    echo "✅ Образ ${IMAGE_PATH} доступен"
    USE_REMOTE=true
else
    echo "⚠️  Образ ${IMAGE_PATH} недоступен (возможно приватный или не существует)"
    echo "Будем использовать локальную сборку"
    USE_REMOTE=false
fi
echo ""

if [ "$USE_REMOTE" = true ]; then
    echo "--- 5. Загрузка образа из ghcr.io ---"
    echo "Образ: ${IMAGE_PATH}"

    if docker pull ${IMAGE_PATH}; then
        echo "✅ Образ загружен успешно"
    else
        echo "❌ Не удалось загрузить образ"
        echo ""
        echo "Переключаемся на локальную сборку..."
        echo "--- 5b. Локальная сборка образа ---"
        if docker compose build; then
            echo "✅ Образ собран успешно"
        else
            echo "❌ Ошибка при сборке образа"
            exit 1
        fi
    fi
else
    echo "--- 5. Локальная сборка образа ---"
    echo "Собираем образ из Dockerfile..."

    if docker compose build; then
        echo "✅ Образ собран успешно"
    else
        echo "❌ Ошибка при сборке образа"
        exit 1
    fi
fi
echo ""

echo "--- 6. Исправление прав на директорию database ---"
echo "Установка прав для SQLite WAL режима..."
chmod -R 777 database/ 2>/dev/null || true
chmod -R 755 logs/ 2>/dev/null || true
echo "✅ Права установлены"
echo ""

echo "--- 7. Запуск контейнеров ---"
docker compose up -d
echo "✅ Контейнеры запущены"
echo ""

echo "--- 8. Проверка статуса ---"
docker compose ps
echo ""

echo "--- 9. Ожидание запуска приложения (30 сек) ---"
sleep 30

echo "--- 10. Health check ---"
if curl -f http://localhost:8000/health 2>/dev/null; then
    echo "✅ Приложение работает!"
    curl -s http://localhost:8000/health | python3 -m json.tool || curl -s http://localhost:8000/health
else
    echo "❌ Health check не прошёл"
    echo "Логи контейнера:"
    docker compose logs --tail=50 api
    exit 1
fi
echo ""

echo "--- 11. Проверка доступности снаружи ---"
if curl -f http://193.233.102.193:8000/health 2>/dev/null; then
    echo "✅ Приложение доступно по внешнему IP!"
else
    echo "⚠️  Приложение недоступно по внешнему IP"
    echo "Проверьте firewall: sudo ufw allow 8000/tcp"
fi
echo ""

echo "========================================="
echo "✅ Настройка завершена!"
echo "========================================="
echo ""
echo "Приложение доступно:"
echo "  - Health: http://193.233.102.193:8000/health"
echo "  - API Docs: http://193.233.102.193:8000/docs"
echo ""
echo "Полезные команды:"
echo "  - Логи: docker compose logs -f api"
echo "  - Статус: docker compose ps"
echo "  - Рестарт: docker compose restart"
echo ""
