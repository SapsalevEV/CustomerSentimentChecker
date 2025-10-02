# Actionable Sentiment Analysis Backend

Backend API для анализа отзывов клиентов банков.

## Технологический стек

- **Python 3.10+**
- **FastAPI** - Веб-фреймворк
- **SQLAlchemy 2.0** - ORM (асинхронный режим)
- **SQLite** - База данных (WAL режим)
- **Pydantic V2** - Валидация данных
- **Structlog** - Структурированное логирование
- **Uvicorn** - ASGI сервер

## Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd actionable-sentiment-backend
```

### 2. Создание виртуального окружения

```bash
python -m venv .venv
```

### 3. Активация виртуального окружения

**Windows (CMD):**
```bash
.venv\Scripts\activate
```

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

### 4. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 5. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте при необходимости:

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

## Запуск приложения

### Способ 1: Через uvicorn (рекомендуется)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Способ 2: Через готовые скрипты

**Windows (CMD):**
```bash
run_server.bat
```

**Windows (PowerShell):**
```powershell
.\run_server.ps1
```

### Способ 3: Через Python модуль

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Проверка работоспособности

После запуска сервер будет доступен по адресу: `http://localhost:8000`

### Health Check

```bash
curl http://localhost:8000/health
```

Ожидаемый ответ:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### API Документация

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Структура проекта

```
actionable-sentiment-backend/
├── app/
│   ├── api/              # API эндпоинты (роутеры)
│   │   └── v1/           # Версия API v1
│   ├── core/             # Конфигурация и базовые компоненты
│   │   ├── config.py     # Настройки приложения
│   │   ├── exceptions.py # Кастомные исключения
│   │   ├── logging.py    # Настройка логирования
│   │   └── mappings.py   # Маппинги БД↔API
│   ├── db/               # База данных
│   │   ├── base.py       # Базовая модель SQLAlchemy
│   │   └── session.py    # Управление сессиями
│   ├── middleware/       # Middleware
│   │   ├── error_handler.py       # Обработка ошибок
│   │   └── logging_middleware.py  # Логирование запросов
│   ├── models/           # SQLAlchemy модели
│   ├── repositories/     # Repository Pattern
│   ├── schemas/          # Pydantic схемы
│   ├── services/         # Бизнес-логика
│   ├── utils/            # Утилиты
│   └── main.py           # Главный файл приложения
├── database/             # Файлы БД
│   └── bank_reviews.db
├── docs/                 # Документация
├── tests/                # Тесты
├── .env.example          # Пример переменных окружения
├── .gitignore
├── requirements.txt      # Зависимости Python
└── README.md            # Этот файл
```

## Разработка

### Запуск с auto-reload

```bash
uvicorn app.main:app --reload
```

Флаг `--reload` автоматически перезапускает сервер при изменении кода.

### Структурированное логирование

Все логи выводятся в JSON формате для удобного анализа:

```json
{
  "event": "request_processed",
  "method": "GET",
  "url": "http://localhost:8000/health",
  "status_code": 200,
  "process_time_ms": 1.23,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

## Важные замечания

### ⚠️ НЕ запускайте main.py напрямую!

**Неправильно:**
```bash
python app/main.py  # ❌ Вызовет ModuleNotFoundError
```

**Правильно:**
```bash
uvicorn app.main:app --reload  # ✅ Корректный способ
```

FastAPI приложения должны запускаться через ASGI сервер (uvicorn), а не как обычные Python скрипты.

## API Эндпоинты

### Текущие эндпоинты

- `GET /health` - Health check

### Планируемые эндпоинты (в разработке)

- `GET /api/config` - Конфигурация фильтров
- `POST /api/dashboard/metrics` - Основные метрики
- `POST /api/dashboard/sentiment-dynamics` - Динамика тональности
- `POST /api/dashboard/critical-issues` - Критические проблемы
- `POST /api/search` - Полнотекстовый поиск

## Модели базы данных

Приложение использует SQLAlchemy ORM для работы с существующей SQLite БД. Все модели созданы в соответствии со структурой БД:

- **Source** - Источники отзывов (Banki.ru, Sravni.ru)
- **Sentiment** - Тональности (позитив, негатив, нейтральный)
- **Category** - Категории/аспекты (Карты, Кредиты, Приложение и т.д.)
- **Review** - Отзывы клиентов (⚠️ первичный ключ: `review_id`)
- **Annotation** - Аннотации отзывов (связь отзыва с категорией и тональностью)

## Тестирование

```bash
pytest tests/ -v --cov=app --cov-report=html
```

## База данных

- **Тип:** SQLite 3
- **Режим:** WAL (Write-Ahead Logging)
- **Расположение:** `database/bank_reviews.db`

### Текущие данные

- **Отзывы:** 1321
- **Аннотации:** 3568
- **Источники:** 2 (Banki.ru, Sravni.ru)
- **Категории:** ~30

## Production Deployment

### Quick Start (для исправления проблем)

Если деплой успешен, но сервер не отвечает:

```bash
# 1. Диагностика
ssh deploy@193.233.102.193 'bash -s' < scripts/diagnose-server.sh

# 2. Быстрое исправление
ssh deploy@193.233.102.193 'bash -s' < scripts/quick-fix.sh
```

### Документация по деплою

- **[QUICKSTART.md](QUICKSTART.md)** - быстрое решение проблем с деплоем
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - полное руководство по развертыванию
- **[scripts/README.md](scripts/README.md)** - описание скриптов диагностики

### Автоматический деплой

Приложение автоматически деплоится на production сервер при push в ветку `main` через GitHub Actions:

- **Production URL:** http://193.233.102.193:8000
- **API Docs:** http://193.233.102.193:8000/docs
- **Health:** http://193.233.102.193:8000/health

## Ссылки на документацию

- [Архитектура](docs/architecture.md)
- [API спецификация](docs/api.md)
- [Маппинг БД↔API](docs/database_api_mapping.md)
- [План реализации](docs/implementation_plan.md)
- [CLAUDE.md](CLAUDE.md) - инструкции для Claude Code

## Лицензия

MIT

## Контакты

Для вопросов и предложений создавайте issues в репозитории.

