# ОТЧЕТ О РЕВЬЮ ПРОЕКТА: Actionable Sentiment Backend

**Дата ревью:** 2025-10-01
**Версия:** 1.0
**Ревьюер:** Claude Code
**Референсный документ:** `docs/api.md` (требования от фронтэнда)

---

## EXECUTIVE SUMMARY

**Текущий статус:** Проект на **23% готовности** (Этап 2 из 7)
**Критичность:** ВЫСОКАЯ - обнаружены критические несоответствия с требованиями API
**Готовность к интеграции:** НЕ ГОТОВ - API эндпоинты отсутствуют, маппинги некорректны

**Ключевые проблемы:**
1. КРИТИЧНО: Ошибки в маппингах products/sources (несоответствие api.md)
2. КРИТИЧНО: API эндпоинты не реализованы (0% функциональности)
3. СРЕДНЕ: Зависимости не установлены в окружении
4. НИЗКО: Документация частично рассинхронизирована

---

## ТЕКУЩИЙ СТАТУС ПРОЕКТА

### Завершенные этапы

#### **Этап 0: Подготовка окружения** (100% завершен)
- ВЫПОЛНЕНО: `requirements.txt` создан с корректными зависимостями
- ВЫПОЛНЕНО: Git инициализирован
- ВЫПОЛНЕНО: `.env.example` создан
- ВЫПОЛНЕНО: `.gitignore` настроен
- ПРОБЛЕМА: Виртуальное окружение не активировано, зависимости не установлены

#### **Этап 1: Структура проекта и базовая конфигурация** (100% завершен)
- ВЫПОЛНЕНО: Полная структура каталогов создана
- ВЫПОЛНЕНО: `app/core/config.py` - конфигурация приложения (Pydantic BaseSettings)
- ВЫПОЛНЕНО: `app/core/logging.py` - Structlog настроен
- ВЫПОЛНЕНО: `app/core/exceptions.py` - иерархия исключений
- ВЫПОЛНЕНО: `app/core/mappings.py` - маппинги БД-API (**с критическими ошибками!**)
- ВЫПОЛНЕНО: `app/middleware/logging_middleware.py` - логирование запросов
- ВЫПОЛНЕНО: `app/middleware/error_handler.py` - глобальная обработка ошибок
- ВЫПОЛНЕНО: `app/main.py` - FastAPI приложение с lifespan, CORS, middleware

#### **Этап 2: Модели SQLAlchemy для существующей БД** (100% завершен)
- ВЫПОЛНЕНО: `app/db/base.py` - базовая модель
- ВЫПОЛНЕНО: `app/db/session.py` - async session management, SQLite оптимизация
- ВЫПОЛНЕНО: Все 5 моделей созданы:
  - `app/models/review.py` (**критически важно:** использует `review_id` как PK)
  - `app/models/annotation.py`
  - `app/models/source.py`
  - `app/models/category.py`
  - `app/models/sentiment.py`
- ВЫПОЛНЕНО: Relationships настроены корректно
- ВЫПОЛНЕНО: Alembic инициализирован
- ВЫПОЛНЕНО: Пустая базовая миграция создана (`57e09c979d8c_existing_database_schema.py`)

### Незавершенные этапы

#### **Этап 3: Repository Pattern + Схемы Pydantic + `/config`** (0% завершен)
**Отсутствуют:**
- НЕТ: `app/repositories/base.py`
- НЕТ: `app/repositories/config_repository.py`
- НЕТ: `app/schemas/config.py`
- НЕТ: `app/schemas/filters.py`
- НЕТ: `app/services/config_service.py`
- НЕТ: `app/api/v1/config.py`
- НЕТ: `app/api/deps.py`

#### **Этап 4: Dashboard API** (0% завершен)
- НЕТ: POST `/api/dashboard/overview` - не реализован
- НЕТ: DashboardRepository - нет
- НЕТ: AggregationService - нет
- НЕТ: Pydantic схемы для dashboard - нет

#### **Этапы 5-7** (0% завершен)
- Поиск, тесты, production настройки - не начаты

---

## АНАЛИЗ СИНХРОНИЗАЦИИ ДОКУМЕНТАЦИИ

