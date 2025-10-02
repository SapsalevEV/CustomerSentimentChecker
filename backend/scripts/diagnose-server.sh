#!/bin/bash

# Диагностика проблем с деплоем
# Использование: ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh

echo "========================================="
echo "Диагностика сервера actionable-sentiment-backend"
echo "Дата: $(date)"
echo "========================================="
echo ""

# 1. Проверка Docker
echo "--- 1. Docker статус ---"
docker --version
docker compose --version
echo ""

# 2. Переход в директорию проекта
echo "--- 2. Переход в директорию проекта ---"
cd /home/deploy/actionable-sentiment-backend || {
    echo "❌ ОШИБКА: Директория /home/deploy/actionable-sentiment-backend не найдена!"
    exit 1
}
echo "✅ Текущая директория: $(pwd)"
echo ""

# 3. Проверка файлов
echo "--- 3. Проверка наличия файлов ---"
echo "Файлы в директории:"
ls -lah
echo ""

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ОШИБКА: docker-compose.yml отсутствует!"
else
    echo "✅ docker-compose.yml найден"
fi

if [ ! -f ".env" ]; then
    echo "❌ ОШИБКА: .env файл отсутствует!"
else
    echo "✅ .env найден"
fi

if [ ! -f "database/bank_reviews.db" ]; then
    echo "⚠️  ПРЕДУПРЕЖДЕНИЕ: База данных не найдена!"
else
    echo "✅ База данных найдена ($(du -h database/bank_reviews.db | cut -f1))"
fi
echo ""

# 4. Проверка GITHUB_REPOSITORY переменной
echo "--- 4. Проверка переменной GITHUB_REPOSITORY ---"
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo "⚠️  GITHUB_REPOSITORY не установлена"
    echo "Попытка определить из docker-compose.yml..."
    if [ -f "docker-compose.yml" ]; then
        grep "image:" docker-compose.yml
    fi
else
    echo "✅ GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
fi
echo ""

# 5. Статус контейнеров
echo "--- 5. Статус Docker контейнеров ---"
docker compose ps
echo ""

# 6. Проверка запущенных контейнеров
echo "--- 6. Запущенные Docker контейнеры ---"
docker ps -a | grep sentiment || echo "❌ Контейнер sentiment-api не найден"
echo ""

# 7. Логи контейнера (последние 50 строк)
echo "--- 7. Логи контейнера (последние 50 строк) ---"
if docker ps | grep sentiment-api > /dev/null; then
    docker compose logs --tail=50 api
else
    echo "❌ Контейнер не запущен, логи недоступны"
    echo "Попытка получить логи остановленного контейнера:"
    docker logs sentiment-api 2>&1 | tail -50 || echo "Логи недоступны"
fi
echo ""

# 8. Проверка порта 8000
echo "--- 8. Проверка порта 8000 ---"
if sudo lsof -i :8000 > /dev/null 2>&1; then
    echo "✅ Порт 8000 используется:"
    sudo lsof -i :8000
else
    echo "❌ Порт 8000 не используется (контейнер не слушает порт)"
fi
echo ""

# 9. Firewall статус
echo "--- 9. Firewall статус ---"
sudo ufw status | grep 8000 || echo "⚠️  Правило для порта 8000 не найдено в UFW"
echo ""

# 10. Проверка health endpoint (localhost)
echo "--- 10. Health check (localhost) ---"
if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Health check успешен:"
    curl -s http://localhost:8000/health
else
    echo "❌ Health check failed - приложение не отвечает на localhost:8000"
fi
echo ""

# 11. Проверка health endpoint (внешний IP)
echo "--- 11. Health check (внешний IP) ---"
if curl -s -f http://193.233.102.193:8000/health > /dev/null 2>&1; then
    echo "✅ Health check с внешнего IP успешен:"
    curl -s http://193.233.102.193:8000/health
else
    echo "❌ Health check с внешнего IP failed"
fi
echo ""

# 12. Сетевые интерфейсы
echo "--- 12. Сетевые интерфейсы и порты ---"
sudo netstat -tulpn | grep 8000 || echo "Порт 8000 не найден в netstat"
echo ""

# 13. Docker images
echo "--- 13. Docker images ---"
docker images | grep sentiment || echo "⚠️  Образ sentiment не найден"
echo ""

# 14. Docker network
echo "--- 14. Docker network ---"
docker network ls | grep sentiment || echo "⚠️  Сеть sentiment не найдена"
echo ""

echo "========================================="
echo "Диагностика завершена"
echo "========================================="
