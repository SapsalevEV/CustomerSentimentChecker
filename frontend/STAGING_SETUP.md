# Руководство по настройке Staging окружения

Полная инструкция по настройке CI/CD пайплайна для автоматического деплоя на тестовый сервер при push в ветку `develop`.

---

## Обзор архитектуры

**Production (193.233.102.193):**
- Ветка: `main`
- Frontend: http://193.233.102.193
- Backend API: http://193.233.102.193:8000
- Docker образы: `:latest`

**Staging (89.23.99.74):**
- Ветка: `develop`
- Frontend: http://89.23.99.74
- Backend API: http://89.23.99.74:8000
- Docker образы: `:develop`

---

## Workflow разработки

```
1. Разработка фичи/фикса
   ↓
2. git push origin develop
   ↓
3. GitHub Actions: Auto-deploy на STAGING (89.23.99.74)
   ↓
4. Тестирование на staging
   ↓
5. Pull Request: develop → main
   ↓
6. GitHub Actions: Auto-deploy на PRODUCTION (193.233.102.193)
```

---

## Шаг 1: Настройка тестового сервера (89.23.99.74)

### 1.1. Подключение к серверу

```bash
ssh root@89.23.99.74
```

### 1.2. Настройка бэкенда

Используйте готовый скрипт из backend репозитория:

```bash
# Скачать скрипт установки
curl -o setup.sh https://raw.githubusercontent.com/SapsalevEV/actionable-sentiment-backend/develop/scripts/setup-staging-server.sh

# Сделать исполняемым
chmod +x setup.sh

# Запустить установку
sudo ./setup.sh
```

Скрипт автоматически:
- ✅ Установит Docker и Docker Compose
- ✅ Создаст пользователя `deploy`
- ✅ Настроит SSH директорию
- ✅ Создаст `/home/deploy/actionable-sentiment-backend`
- ✅ Настроит firewall (UFW) для портов 22, 80, 8000
- ✅ Создаст `.env` файл для staging

### 1.3. Создание директории для фронтенда

После выполнения скрипта создайте директорию для фронтенда:

```bash
# Создание директории
sudo mkdir -p /home/deploy/actionable-sentiment-frontend
sudo chown deploy:deploy /home/deploy/actionable-sentiment-frontend
```

### 1.4. Проверка установки

```bash
# Проверка Docker
docker --version
docker compose version

# Проверка структуры директорий
ls -la /home/deploy/
# Должны быть:
# - actionable-sentiment-backend
# - actionable-sentiment-frontend

# Проверка firewall
sudo ufw status
# Должны быть открыты порты: 22, 80, 8000
```

---

## Шаг 2: Генерация SSH ключей

### 2.1. На локальной машине создайте SSH ключи

```bash
# Ключ для staging (если еще нет)
ssh-keygen -t ed25519 -C "github-staging" -f ~/.ssh/github_staging

# Ключ для production (если еще нет)
ssh-keygen -t ed25519 -C "github-production" -f ~/.ssh/github_production
```

### 2.2. Добавьте публичные ключи на сервера

**Staging сервер:**
```bash
cat ~/.ssh/github_staging.pub | ssh root@89.23.99.74 'cat >> /home/deploy/.ssh/authorized_keys'
```

**Production сервер (если еще не добавлен):**
```bash
cat ~/.ssh/github_production.pub | ssh root@193.233.102.193 'cat >> /home/deploy/.ssh/authorized_keys'
```

### 2.3. Проверка SSH подключения

```bash
# Staging
ssh -i ~/.ssh/github_staging deploy@89.23.99.74

# Production
ssh -i ~/.ssh/github_production deploy@193.233.102.193
```

---

## Шаг 3: Настройка GitHub Secrets

Нужно добавить секреты в **оба репозитория** (backend и frontend).

### 3.1. Backend репозиторий

Перейдите в GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**Добавьте для Staging:**