### Проверенные документы:
1. `docs/api.md` - **РЕФЕРЕНСНЫЙ** (требования от фронтэнда)
2. `docs/architecture.md` - архитектурный план
3. `docs/database_api_mapping.md` - правила маппинга БД-API
4. `docs/implementation_plan.md` - план работ по этапам

### Что синхронизировано:

1. **api.md и architecture.md:**
   - СОВПАДАЕТ: Структура эндпоинта POST `/api/dashboard/overview`
   - СОВПАДАЕТ: Формат метрик (current, trend, sparkline)
   - СОВПАДАЕТ: Структура sentiment_dynamics
   - СОВПАДАЕТ: Бизнес-логика расчета трендов

2. **api.md и database_api_mapping.md:**
   - СОВПАДАЕТ: Формула расчета sentiment score
   - СОВПАДАЕТ: SQL-запросы для агрегаций корректны
   - СОВПАДАЕТ: Логика расчета sparkline (последние 7 дней)
   - СОВПАДАЕТ: Топ-3 темы дня - описано одинаково

3. **Код и architecture.md:**
   - СОВПАДАЕТ: Структура слоев реализована (API -> Service -> Repository -> Models)
   - СОВПАДАЕТ: Модели БД точно соответствуют описанию
   - СОВПАДАЕТ: Middleware настроены согласно архитектуре
   - СОВПАДАЕТ: Repository Pattern заложен в структуру проекта

---

## КРИТИЧЕСКИЕ НЕСООТВЕТСТВИЯ

### КРИТИЧНО #1: Products mapping некорректен

**Локация:** `app/core/mappings.py:17-24`

**api.md требует** (строки 74-76):
```json
"products": ["credit-cards", "debit-cards", "mortgage", "auto-loan",
             "consumer-loan", "deposits", "savings", "mobile-app",
             "online-banking", "support"]
```

**Код реализует:**
```python
PRODUCT_TO_CATEGORY_MAPPING = {
    "cards": ["Карты", "Кэшбэк / Бонусы", "Карточная служба"],      # НЕПРАВИЛЬНО
    "credits": ["Кредиты", "Процентные ставки"],                     # НЕПРАВИЛЬНО
    "deposits": ["Вклады"],                                           # ПРАВИЛЬНО
    "insurance": ["Договоры страхования жизни"],                     # ЛИШНИЙ КЛЮЧ
    "service": ["Обслуживание в офисе", "Банкоматы", "Курьерская служба"], # НЕПРАВИЛЬНО
    "app": ["Приложение"],                                           # НЕПРАВИЛЬНО
}
```

**Отсутствуют ключи:**
- `credit-cards` (вместо этого `cards` и `credits`)
- `debit-cards`
- `mortgage`
- `auto-loan`
- `consumer-loan`
- `savings`
- `mobile-app` (вместо этого `app`)
- `online-banking`
- `support` (вместо этого `service`)

**Последствия:**
- БЛОКЕР: Фронтэнд отправит фильтр `{"products": ["credit-cards"]}` -> бэкенд не найдет маппинг
- БЛОКЕР: Запросы с фильтрами **НЕ БУДУТ РАБОТАТЬ**
- БЛОКЕР: Интеграция с фронтэндом **ЗАБЛОКИРОВАНА**

**database_api_mapping.md корректен** (строки 47-73) - там правильные ключи указаны!

**Требуемое исправление:**
```python
PRODUCT_TO_CATEGORY_MAPPING = {
    "credit-cards": ["Карты", "Кредиты", "Процентные ставки"],
    "debit-cards": ["Карты", "Кэшбэк / Бонусы"],
    "mortgage": ["Кредиты", "Процентные ставки"],
    "auto-loan": ["Кредиты"],
    "consumer-loan": ["Кредиты"],
    "deposits": ["Вклады"],
    "savings": ["Вклады"],
    "mobile-app": ["Приложение"],
    "online-banking": ["Приложение"],
    "support": ["Обслуживание в офисе", "Курьерская служба"],
}
```

---

### КРИТИЧНО #2: Sources mapping некорректен

**Локация:** `app/core/mappings.py:27-30`

