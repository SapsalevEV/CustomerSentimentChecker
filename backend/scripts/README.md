# Deployment Scripts

Скрипты для управления и диагностики production сервера.

## deploy-database.sh

**Назначение:** Развертывание базы данных на staging или production сервере.

**⚠️ КРИТИЧЕСКИ ВАЖНО:** База данных НЕ включена в Docker образы и должна деплоиться отдельно!

**Использование:**

```bash
# Развертывание на staging
./scripts/deploy-database.sh staging

# Развертывание на production
./scripts/deploy-database.sh production
```

**Что делает скрипт:**
1. ✅ Проверяет наличие локального файла базы данных
2. ✅ Создает резервную копию существующей базы на сервере
3. ✅ Останавливает контейнеры приложения
4. ✅ Копирует базу данных на сервер через SCP
5. ✅ Устанавливает корректные права доступа (777 для WAL mode)
6. ✅ Перезапускает контейнеры
7. ✅ Выполняет проверки здоровья (health checks)
8. ✅ Проверяет работоспособность базы данных

**Когда использовать:**
- 🚀 Первое развертывание на новом сервере
- 📊 Обновление данных в базе
- 🔄 Восстановление базы после проблем
- ⚠️ После ошибки "Database file not found" в CI/CD

**Требования:**
- SSH доступ к целевому серверу
- Файл `database/bank_reviews.db` существует локально
- SSH ключи настроены для passwordless входа

**Проверка результата:**
```bash
# Проверка health check базы данных
curl http://89.23.99.74:8000/health/database  # staging
curl http://193.233.102.193:8000/health/database  # production
```

**См. также:** [docs/database-setup.md](../docs/database-setup.md) - Полное руководство по работе с базой данных

---

## diagnose-server.sh

**Назначение:** Полная диагностика состояния сервера и приложения.

**Использование:**

```bash
# С локального компьютера
ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh

# На сервере
cd /home/deploy/actionable-sentiment-backend
bash scripts/diagnose-server.sh
```

**Что проверяет:**
- ✅ Версии Docker и Docker Compose
- ✅ Наличие необходимых файлов (docker-compose.yml, .env, база данных)
- ✅ Переменная окружения GITHUB_REPOSITORY
- ✅ Статус контейнеров (запущены/остановлены)
- ✅ Логи контейнеров (последние 50 строк)
- ✅ Порт 8000 (используется или нет)
- ✅ Firewall статус (UFW)
- ✅ Health check на localhost
- ✅ Health check на внешнем IP
- ✅ Сетевые настройки (netstat)
- ✅ Docker images и networks

**Когда использовать:**
- Деплой прошел успешно, но приложение недоступно
- Нужно понять текущее состояние сервера
- Перед открытием issue с проблемой (приложите вывод скрипта)

---

## fix-docker-image-path.sh

**Назначение:** Исправление проблем с путями к Docker образам и настройка правильного репозитория.

**Использование:**

```bash
# С локального компьютера
ssh deploy@193.233.102.193 'bash -s' < scripts/fix-docker-image-path.sh

# На сервере
cd /home/deploy/actionable-sentiment-backend
bash scripts/fix-docker-image-path.sh
```

**Что делает:**
1. Исправляет переменную `GITHUB_REPOSITORY` в `.env` (правильное значение: `sapsalevev/actionable-sentiment-backend`)
2. Останавливает старые контейнеры
3. Проверяет доступность образа в GitHub Container Registry (ghcr.io)
4. Если образ недоступен - собирает локально из Dockerfile
5. Если образ доступен - загружает из ghcr.io
6. Запускает контейнеры
7. Проверяет health checks (localhost и external IP)

**Когда использовать:**
- После изменения путей к Docker образам
- Когда образ не может быть загружен из ghcr.io
- При путанице между репозиториями бэкенда и фронтенда
- Если нужно переключиться между локальной сборкой и образом из ghcr.io

**⚠️ Важно:**
- Правильное название репозитория: `sapsalevev/actionable-sentiment-backend`
- Образ в ghcr.io: `ghcr.io/sapsalevev/actionable-sentiment-backend/api:latest`
- Не путайте с фронтенд репозиторием `esapsalev/actionable-sentiment`

---

## fix-database-permissions.sh

**Назначение:** Исправление прав доступа к базе данных для работы SQLite WAL режима.

**Использование:**

```bash
# С локального компьютера
ssh deploy@193.233.102.193 'bash -s' < scripts/fix-database-permissions.sh

# На сервере
cd /home/deploy/actionable-sentiment-backend
bash scripts/fix-database-permissions.sh
```

**Что делает:**
1. Проверяет текущие права на директорию `database/` и файлы внутри
2. Устанавливает правильного владельца (`deploy:deploy`)
3. Устанавливает права: `755` для директорий, `644` для файлов
4. Перезапускает контейнер
5. Проверяет health check и создание WAL файлов

**Когда использовать:**
- Ошибка: `attempt to write a readonly database`
- Ошибка: `PRAGMA journal_mode=WAL` не выполняется
- После копирования базы данных с другого сервера
- После изменения владельца файлов

**⚠️ Важно:**
SQLite в WAL режиме требует права на запись в директорию для создания файлов `-wal` и `-shm`

---

## quick-fix.sh

**Назначение:** Быстрое исправление типичных проблем с деплоем.

**Использование:**

```bash
# С локального компьютера
ssh deploy@193.233.102.193 'bash -s' < scripts/quick-fix.sh

# На сервере
cd /home/deploy/actionable-sentiment-backend
bash scripts/quick-fix.sh

# С переменными окружения (если нужен login в ghcr.io)
ssh deploy@193.233.102.193 "export GITHUB_TOKEN='ghp_xxx'; export GITHUB_USERNAME='youruser'; bash -s" < scripts/quick-fix.sh
```

