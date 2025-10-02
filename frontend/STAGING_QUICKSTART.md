# Quick Start: Staging Setup

**Быстрый чеклист для настройки staging окружения.**

Полная инструкция: [STAGING_SETUP.md](./STAGING_SETUP.md)

---

## 🚀 Быстрый старт (5 шагов)

### 1. Настройка сервера (5 минут)

```bash
# Подключитесь к staging серверу
ssh root@89.23.99.74

# Скачайте и запустите скрипт установки backend
curl -o setup.sh https://raw.githubusercontent.com/SapsalevEV/actionable-sentiment-backend/develop/scripts/setup-staging-server.sh
chmod +x setup.sh
sudo ./setup.sh

# Создайте директорию для frontend
sudo mkdir -p /home/deploy/actionable-sentiment-frontend
sudo chown deploy:deploy /home/deploy/actionable-sentiment-frontend

# Выйдите с сервера
exit
```

### 2. Создайте SSH ключи (2 минуты)

```bash
# На вашей локальной машине
ssh-keygen -t ed25519 -C "github-staging" -f ~/.ssh/github_staging

# Добавьте публичный ключ на staging сервер
cat ~/.ssh/github_staging.pub | ssh root@89.23.99.74 'cat >> /home/deploy/.ssh/authorized_keys'

# Проверьте подключение
ssh -i ~/.ssh/github_staging deploy@89.23.99.74
```

### 3. Настройте GitHub Secrets (5 минут)

**Backend репозиторий:** Settings → Secrets and variables → Actions

Добавьте 4 секрета:
- `STAGING_HOST` = `89.23.99.74`
- `STAGING_USER` = `deploy`
- `STAGING_SSH_KEY` = Содержимое `~/.ssh/github_staging` (весь файл!)
- `STAGING_PATH` = `/home/deploy/actionable-sentiment-backend`

**Frontend репозиторий:** Settings → Secrets and variables → Actions

Добавьте 2 секрета:
- `STAGING_SERVER_USER` = `deploy`
- `STAGING_SSH_KEY` = Содержимое `~/.ssh/github_staging` (тот же ключ)

### 4. Настройте GitHub Container Registry (3 минуты)

```bash
# Создайте GitHub Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens
# Scopes: write:packages, read:packages

# Залогиньтесь на staging сервере
ssh deploy@89.23.99.74
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
exit
```

### 5. Первый деплой (10 минут)

```bash
# Backend
cd /path/to/actionable-sentiment-backend
git checkout develop
git push origin develop

# Проверка (через 5-7 минут)
curl http://89.23.99.74:8000/health

# Frontend
cd /path/to/actionable-sentiment
git checkout develop
git push origin develop

# Проверка (через 5-7 минут)
curl http://89.23.99.74/health
# Откройте в браузере: http://89.23.99.74
```

---

## ✅ Проверка готовности

**После выполнения всех шагов должно работать:**
- ✅ http://89.23.99.74:8000/health - Backend API
- ✅ http://89.23.99.74:8000/docs - API документация
- ✅ http://89.23.99.74 - Frontend приложение
- ✅ http://89.23.99.74/health - Frontend health check

---

## 📖 Workflow разработки

```bash
# 1. Разработка
git checkout develop
# ... делаете изменения ...
git add .
git commit -m "Add new feature"
git push origin develop

# 2. Автоматический деплой на staging (89.23.99.74)
# GitHub Actions сам задеплоит через 5-7 минут

# 3. Тестирование
# Откройте http://89.23.99.74 и протестируйте

# 4. Деплой на production
gh pr create --base main --head develop --title "Deploy to production"
# После merge в main → автоматический деплой на 193.233.102.193
```

---

## 🔧 Полезные команды

```bash
# Просмотр логов staging backend
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml logs -f api'

# Просмотр логов staging frontend
ssh deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-frontend/docker-compose.staging.yml logs -f frontend'

# Перезапуск staging backend
ssh deploy@89.23.99.74 'cd ~/actionable-sentiment-backend && docker compose -f docker-compose.staging.yml restart'

# Статус контейнеров
ssh deploy@89.23.99.74 'docker ps'
```

---

## ⚠️ Troubleshooting

**Ошибка SSH:**
```bash
ssh root@89.23.99.74
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

**Ошибка Docker pull:**
```bash
ssh deploy@89.23.99.74
docker logout ghcr.io
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Ошибка Health check:**
```bash
ssh deploy@89.23.99.74
docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml logs api
sudo ufw status  # Проверьте что порт 8000 открыт
```

---

## 📚 Документация

- [STAGING_SETUP.md](./STAGING_SETUP.md) - Полная инструкция
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- Backend: [QUICKSTART_STAGING.md](../actionable-sentiment-backend/docs/QUICKSTART_STAGING.md)

---

**Готово!** При `git push origin develop` приложение автоматически задеплоится на staging сервер.