**api.md требует** (строка 72):
```json
"sources": ["app-store", "google-play", "banki-ru", "irecommend",
            "social-vk", "social-telegram", "reviews-site"]
```

**database_api_mapping.md указывает** (строки 87-91):
```
| БД        | API value  |
|-----------|------------|
| Banki.ru  | banki-ru   |  ПРАВИЛЬНО
| Sravni.ru | irecommend |  ПРАВИЛЬНО
```

**Код реализует:**
```python
SOURCE_DB_TO_API = {
    "Banki.ru": {"value": "banki-ru", "label": "Banki.ru"},    # ПРАВИЛЬНО
    "Sravni.ru": {"value": "sravni-ru", "label": "Sravni.ru"}  # НЕПРАВИЛЬНО: Должно быть "irecommend"!
}
```

**Проблемы:**
1. ОШИБКА: `"Sravni.ru"` -> `"sravni-ru"` вместо `"irecommend"` (конфликт с api.md и mapping.md)
2. ПРОБЛЕМА: Структура `{"value": ..., "label": ...}` - избыточна для маппинга (нужна только для GET /config response)
3. ОТСУТСТВУЕТ: Обратный маппинг `SOURCE_API_TO_DB` для обработки фильтров от фронтэнда

**Последствия:**
- БЛОКЕР: Фронтэнд отправит `{"sources": ["irecommend"]}` -> бэкенд не сможет преобразовать в `"Sravni.ru"`
- БЛОКЕР: Фильтрация по источникам **НЕ БУДЕТ РАБОТАТЬ**

**Требуемое исправление:**
```python
# Простой маппинг для преобразования
SOURCE_DB_TO_API = {
    "Banki.ru": "banki-ru",
    "Sravni.ru": "irecommend"  # НЕ sravni-ru!
}

SOURCE_API_TO_DB = {v: k for k, v in SOURCE_DB_TO_API.items()}

# Для GET /config endpoint (используется отдельно в service layer):
def get_sources_for_config():
    return [
        {"value": "banki-ru", "label": "Banki.ru"},
        {"value": "irecommend", "label": "Sravni.ru"}
    ]
```

---

### СРЕДНЕ #3: Функция get_categories_for_products неполная

**Локация:** `app/core/mappings.py:33-45`

**Текущая реализация:**
```python
def get_categories_for_products(products: List[str]) -> List[str]:
    categories = []
    for product in products:
        categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
    return categories
```

**Проблемы:**
1. ПРОБЛЕМА: Возвращает дубликаты (если "Карты" входит в credit-cards и debit-cards)
2. ПРОБЛЕМА: Нет обработки пустого списка ([] = все продукты)

**database_api_mapping.md предлагает** (строка 263):
```python
return list(set(categories))  # Убрать дубликаты
```

**Требуемое исправление:**
```python
def get_categories_for_products(products: List[str]) -> List[str]:
    """Get database categories for list of API products.

    Args:
        products: List of product identifiers from API

    Returns:
        List of unique category names from database

    Note:
        Empty list [] means "all products" - no filter applied
    """
    if not products:  # Пустой список = все продукты
        return []

    categories = []
    for product in products:
        categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
    return list(set(categories))  # Убрать дубликаты
```

---

### НИЗКО #4: Отсутствует функция get_db_source_names

**database_api_mapping.md упоминает** (строки 265-267):
```python
def get_db_source_names(api_sources: List[str]) -> List[str]:
    """Преобразовать API source names в БД source names"""
    return [SOURCE_API_TO_DB.get(src, src) for src in api_sources]
```

**В коде:** Функция отсутствует

**Последствия:** Каждый service/repository будет дублировать эту логику

**Требуемое исправление:** Добавить функцию в `app/core/mappings.py`

---

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ РЕАЛИЗАЦИИ

### 1. API эндпоинты полностью отсутствуют

```bash
$ ls -la app/api/v1/
total 8
-rw-rw-r-- 1 devuser devuser 0 Oct  1 04:15 __init__.py
```

**Проблема:** Директория пустая, никаких роутеров нет!

**Требуется:**
- `app/api/v1/config.py` - GET /api/config
- `app/api/v1/dashboard.py` - POST /api/dashboard/overview