| Имя секрета | Значение | Описание |
|-------------|----------|----------|
| `STAGING_HOST` | `89.23.99.74` | IP staging сервера |
| `STAGING_USER` | `deploy` | SSH пользователь |
| `STAGING_SSH_KEY` | Содержимое `~/.ssh/github_staging` | Приватный SSH ключ (весь файл!) |
| `STAGING_PATH` | `/home/deploy/actionable-sentiment-backend` | Путь к проекту на сервере |

**Для Production (если еще нет):**

| Имя секрета | Значение |
|-------------|----------|
| `DEPLOY_HOST` | `193.233.102.193` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Содержимое `~/.ssh/github_production` |
| `DEPLOY_PATH` | `/home/deploy/actionable-sentiment-backend` |

### 3.2. Frontend репозиторий

**Добавьте для Staging:**

| Имя секрета | Значение | Описание |
|-------------|----------|----------|
| `STAGING_SERVER_USER` | `deploy` | SSH пользователь |
| `STAGING_SSH_KEY` | Содержимое `~/.ssh/github_staging` | Тот же ключ, что и для backend |

**Для Production (должны уже быть):**

| Имя секрета | Значение |
|-------------|----------|
| `DOCKER_USERNAME` | Ваш Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Содержимое `~/.ssh/github_production` |

### 3.3. Как добавить секрет

```bash
# 1. Скопируйте содержимое приватного ключа
cat ~/.ssh/github_staging

# 2. Скопируйте ВЕСЬ вывод включая:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...содержимое ключа...
# -----END OPENSSH PRIVATE KEY-----

# 3. В GitHub:
# - Settings → Secrets and variables → Actions
# - New repository secret
# - Name: STAGING_SSH_KEY
# - Secret: вставьте скопированный ключ
# - Add secret
```

---

## Шаг 4: Настройка GitHub Container Registry (только для Backend)

Backend использует GitHub Container Registry (ghcr.io) вместо Docker Hub.

### 4.1. На staging сервере залогиньтесь в ghcr.io

```bash
# Подключитесь к staging
ssh deploy@89.23.99.74

# Логин (используйте свой GitHub Personal Access Token)
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 4.2. Создание GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите scopes:
   - ✅ `write:packages`
   - ✅ `read:packages`
4. Generate token
5. Скопируйте и сохраните токен

### 4.3. На production сервере (если еще не настроено)

```bash
ssh deploy@193.233.102.193
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

---

## Шаг 5: Первый деплой на Staging

### 5.1. Backend деплой

```bash
# Перейдите в репозиторий backend
cd /path/to/actionable-sentiment-backend

# Переключитесь на develop
git checkout develop

# Убедитесь что все изменения закоммичены
git status

# Push в develop
git push origin develop
```

**Проверка:**
1. GitHub → Actions → "Build and Deploy to Staging"
2. Дождитесь завершения workflow (5-7 минут)
3. Проверьте endpoints:
   ```bash
   curl http://89.23.99.74:8000/health
   # Должно вернуть: {"status":"ok"}

   curl http://89.23.99.74:8000/docs
   # Должен открыться OpenAPI документация
   ```

### 5.2. Frontend деплой

```bash
# Перейдите в репозиторий frontend
cd /path/to/actionable-sentiment

# Переключитесь на develop
git checkout develop

# Push в develop
git push origin develop
```

**Проверка:**
1. GitHub → Actions → "Build and Deploy to Staging"
2. Дождитесь завершения workflow (5-7 минут)
3. Откройте в браузере: http://89.23.99.74
4. Проверьте что приложение работает и загружает данные с API

---

## Шаг 6: Тестирование на Staging

### 6.1. Проверка Backend API