**Что делает:**
1. Останавливает и удаляет контейнеры
2. Чистит Docker (старые образы, networks)
3. Проверяет и открывает порт 8000 в UFW
4. Создает необходимые директории
5. Создает .env файл (если отсутствует)
6. Проверяет docker-compose.yml
7. Определяет и устанавливает GITHUB_REPOSITORY
8. Логинится в GitHub Container Registry (если GITHUB_TOKEN задан)
9. Пуллит последний Docker образ
10. Запускает контейнеры
11. Ждет 15 секунд
12. Проверяет health checks (localhost и external IP)
13. Показывает итоговый статус

**Когда использовать:**
- После первого деплоя, если приложение не запустилось
- Когда нужно "начать с чистого листа"
- Деплой успешен, но приложение недоступно извне

**⚠️ Требования:**
- `docker-compose.yml` должен существовать на сервере
- База данных должна быть скопирована в `database/bank_reviews.db`
- (Опционально) GITHUB_TOKEN для login в ghcr.io

---

## Типичные сценарии

### Сценарий 1: Деплой успешен, но сервер не отвечает

```bash
# 1. Диагностика
ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh > diagnosis.log

# 2. Просмотр результатов
cat diagnosis.log

# 3. Если проблема очевидна, применить quick-fix
ssh deploy@193.233.102.193 'bash -s' < scripts/quick-fix.sh
```

### Сценарий 2: Первый деплой

```bash
# 1. Копируем docker-compose.yml
scp docker-compose.yml deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/

# 2. Копируем базу данных
scp database/bank_reviews.db deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/database/

# 3. Запускаем quick-fix
ssh deploy@193.233.102.193 "export GITHUB_TOKEN='YOUR_TOKEN'; export GITHUB_USERNAME='YOUR_USERNAME'; bash -s" < scripts/quick-fix.sh
```

### Сценарий 3: Контейнер падает сразу после старта

```bash
# 1. Диагностика для просмотра логов
ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh

# 2. Смотрим логи напрямую
ssh deploy@193.233.102.193
docker-compose logs --tail=100 api

# 3. Проверяем переменные окружения
cat .env

# 4. Проверяем что база данных существует и доступна
ls -lh database/
sqlite3 database/bank_reviews.db "SELECT COUNT(*) FROM reviews;"
```

### Сценарий 4: Ошибка "readonly database"

```bash
# Проблема: SQLite не может включить WAL режим
# Ошибка: attempt to write a readonly database
# Причина: Неправильные права на директорию database/

# Решение A: Автоматическое исправление (рекомендуется)
ssh deploy@193.233.102.193 'bash -s' < scripts/fix-database-permissions.sh

# Решение B: Ручное исправление
ssh deploy@193.233.102.193
cd /home/deploy/actionable-sentiment-backend

# Проверяем текущие права
ls -lah database/
stat database/bank_reviews.db

# Исправляем права
chown -R deploy:deploy database/ logs/
chmod -R 755 database/
chmod 644 database/*.db

# Перезапускаем
docker compose down
docker compose up -d
docker compose logs -f api
```

### Сценарий 5: Ошибка "denied: denied" при загрузке образа

```bash
# Проблема: Image pull из ghcr.io не работает
# Причины:
# 1. Неправильный путь к образу (путаница между репозиториями)
# 2. Образ приватный и нужна авторизация
# 3. Образ еще не был опубликован через GitHub Actions

# Решение A: Использовать fix-docker-image-path.sh (рекомендуется)
ssh deploy@193.233.102.193 'bash -s' < scripts/fix-docker-image-path.sh

# Решение B: Авторизоваться в ghcr.io (если образ приватный)
ssh deploy@193.233.102.193
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
docker pull ghcr.io/sapsalevev/actionable-sentiment-backend/api:latest
docker-compose up -d

# Решение C: Собрать образ локально
ssh deploy@193.233.102.193
cd /home/deploy/actionable-sentiment-backend
docker-compose build
docker-compose up -d
```

### Сценарий 6: Порт 8000 работает на localhost, но не снаружи

```bash
# SSH на сервер
ssh deploy@193.233.102.193

# Проверка firewall
sudo ufw status
sudo ufw allow 8000/tcp
sudo ufw reload

# Проверка что контейнер слушает на 0.0.0.0
docker-compose logs api | grep "Uvicorn running"
# Должно быть: "Uvicorn running on http://0.0.0.0:8000"

# Проверка сетевых интерфейсов
sudo netstat -tulpn | grep 8000
# Должно показать 0.0.0.0:8000 или :::8000, а не 127.0.0.1:8000
```

---

## Требования

- SSH доступ к серверу `deploy@193.233.102.193`
- SSH ключ настроен
- Docker и Docker Compose установлены на сервере
- Права sudo для пользователя deploy (для UFW команд)

## Troubleshooting

### "docker-compose.yml not found"
```bash
scp docker-compose.yml deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/
```

### "Failed to pull image"
```bash
# Создайте Personal Access Token на GitHub
# https://github.com/settings/tokens
# Scope: read:packages

# Логин на сервере
ssh deploy@193.233.102.193
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### "Permission denied" при запуске скриптов
```bash
chmod +x scripts/*.sh
```

### Scripts находятся только локально
```bash
# Выполнение через stdin (рекомендуется)
ssh deploy@193.233.102.193 'bash -s' < scripts/quick-fix.sh

# Или копирование на сервер
scp scripts/*.sh deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/scripts/
```

---

## Контакты

Для вопросов и проблем создайте issue в GitHub репозитории.