**Текущий функционал:**
- ТОЛЬКО: health check (`GET /health`) в `app/main.py:57`

---

### 2. Repositories, Services, Schemas - пустые

```bash
$ ls -la app/repositories/
-rw-rw-r-- 1 devuser devuser 0 Oct  1 04:15 __init__.py

$ ls -la app/services/
-rw-rw-r-- 1 devuser devuser 0 Oct  1 04:15 __init__.py

$ ls -la app/schemas/
-rw-rw-r-- 1 devuser devuser 0 Oct  1 04:15 __init__.py
```

**Проблема:** Слои бизнес-логики и доступа к данным не реализованы

**Последствия:** Невозможно создать API эндпоинты без этих компонентов

---

### 3. Зависимости не установлены в окружении

```bash
$ uvicorn app.main:app --help
uvicorn: command not found
```

**Проблема:** Виртуальное окружение не активировано или зависимости не установлены

**Последствия:** Проект не запускается, нет возможности тестировать

**Требуется:**
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

---

### 4. CLAUDE.md не содержит критических моментов про маппинги

**CLAUDE.md создан**, но не содержит предупреждений о:
- Критичности точного соответствия products/sources API требованиям
- Необходимости синхронизации с api.md при изменениях
- Примеров корректного использования маппингов

**Рекомендация:** Добавить секцию "Critical API Mapping Rules"

---

## ПРОГРЕСС ОТНОСИТЕЛЬНО ПЛАНА РАБОТ

**Референс:** `docs/implementation_plan.md`

| Этап | Описание | План (часы) | Факт | Статус |
|------|----------|-------------|------|--------|
| **0** | Подготовка окружения и изучение БД | 2 | ВЫПОЛНЕНО | **100%** |
| **1** | Структура проекта + конфигурация | 4 | ВЫПОЛНЕНО | **100%** |
| **2** | Модели SQLAlchemy для существующей БД | 4 | ВЫПОЛНЕНО | **100%** |
| **3** | Repository Pattern + Схемы + /config | 6 | НЕТ | **0%** |
| **4** | Dashboard Overview API | 10 | НЕТ | **0%** |
| **5** | Полнотекстовый поиск (опционально) | 4 | НЕТ | **0%** |
| **6** | Тестирование | 8 | НЕТ | **0%** |
| **7** | Оптимизация, мониторинг, Docker | 5 | НЕТ | **0%** |

**Итого выполнено:** 10 из 43 часов = **23%**

**До MVP (Этапы 0-4):** Осталось 16 часов работы

**До Production Ready:** Осталось 33 часа работы

---

## ПРИОРИТЕЗИРОВАННЫЕ РЕКОМЕНДАЦИИ

### P0 - КРИТИЧНО (сделать СЕГОДНЯ)

#### 1. Исправить PRODUCT_TO_CATEGORY_MAPPING
**Локация:** `app/core/mappings.py:17`

**Текущий код:**
```python
PRODUCT_TO_CATEGORY_MAPPING = {
    "cards": [...],  # НЕПРАВИЛЬНЫЙ КЛЮЧ
    "credits": [...],  # НЕПРАВИЛЬНЫЙ КЛЮЧ
    ...
}
```

**Исправить на:**
```python
PRODUCT_TO_CATEGORY_MAPPING = {
    "credit-cards": ["Карты", "Кредиты", "Процентные ставки"],
    "debit-cards": ["Карты", "Кэшбэк / Бонусы"],
    "mortgage": ["Кредиты", "Процентные ставки"],
    "auto-loan": ["Кредиты"],
    "consumer-loan": ["Кредиты"],
    "deposits": ["Вклады"],
    "savings": ["Вклады"],
    "mobile-app": ["Приложение"],
    "online-banking": ["Приложение"],
    "support": ["Обслуживание в офисе", "Курьерская служба"],
}
```

**Критичность:** Без этого интеграция с фронтэндом невозможна!

---

#### 2. Исправить SOURCE маппинг
**Локация:** `app/core/mappings.py:27`

