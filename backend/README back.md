# 📚 Documentation Index

Документация проекта **Actionable Sentiment Backend**.

---

## 🚀 Быстрый старт

### Для разработчиков

- **[QUICKSTART_STAGING.md](./QUICKSTART_STAGING.md)** - Пошаговая настройка staging окружения
- **[SETUP_GITHUB_SECRETS.md](./SETUP_GITHUB_SECRETS.md)** - Настройка GitHub Secrets для CI/CD
- **[../CLAUDE.md](../CLAUDE.md)** - Руководство для разработки (tech stack, команды, best practices)

---

## 📋 Архитектура и дизайн

- **[architecture.md](./architecture.md)** - Архитектура приложения, структура кода, паттерны
- **[database_api_mapping.md](./database_api_mapping.md)** - Маппинги данных БД → API (критически важно!)

---

## 🔌 API Документация

- **[api.md](./api.md)** - Спецификация REST API v1
- **[CHANGELOG_API_v2.md](./CHANGELOG_API_v2.md)** - История изменений API

**Live документация:**
- Staging: http://89.23.99.74:8000/docs
- Production: http://193.233.102.193:8000/docs

---

## 🛠️ Deployment & DevOps

### CI/CD Pipeline

Проект использует **двухэтапный workflow**:

```
develop → STAGING (89.23.99.74)
   ↓
  test
   ↓
main → PRODUCTION (193.233.102.193)
```

### Guides

1. **Первичная настройка staging сервера:**
   - [QUICKSTART_STAGING.md](./QUICKSTART_STAGING.md)

2. **Настройка GitHub Secrets:**
   - [SETUP_GITHUB_SECRETS.md](./SETUP_GITHUB_SECRETS.md)

3. **Development workflow:**
   - [../CLAUDE.md](../CLAUDE.md) → раздел "Deployment"

### Workflows

- `.github/workflows/deploy-staging.yml` - Auto-deploy на staging при push в `develop`
- `.github/workflows/deploy.yml` - Auto-deploy на production при push в `main`

---

## 📖 Планирование и история

- **[implementation_plan.md](./implementation_plan.md)** - План реализации проекта
- **[review.md](./review.md)** - Ревью кода и архитектурные решения
- **[requir.md](./requir.md)** - Требования к проекту

---

## 🏗️ Структура проекта

```
actionable-sentiment-backend/
├── app/                      # Исходный код приложения
│   ├── api/v1/              # API endpoints (версия 1)
│   ├── core/                # Config, mappings, exceptions
│   ├── models/              # SQLAlchemy модели
│   ├── repositories/        # Data access layer
│   ├── schemas/             # Pydantic схемы
│   └── services/            # Business logic
├── database/                # SQLite база данных
├── docs/                    # Документация (вы здесь!)
├── scripts/                 # Utility scripts
│   └── setup-staging-server.sh
├── tests/                   # Тесты
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Production config
├── docker-compose.staging.yml  # Staging config
├── Dockerfile              # Docker образ
└── CLAUDE.md               # Dev guide
```

---

## 🔑 Ключевые концепции

### Environments

| Environment | IP | Branch | Docker Tag | Config File |
|------------|-----|--------|-----------|-------------|
| **STAGING** | 89.23.99.74 | `develop` | `api:develop` | `docker-compose.staging.yml` |
| **PRODUCTION** | 193.233.102.193 | `main` | `api:latest` | `docker-compose.yml` |

### Database Structure

- **Reviews**: `review_id` (PK), date, text, source_id
- **Annotations**: review_id (FK), category_id (FK), sentiment_id (FK)
- **Sources**: "Banki.ru", "Sravni.ru"
- **Categories**: ~30 категорий ("Карты", "Кредиты", etc.)
- **Sentiments**: "позитив", "негатив", "нейтральный"

⚠️ **Важно**: Primary key в Reviews - это `review_id`, НЕ `id`!

### Data Mappings

**Sentiments (DB → API):**
```python
"позитив" → "positive"
"негатив" → "negative"
"нейтральный" → "neutral"
```

**Sources (DB → API):**
```python
"Sravni.ru" → "irecommend"  # ← НЕ "sravni-ru"!
"Banki.ru" → "banki-ru"
```

Подробнее: [database_api_mapping.md](./database_api_mapping.md)

---

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_services/test_dashboard_service.py -v
```

---

## 🚀 Development Workflow

### 1. Local Development

```bash
# Запуск локально
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Или через Docker
docker-compose up --build
```

### 2. Deploy на Staging

```bash
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop

# Автоматический деплой на 89.23.99.74
# Проверить: http://89.23.99.74:8000/docs
```

### 3. Deploy на Production

```bash
# После тестирования на staging
git checkout main
git merge develop
git push origin main

# Автоматический деплой на 193.233.102.193
# Проверить: http://193.233.102.193:8000/docs
```

---

## 📞 Support & Links

- **GitHub Repository**: https://github.com/SapsalevEV/actionable-sentiment-backend
- **API Docs (Staging)**: http://89.23.99.74:8000/docs
- **API Docs (Production)**: http://193.233.102.193:8000/docs

---

## 📝 Contributing

1. Создайте feature branch от `develop`
2. Сделайте изменения
3. Напишите тесты
4. Push в `develop` → auto-deploy на staging
5. Тестируйте на staging
6. Создайте PR: `develop` → `main`
7. После мержа → auto-deploy на production

---

## 📄 License

[Добавьте информацию о лицензии]

---

**Последнее обновление:** 2025-10-02
