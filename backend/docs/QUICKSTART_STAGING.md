# 🚀 Quick Start: Staging Server Setup

Пошаговая инструкция по настройке тестового окружения.

---

## Шаг 1: Подготовка staging сервера (89.23.99.74)

### 1.1. Подключитесь к серверу

```bash
ssh root@89.23.99.74
```

### 1.2. Скачайте и запустите скрипт установки

```bash
# Скачайте setup скрипт с GitHub
curl -o setup-staging.sh https://raw.githubusercontent.com/SapsalevEV/actionable-sentiment-backend/develop/scripts/setup-staging-server.sh

# Сделайте исполняемым
chmod +x setup-staging.sh

# Запустите с правами root
sudo ./setup-staging.sh
```

Скрипт автоматически:
- ✅ Установит Docker и Docker Compose
- ✅ Создаст пользователя `deploy`
- ✅ Настроит SSH директорию
- ✅ Создаст структуру каталогов проекта
- ✅ Настроит firewall (UFW)
- ✅ Создаст `.env` файл для staging

---

## Шаг 2: Настройка SSH ключей

### 2.1. На локальной машине сгенерируйте SSH ключи

```bash
# Для staging
ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/github_staging

# Для production (если еще нет)
ssh-keygen -t ed25519 -C "github-actions-production" -f ~/.ssh/github_production
```

### 2.2. Добавьте публичные ключи на серверы

**Staging:**
```bash
cat ~/.ssh/github_staging.pub | ssh root@89.23.99.74 'cat >> /home/deploy/.ssh/authorized_keys'
```

**Production:**
```bash
cat ~/.ssh/github_production.pub | ssh root@193.233.102.193 'cat >> /home/deploy/.ssh/authorized_keys'
```

### 2.3. Проверьте SSH подключение

```bash
# Staging
ssh -i ~/.ssh/github_staging deploy@89.23.99.74

# Production
ssh -i ~/.ssh/github_production deploy@193.233.102.193
```

---

## Шаг 3: Настройка GitHub Secrets

Перейдите в GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Добавьте следующие секреты:

### Staging (4 секрета):

| Имя | Значение |
|-----|----------|
| `STAGING_HOST` | `89.23.99.74` |
| `STAGING_USER` | `deploy` |
| `STAGING_SSH_KEY` | Содержимое файла `~/.ssh/github_staging` |
| `STAGING_PATH` | `/home/deploy/actionable-sentiment-backend` |

### Production (4 секрета):

| Имя | Значение |
|-----|----------|
| `DEPLOY_HOST` | `193.233.102.193` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Содержимое файла `~/.ssh/github_production` |
| `DEPLOY_PATH` | `/home/deploy/actionable-sentiment-backend` |

⚠️ **Важно**: При копировании приватного ключа включите весь контент от `-----BEGIN OPENSSH PRIVATE KEY-----` до `-----END OPENSSH PRIVATE KEY-----`

---

## Шаг 4: (Опционально) Скопировать базу данных на staging

Если нужна копия production базы для тестирования:

```bash
# С локальной машины скопируйте БД на staging
scp database/bank_reviews.db deploy@89.23.99.74:/home/deploy/actionable-sentiment-backend/database/
```

---

## Шаг 5: Настройка GitHub Container Registry

### 5.1. На staging сервере залогиньтесь в GitHub Registry

```bash
# Подключитесь к staging
ssh deploy@89.23.99.74

# Логин (используйте свой GitHub Personal Access Token)
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 5.2. На production сервере (если еще не сделано)

```bash
# Подключитесь к production
ssh deploy@193.233.102.193

# Логин
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Как создать GitHub Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите scope: `write:packages`, `read:packages`
4. Скопируйте и сохраните токен

---

## Шаг 6: Тестирование деплоя

### 6.1. Деплой на staging (develop ветка)

```bash
# На локальной машине
git checkout develop
git push origin develop

# Откройте GitHub → Actions
# Должен запуститься workflow: "Build and Deploy to Staging"
```

Проверьте:
- ✅ http://89.23.99.74:8000/health
- ✅ http://89.23.99.74:8000/docs

### 6.2. Деплой на production (main ветка)

После успешного тестирования на staging:

```bash
# Создайте PR: develop → main
gh pr create --base main --head develop --title "Deploy to production"

# Или через git
git checkout main
git merge develop
git push origin main

# Откройте GitHub → Actions
# Должен запуститься workflow: "Build and Deploy to Production"
```

Проверьте:
- ✅ http://193.233.102.193:8000/health
- ✅ http://193.233.102.193:8000/docs

---

## Workflow разработки

```
┌──────────────────┐
│  Разработка      │
│  фичи/фикса      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  git push        │
│  → develop       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Auto-deploy      │
│ → STAGING        │
│ (89.23.99.74)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Тестирование     │
│ на staging       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ PR: develop      │
│    → main        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Review & Merge   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Auto-deploy      │
│ → PRODUCTION     │
│ (193.233.102.193)│
└──────────────────┘
```

---

## Полезные команды

### Проверка статуса

```bash
# Staging
ssh -i ~/.ssh/github_staging deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml ps'

# Production
ssh -i ~/.ssh/github_production deploy@193.233.102.193 'docker compose -f ~/actionable-sentiment-backend/docker-compose.yml ps'
```

### Просмотр логов

```bash
# Staging
ssh -i ~/.ssh/github_staging deploy@89.23.99.74 'docker compose -f ~/actionable-sentiment-backend/docker-compose.staging.yml logs -f api'

# Production
ssh -i ~/.ssh/github_production deploy@193.233.102.193 'docker compose -f ~/actionable-sentiment-backend/docker-compose.yml logs -f api'
```

### Перезапуск

```bash
# Staging
ssh -i ~/.ssh/github_staging deploy@89.23.99.74 'cd ~/actionable-sentiment-backend && docker compose -f docker-compose.staging.yml restart'

# Production
ssh -i ~/.ssh/github_production deploy@193.233.102.193 'cd ~/actionable-sentiment-backend && docker compose restart'
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
```

### Ошибка: "Port 8000 not accessible"

```bash
# Проверьте firewall
ssh root@89.23.99.74
sudo ufw status
sudo ufw allow 8000/tcp
sudo ufw reload
```

### Container не стартует

```bash
# Проверьте логи
ssh deploy@89.23.99.74
cd /home/deploy/actionable-sentiment-backend
docker compose -f docker-compose.staging.yml logs api

# Проверьте права на database директорию
ls -la database/
chmod 777 database/
```

---

## Следующие шаги

1. ✅ Настроить staging сервер
2. ✅ Добавить GitHub Secrets
3. ✅ Протестировать деплой на staging
4. ✅ Протестировать приложение на staging
5. ✅ Создать PR develop → main
6. ✅ Задеплоить на production

---

## Дополнительные ресурсы

- 📖 [Полная инструкция по GitHub Secrets](./SETUP_GITHUB_SECRETS.md)
- 📖 [CLAUDE.md](../CLAUDE.md) - Development workflow
- 🔧 [Скрипт setup-staging-server.sh](../scripts/setup-staging-server.sh)

**Готово!** 🎉 Теперь у вас полноценный CI/CD pipeline с автоматическим деплоем на staging и production.