**Исправить на:**
```python
# Маппинг для преобразования БД <-> API
SOURCE_DB_TO_API = {
    "Banki.ru": "banki-ru",
    "Sravni.ru": "irecommend"  # БЫЛО "sravni-ru" - НЕПРАВИЛЬНО!
}

SOURCE_API_TO_DB = {v: k for k, v in SOURCE_DB_TO_API.items()}
```

---

#### 3. Добавить вспомогательные функции
**Локация:** `app/core/mappings.py` (конец файла)

```python
def get_categories_for_products(products: List[str]) -> List[str]:
    """Get unique database categories for list of API products.

    Empty list [] means no filter - return empty list.
    """
    if not products:
        return []

    categories = []
    for product in products:
        categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
    return list(set(categories))  # Remove duplicates


def get_db_source_names(api_sources: List[str]) -> List[str]:
    """Transform API source names to DB source names.

    Empty list [] means no filter - return empty list.
    """
    if not api_sources:
        return []

    return [SOURCE_API_TO_DB.get(src, src) for src in api_sources]
```

---

#### 4. Установить зависимости
```bash
cd /home/devuser/projects/actionable-sentiment-backend

# Создать виртуальное окружение (если еще нет)
python -m venv .venv

# Активировать
source .venv/bin/activate  # Linux/Mac
# ИЛИ
.venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Проверить
uvicorn app.main:app --help
```

---

### P1 - ВЫСОКИЙ ПРИОРИТЕТ (следующие 2-3 дня)

#### 5. Реализовать Этап 3: Config API

**Порядок действий:**

1. **Создать базовый репозиторий:**
   - `app/repositories/base.py`

2. **Создать config репозиторий:**
   - `app/repositories/config_repository.py`

3. **Создать Pydantic схемы:**
   - `app/schemas/config.py` (SourceSchema, ProductSchema, ConfigResponse)
   - `app/schemas/filters.py` (DateRangeSchema, FiltersSchema)

4. **Создать сервис:**
   - `app/services/config_service.py` (использует маппинги)

5. **Создать dependencies:**
   - `app/api/deps.py` (get_db, get_config_repository)

6. **Создать роутер:**
   - `app/api/v1/config.py` - GET /api/config с кэшированием

7. **Подключить роутер:**
   - Обновить `app/main.py` для подключения API v1 роутеров

**Результат:** Рабочий эндпоинт GET /api/config

**Время:** 6 часов согласно плану

---

#### 6. Обновить CLAUDE.md

Добавить секцию **"Critical API Mapping Rules"**:
```markdown
## Critical API Mapping Rules

### Products Mapping
ALWAYS use exact product IDs from api.md:
- ПРАВИЛЬНО: "credit-cards" (NOT "cards" or "credits")
- ПРАВИЛЬНО: "mobile-app" (NOT "app")
- ПРАВИЛЬНО: "support" (NOT "service")

See app/core/mappings.py:PRODUCT_TO_CATEGORY_MAPPING

### Sources Mapping
ALWAYS use exact source IDs from api.md:
- ПРАВИЛЬНО: "irecommend" for Sravni.ru (NOT "sravni-ru")

See app/core/mappings.py:SOURCE_DB_TO_API

### Sync with Frontend
Before deploying, verify mappings match docs/api.md (lines 72-76)
```

---

### P2 - СРЕДНИЙ ПРИОРИТЕТ

#### 7. Обновить database_api_mapping.md

Синхронизировать примеры кода с исправленными маппингами (строки 62-73, 95-101)

#### 8. Добавить в README.md статус проекта

```markdown
## Текущий статус

**Версия:** 0.2.0 (В разработке)
**Прогресс:** Этап 2 из 7 (23%)
**Функциональность:** Только health check

### Что работает:
- РАБОТАЕТ: Health check: GET /health
- РАБОТАЕТ: База данных подключена
- РАБОТАЕТ: Модели ORM настроены

### В разработке:
- В ПРОЦЕССЕ: Этап 3: Config API (GET /api/config)
- ОЖИДАНИЕ: Этап 4: Dashboard API (POST /api/dashboard/overview)
```

---

## КРИТИЧЕСКИЙ ПУТЬ К MVP

**Цель:** Рабочий эндпоинт POST /api/dashboard/overview для интеграции с фронтэндом

