# 🎯 Следующие шаги после пуша изменений

Изменения запушены в `main` ветку. GitHub Actions автоматически запустит деплой.

## 1. Проверьте GitHub Actions

```bash
# Откройте в браузере
https://github.com/SapsalevEV/actionable-sentiment-backend/actions
```

Дождитесь, пока workflow завершится (обычно 2-5 минут).

## 2. После успешного деплоя проверьте доступность

```bash
# Health check
curl http://193.233.102.193:8000/health

# API Docs
curl http://193.233.102.193:8000/docs
```

## 3. Если деплой успешен, но сервер не отвечает

Это нормально - обновлённый `docker-compose.yml` был скопирован на сервер, но контейнеры нужно перезапустить.

**Вариант A: Автоматический (рекомендуется)**
```bash
ssh deploy@193.233.102.193 'bash -s' < scripts/fix-docker-image-path.sh
```

**Вариант B: Ручной**
```bash
ssh deploy@193.233.102.193 << 'EOF'
cd /home/deploy/actionable-sentiment-backend
docker-compose down
docker-compose up -d
docker-compose logs -f api
EOF
```

## 4. Если нужна диагностика

```bash
ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh
```

## Что изменилось

### ✅ docker-compose.yml
- Теперь использует явный путь: `ghcr.io/sapsalevev/actionable-sentiment-backend/api:latest`
- Не зависит от переменной `GITHUB_REPOSITORY`
- Фронтенд может использовать `GITHUB_REPOSITORY=esapsalev/actionable-sentiment` без конфликтов

### ✅ GitHub Actions workflow
- Убрана установка `export GITHUB_REPOSITORY=...`
- Образ собирается и пушится в правильный путь: `ghcr.io/sapsalevev/actionable-sentiment-backend/api:latest`

### ✅ Новые скрипты
- `scripts/fix-docker-image-path.sh` - автоматическое исправление
- `scripts/diagnose-server.sh` - полная диагностика сервера
- `scripts/quick-fix.sh` - быстрое исправление типичных проблем

### ✅ Документация
- `DEPLOYMENT_FIX.md` - инструкция по исправлению конфликта
- `QUICKSTART.md` - обновлена с новыми сценариями
- `scripts/README.md` - описание всех скриптов
- `CLAUDE.md` - добавлено пояснение о явных путях

## Ожидаемый результат

После выполнения всех шагов:

1. ✅ Бэкенд работает на http://193.233.102.193:8000
2. ✅ Фронтенд работает независимо (вероятно на http://193.233.102.193:3000)
3. ✅ Оба деплоятся через GitHub Actions без конфликтов
4. ✅ Переменная `GITHUB_REPOSITORY=esapsalev/actionable-sentiment` не влияет на бэкенд

## Troubleshooting

### "Access denied" при загрузке образа

Если образ в ghcr.io приватный:

**Вариант 1: Сделайте образ публичным**
1. https://github.com/SapsalevEV?tab=packages
2. Найдите `actionable-sentiment-backend/api`
3. Package settings → Change visibility → Public

**Вариант 2: Авторизуйтесь на сервере**
```bash
ssh deploy@193.233.102.193
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

**Вариант 3: Используйте локальную сборку**
```bash
ssh deploy@193.233.102.193 << 'EOF'
cd /home/deploy/actionable-sentiment-backend
docker-compose build
docker-compose up -d
EOF
```

### Порт 8000 не открыт

```bash
ssh deploy@193.233.102.193 "sudo ufw allow 8000/tcp && sudo ufw reload"
```

### Контейнер падает сразу после старта

```bash
# Смотрим логи
ssh deploy@193.233.102.193 "cd /home/deploy/actionable-sentiment-backend && docker-compose logs --tail=100 api"

# Проверяем базу данных
ssh deploy@193.233.102.193 "ls -lh /home/deploy/actionable-sentiment-backend/database/"
```

## Полезные ссылки

- **GitHub Actions**: https://github.com/SapsalevEV/actionable-sentiment-backend/actions
- **GitHub Packages**: https://github.com/SapsalevEV?tab=packages
- **Deployment docs**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture docs**: [CLAUDE.md](CLAUDE.md)

---

**Дата создания**: 2025-10-01
**Коммит**: `139b14a fix: use explicit image path in docker-compose.yml to avoid frontend conflict`