```bash
# Health check
curl http://89.23.99.74:8000/health

# Получение конфигурации
curl http://89.23.99.74:8000/api/config

# Тест dashboard API
curl -X POST http://89.23.99.74:8000/api/dashboard/overview \
  -H "Content-Type: application/json" \
  -d '{
    "date_range": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    },
    "filters": {
      "sources": [],
      "products": []
    }
  }'
```

### 6.2. Проверка Frontend

1. Откройте http://89.23.99.74
2. Проверьте все основные страницы:
   - Dashboard
   - Products
   - Reviews
   - Analytics
   - Comparative Analysis
3. Проверьте что фильтры работают
4. Проверьте что данные загружаются с backend API

### 6.3. Проверка логов

**Backend:**
```bash
ssh deploy@89.23.99.74
cd /home/deploy/actionable-sentiment-backend
docker compose -f docker-compose.staging.yml logs -f api
```

**Frontend:**
```bash
ssh deploy@89.23.99.74
cd /home/deploy/actionable-sentiment-frontend
docker compose -f docker-compose.staging.yml logs -f frontend
```

---

## Шаг 7: Деплой на Production после тестирования

После успешного тестирования на staging:

### 7.1. Создание Pull Request

```bash
# Создайте PR через GitHub CLI
gh pr create --base main --head develop \
  --title "Deploy to production" \
  --body "Tested on staging (89.23.99.74). Ready for production deployment."

# Или через веб-интерфейс:
# 1. GitHub → Pull requests → New pull request
# 2. base: main ← compare: develop
# 3. Create pull request
```

### 7.2. Review и Merge

1. Проверьте изменения в PR
2. Дождитесь проверок (если настроены)
3. Merge pull request
4. GitHub Actions автоматически задеплоит на production

### 7.3. Проверка Production

```bash
# Backend
curl http://193.233.102.193:8000/health

# Frontend
# Откройте в браузере: http://193.233.102.193
```

---

## Полезные команды

### Просмотр статуса контейнеров

```bash
# Staging Backend
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml ps'

# Staging Frontend
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-frontend/docker-compose.staging.yml ps'

# Production Backend
ssh deploy@193.233.102.193 'docker compose -f ~/actionable-sentiment-backend/docker-compose.yml ps'

# Production Frontend
ssh deploy@193.233.102.193 'docker compose -f ~/opt/actionable-sentiment/docker-compose.yml ps'
```

### Перезапуск сервисов

```bash
# Staging Backend
ssh deploy@89.23.99.74 'cd ~/actionable-sentiment-backend && docker compose -f docker-compose.staging.yml restart'

# Staging Frontend
ssh deploy@89.23.99.74 'cd ~/actionable-sentiment-frontend && docker compose -f docker-compose.staging.yml restart'
```

### Просмотр логов

```bash
# Staging Backend (последние 100 строк)
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml logs --tail=100 api'

# Staging Frontend (в реальном времени)
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-frontend/docker-compose.staging.yml logs -f frontend'
```

### Очистка старых образов

```bash
# На staging сервере
ssh deploy@89.23.99.74
docker image prune -af

# Более безопасно (только старше 24 часов)
docker image prune -af --filter "until=24h"
```

---

## Troubleshooting

### Ошибка: "Permission denied (publickey)"

```bash
# Проверьте права на сервере
ssh root@89.23.99.74
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Проверьте что публичный ключ добавлен
cat /home/deploy/.ssh/authorized_keys
```

### Ошибка: "Port already in use"

```bash
# Проверьте что запущено на порту
ssh root@89.23.99.74
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8000

# Остановите старые контейнеры
docker ps -a
docker stop <container_id>
docker rm <container_id>
```

### Ошибка: "Failed to pull image"

**Backend (ghcr.io):**
```bash
ssh deploy@89.23.99.74

# Проверьте логин в ghcr.io
docker logout ghcr.io
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Попробуйте pull вручную
docker pull ghcr.io/sapsalevev/actionable-sentiment-backend/api:develop
```