**Шаги:**

### Сегодня (2-3 часа):
1. ВЫПОЛНЕНО: Ревью завершено
2. КРИТИЧНО: Исправить маппинги products/sources (**30 минут**)
3. КРИТИЧНО: Установить зависимости (**15 минут**)
4. КРИТИЧНО: Протестировать запуск сервера (**15 минут**)
5. ВАЖНО: Создать базовый репозиторий (**1 час**)

### День 2-3 (6 часов):
6. Реализовать Этап 3: Config API (**6 часов**)
   - Repositories
   - Schemas
   - Services
   - Router GET /api/config

### День 4-7 (10 часов):
7. Реализовать Этап 4: Dashboard API (**10 часов**)
   - DashboardRepository с агрегациями
   - AggregationService (trends, sparkline)
   - Pydantic схемы для dashboard
   - Router POST /api/dashboard/overview

### Итого: примерно 16 часов чистой работы = MVP готов

---

## ВЫВОДЫ

### Позитивное:

1. **Фундамент заложен правильно:**
   - Архитектура соответствует best practices (Repository Pattern, слои)
   - Модели БД корректны (учтен нестандартный PK review_id)
   - Конфигурация, логирование, обработка ошибок реализованы
   - Middleware настроены

2. **Документация подробная:**
   - api.md - четкие требования от фронтэнда
   - architecture.md - детальная архитектура
   - database_api_mapping.md - SQL-запросы и маппинги
   - implementation_plan.md - пошаговый план

3. **Этапы 0-2 выполнены качественно:**
   - Структура проекта соответствует плану
   - Alembic настроен для будущих миграций
   - База данных оптимизирована (WAL mode, cache settings)

### Проблемное:

1. **Критические ошибки в маппингах:**
   - Products: используются неправильные ключи (cards вместо credit-cards)
   - Sources: Sravni.ru -> sravni-ru вместо irecommend
   - **Блокирует интеграцию с фронтэндом!**

2. **API функциональность отсутствует:**
   - 0% эндпоинтов реализовано
   - Repositories, Services, Schemas пустые
   - Невозможно тестировать интеграцию

3. **Окружение не готово:**
   - Зависимости не установлены
   - Проект не запускается
   - Невозможно проверить работоспособность

4. **Документация частично рассинхронизирована:**
   - Код не соответствует database_api_mapping.md
   - CLAUDE.md не содержит критических warnings

### Общий вердикт:

**Статус:** "Foundation Complete, Core Missing"

**Прогресс:** 23% (10 из 43 часов)

**Критичность ошибок:** ВЫСОКАЯ
- Маппинги блокируют интеграцию
- API отсутствует полностью

**Готовность к интеграции:** 0%
- Нет ни одного работающего API endpoint (кроме /health)
- Критические ошибки в маппингах

**Оценка до MVP:**
- С исправлениями: примерно 16 часов (2-3 дня работы)
- Без исправлений: Интеграция невозможна

---

## КРИТИЧЕСКИ ВАЖНО

**ПРИОРИТЕТ #1:** Исправить маппинги products/sources **СЕГОДНЯ**!

Без этого:
- ПРОБЛЕМА: Фронтэнд не сможет отправлять корректные фильтры
- ПРОБЛЕМА: Интеграция будет провалена
- ПРОБЛЕМА: Придется переделывать все endpoints после реализации

**Время на исправление:** 30 минут
**Риск если не исправить:** КРИТИЧЕСКИЙ - блокер интеграции

---

## СЛЕДУЮЩИЕ ШАГИ

1. **СЕГОДНЯ:** Исправить маппинги (app/core/mappings.py)
2. **СЕГОДНЯ:** Установить зависимости и запустить сервер
3. **ЗАВТРА:** Начать Этап 3 (Config API)
4. **Через 3 дня:** Этап 4 (Dashboard API)
5. **Через неделю:** MVP готов для интеграции

---

**Дата ревью:** 2025-10-01
**Следующий ревью:** После завершения Этапа 3 (Config API)
**Ответственный за исправления:** Backend team
**Deadline критических исправлений:** 2025-10-01 EOD
