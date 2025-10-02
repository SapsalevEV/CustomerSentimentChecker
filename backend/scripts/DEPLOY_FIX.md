# Инструкция по исправлению развертывания

## Проблемы обнаружены

1. ❌ `docker-compose` (V1) не установлен, нужен `docker compose` (V2)
2. ❌ Backend контейнер не запущен
3. ❌ Переменная `GITHUB_REPOSITORY` не установлена
4. ❌ Образ не может быть загружен из GitHub Registry

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

```bash
# На локальной машине - загрузить скрипт на сервер
scp scripts/fix-server-docker.sh deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/

# На сервере - выполнить скрипт
ssh deploy@193.233.102.193
cd /home/deploy/actionable-sentiment-backend
chmod +x fix-server-docker.sh
./fix-server-docker.sh
```

### Вариант 2: Ручное исправление

#### Шаг 1: Подключиться к серверу

```bash
ssh deploy@193.233.102.193
cd /home/deploy/actionable-sentiment-backend
```

#### Шаг 2: Установить GITHUB_REPOSITORY

```bash
# Добавить в .env
echo "GITHUB_REPOSITORY=esapsalev/actionable-sentiment" >> .env
```

#### Шаг 3: Обновить docker-compose.yml

Отредактировать `docker-compose.yml`, заменить:

```yaml
image: ghcr.io/${GITHUB_REPOSITORY:-actionable-sentiment-backend}/api:latest
```

На:

```yaml
image: ghcr.io/esapsalev/actionable-sentiment/api:latest
```

#### Шаг 4: Авторизация в GitHub Registry (если образ приватный)

```bash
# Создать Personal Access Token на GitHub с правами read:packages
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u esapsalev --password-stdin
```

#### Шаг 5: Запустить контейнеры

```bash
# Остановить старые контейнеры
docker compose down

# Загрузить образ
docker pull ghcr.io/esapsalev/actionable-sentiment/api:latest

# Запустить
docker compose up -d

# Проверить статус
docker compose ps
docker compose logs -f api
```

#### Шаг 6: Проверить работу

```bash
# Health check
curl http://localhost:8000/health

# Проверить порт
netstat -tuln | grep 8000
# или
ss -tuln | grep 8000
```

## Проверка результата

После исправления должно быть:

```bash
✅ docker compose ps        # Показывает api контейнер в статусе "running (healthy)"
✅ curl localhost:8000/health  # Возвращает {"status": "ok"}
✅ Порт 8000 слушается
✅ API доступен на http://193.233.102.193:8000/docs
```

## Альтернативное решение: Использовать публичный образ

Если проблема с GitHub Registry, можно использовать Docker Hub:

```yaml
# В docker-compose.yml
services:
  api:
    image: esapsalev/actionable-sentiment:latest  # Вместо ghcr.io
```

## Дополнительно: Настройка GitHub Actions

Убедиться, что в GitHub Secrets установлены:

- `DEPLOY_HOST` = `193.233.102.193`
- `DEPLOY_USER` = `deploy`
- `DEPLOY_SSH_KEY` = SSH приватный ключ
- `DEPLOY_PATH` = `/home/deploy/actionable-sentiment-backend`

## Troubleshooting

### Проблема: docker compose не найден

```bash
# Проверить версию Docker
docker --version

# Если Docker < 20.10, установить plugin
sudo apt update
sudo apt install docker-compose-plugin
```

### Проблема: Образ не загружается

```bash
# Проверить доступные образы
docker images

# Попробовать загрузить вручную
docker pull ghcr.io/esapsalev/actionable-sentiment/api:latest

# Если ошибка 403/404 - проверить права доступа или использовать Docker Hub
```

### Проблема: Контейнер запускается но падает

```bash
# Посмотреть логи
docker compose logs --tail=100 api

# Проверить переменные окружения
docker compose config

# Проверить базу данных
ls -lh database/bank_reviews.db
```

### Проблема: Порт занят

```bash
# Найти процесс на порту 8000
sudo lsof -i :8000
# или
sudo ss -tulnp | grep 8000

# Остановить процесс
sudo kill -9 <PID>
```