**Frontend (Docker Hub):**
```bash
ssh deploy@89.23.99.74

# Проверьте логин
docker logout
docker login -u YOUR_DOCKERHUB_USERNAME

# Попробуйте pull вручную
docker pull esapsalevev/actionable-sentiment:develop
```

### Ошибка: "Health check failed"

```bash
# Проверьте логи контейнера
ssh deploy@89.23.99.74
cd /home/deploy/actionable-sentiment-backend
docker compose -f docker-compose.staging.yml logs api

# Проверьте что порт доступен
curl http://localhost:8000/health

# Проверьте firewall
sudo ufw status
```

### Контейнер постоянно перезапускается

```bash
# Посмотрите логи
docker compose -f docker-compose.staging.yml logs --tail=50 api

# Проверьте ресурсы системы
free -h
df -h

# Проверьте права на директории (для backend)
ls -la database/
chmod 777 database/
```

---

## Контрольный список

### Подготовка сервера:
- [ ] Сервер 89.23.99.74 доступен по SSH
- [ ] Запущен скрипт setup-staging-server.sh
- [ ] Docker и Docker Compose установлены
- [ ] Создан пользователь deploy
- [ ] Firewall настроен (порты 22, 80, 8000)
- [ ] Создана директория /home/deploy/actionable-sentiment-frontend

### SSH ключи:
- [ ] Сгенерированы SSH ключи (github_staging, github_production)
- [ ] Публичные ключи добавлены на серверы
- [ ] Проверено SSH подключение

### GitHub Secrets (Backend):
- [ ] STAGING_HOST
- [ ] STAGING_USER
- [ ] STAGING_SSH_KEY
- [ ] STAGING_PATH
- [ ] DEPLOY_HOST
- [ ] DEPLOY_USER
- [ ] DEPLOY_SSH_KEY
- [ ] DEPLOY_PATH

### GitHub Secrets (Frontend):
- [ ] STAGING_SERVER_USER
- [ ] STAGING_SSH_KEY
- [ ] DOCKER_USERNAME
- [ ] DOCKER_PASSWORD
- [ ] SERVER_USER
- [ ] SSH_PRIVATE_KEY

### GitHub Container Registry:
- [ ] Создан Personal Access Token
- [ ] Залогинен на staging сервере (ghcr.io)
- [ ] Залогинен на production сервере (ghcr.io)

### Docker Hub:
- [ ] Залогинен на staging сервере (для frontend)

### Тестирование:
- [ ] Backend staging деплой успешен
- [ ] Frontend staging деплой успешен
- [ ] http://89.23.99.74:8000/health работает
- [ ] http://89.23.99.74 работает
- [ ] API интеграция работает на staging
- [ ] Production деплой работает

---

## Дополнительные ресурсы

**Backend документация:**
- [QUICKSTART_STAGING.md](../actionable-sentiment-backend/docs/QUICKSTART_STAGING.md)
- [SETUP_GITHUB_SECRETS.md](../actionable-sentiment-backend/docs/SETUP_GITHUB_SECRETS.md)
- [setup-staging-server.sh](../actionable-sentiment-backend/scripts/setup-staging-server.sh)

**Frontend документация:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [CLAUDE.md](./CLAUDE.md) - Development guide

**Workflows:**
- Backend Staging: `.github/workflows/deploy-staging.yml` (backend repo)
- Backend Production: `.github/workflows/deploy.yml` (backend repo)
- Frontend Staging: `.github/workflows/deploy-staging.yml` (frontend repo)
- Frontend Production: `.github/workflows/deploy.yml` (frontend repo)

---

## Поддержка

При возникновении проблем:
1. Проверьте логи GitHub Actions
2. Проверьте логи Docker контейнеров
3. Проверьте firewall и сетевые настройки
4. Убедитесь что все секреты настроены правильно

**Готово!** 🎉 Теперь у вас полноценный CI/CD pipeline с автоматическим деплоем на staging и production.
