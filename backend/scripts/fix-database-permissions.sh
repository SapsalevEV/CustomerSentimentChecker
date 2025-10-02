#!/bin/bash

# Исправление прав доступа к базе данных
# Использование: ssh deploy@193.233.102.193 'bash -s' < scripts/fix-database-permissions.sh

set -e

echo "========================================="
echo "Исправление прав доступа к базе данных"
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

# Проверка текущих прав
echo "--- 1. Проверка текущих прав ---"
if [ -d database ]; then
    echo "Директория database:"
    ls -lah database/
    echo ""
    echo "Владелец директории database:"
    stat -c "User: %U, Group: %G, Permissions: %a" database/

    if [ -f database/bank_reviews.db ]; then
        echo ""
        echo "Файл database/bank_reviews.db:"
        stat -c "User: %U, Group: %G, Permissions: %a" database/bank_reviews.db
    fi
else
    echo "⚠️  Директория database не существует, создаём..."
    mkdir -p database
fi
echo ""

# Исправление прав
echo "--- 2. Исправление прав доступа ---"

# SQLite WAL режим требует права на запись в директорию
echo "Установка прав: 777 для database/ (полные права для SQLite WAL)"
chmod -R 777 database/ 2>/dev/null || {
    echo "❌ Не удалось установить права на database/"
    exit 1
}

echo "Установка прав: 755 для logs/"
chmod -R 755 logs/ 2>/dev/null || true

echo "✅ Права исправлены"
echo ""

# Проверка новых прав
echo "--- 3. Проверка новых прав ---"
echo "Директория database:"
stat -c "User: %U, Group: %G, Permissions: %a" database/

if [ -f database/bank_reviews.db ]; then
    echo "Файл database/bank_reviews.db:"
    stat -c "User: %U, Group: %G, Permissions: %a" database/bank_reviews.db
fi
echo ""

# Остановка контейнера
echo "--- 4. Перезапуск контейнера ---"
echo "Остановка контейнера..."
docker compose down || true

echo "Запуск контейнера..."
docker compose up -d

echo "✅ Контейнер перезапущен"
echo ""

# Ожидание запуска
echo "--- 5. Ожидание запуска приложения (20 сек) ---"
sleep 20

# Проверка статуса
echo "--- 6. Проверка статуса контейнера ---"
docker compose ps
echo ""

# Health check
echo "--- 7. Health check ---"
if curl -f http://localhost:8000/health 2>/dev/null; then
    echo "✅ Приложение работает!"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "❌ Health check не прошёл"
    echo ""
    echo "Логи контейнера (последние 30 строк):"
    docker compose logs --tail=30 api
    echo ""
    echo "Проверьте логи выше. Возможные проблемы:"
    echo "  1. База данных отсутствует или повреждена"
    echo "  2. Неправильный путь к базе данных в .env"
    echo "  3. Недостаточно места на диске"
    exit 1
fi
echo ""

# Проверка WAL режима
echo "--- 8. Проверка WAL файлов ---"
if [ -f database/bank_reviews.db-wal ]; then
    echo "✅ WAL файл создан (журнал работает)"
    ls -lh database/bank_reviews.db-wal
else
    echo "⚠️  WAL файл не найден (может быть создан при первой записи)"
fi
echo ""

echo "========================================="
echo "✅ Исправление завершено успешно!"
echo "========================================="
echo ""
echo "Приложение доступно:"
echo "  - Health: http://193.233.102.193:8000/health"
echo "  - API Docs: http://193.233.102.193:8000/docs"
echo ""
