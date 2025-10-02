### **Архитектурный план: Бэкэнд для "Actionable Sentiment Analysis"**

---

### **1. Введение**

Этот документ описывает архитектуру бэкэнд-сервиса для дашборда по аналитике отзывов клиентов. Система предназначена для сбора, обработки и предоставления данных через REST API для фронтэнд-приложения. Основные цели архитектуры — надежность, масштабируемость, производительность и простота поддержки.

### **2. Технологический стек**

| Компонент              | Технология                                                              | Обоснование                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Язык программирования** | Python 3.10+                                                            | Современный, производительный, с обширной экосистемой библиотек для веб-разработки и анализа данных.                                                                     |
| **Веб-фреймворк**        | [FastAPI](https://fastapi.tiangolo.com/)                                | Высокопроизводительный асинхронный фреймворк. Автоматическая генерация документации OpenAPI, валидация данных с помощью Pydantic, система внедрения зависимостей.         |
| **Веб-сервер**           | [Uvicorn](https://www.uvicorn.org/) + [Gunicorn](https://gunicorn.org/) | Стандартный асинхронный ASGI-сервер для FastAPI. Gunicorn используется как менеджер процессов в production-среде.                                                       |
| **База данных**          | [SQLite](https://www.sqlite.org/index.html) (WAL mode)                  | Простая, файловая СУБД, указанная в требованиях. WAL mode для поддержки concurrent reads. Поддержка FTS5 для полнотекстового поиска.                                |
| **ORM / Query Builder**  | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async)                   | Мощный инструмент для работы с базами данных. Поддерживает асинхронные запросы (`asyncio`), что идеально сочетается с FastAPI.                                            |
| **Валидация данных**     | [Pydantic V2](https://docs.pydantic.dev/latest/)                        | Используется FastAPI "под капотом". Обеспечивает строгую типизацию и валидацию для всех входящих и исходящих данных API.                                                |
| **Миграции БД**          | [Alembic](https://alembic.sqlalchemy.org/en/latest/)                    | Инструмент для управления миграциями схемы базы данных, тесно интегрированный с SQLAlchemy.                                                                           |
| **Тестирование**         | [Pytest](https://docs.pytest.org/en/7.2.x/) + [HTTPX](https://www.python-httpx.org/) | Стандарт для тестирования в Python. HTTPX позволяет выполнять асинхронные HTTP-запросы к API в тестах.                                                                  |
| **Кэширование**          | [FastAPI-Cache2](https://github.com/long2ice/fastapi-cache2)            | Для кэширования ответов от ресурсоемких эндпоинтов. Использует in-memory бэкенд (может быть расширен до Redis).                                                      |
| **Логирование**          | [Structlog](https://www.structlog.org/)                                 | Структурированное логирование для удобного анализа и мониторинга. Поддержка JSON-формата для интеграции с ELK/Loki.                                                    |
| **Мониторинг**           | [Prometheus](https://prometheus.io/) + FastAPI metrics                  | Сбор метрик производительности (latency, throughput, error rates). Интеграция через prometheus-fastapi-instrumentator.                                                |
| **Контейнеризация**      | [Docker](https://www.docker.com/)                                       | Для создания консистентных окружений для разработки и развертывания.                                                                                                    |

### **3. Архитектура приложения**

Приложение будет построено на основе **многоуровневой (слоеной) архитектуры** с применением **Repository Pattern**, чтобы обеспечить разделение ответственности (Separation of Concerns) и упростить тестирование.

#### **Слои архитектуры:**

*   **Слой представления (API Layer):** Отвечает за прием HTTP-запросов, их валидацию и отправку ответов. Реализуется с помощью роутеров FastAPI.
*   **Слой бизнес-логики (Service Layer):** Содержит основную логику приложения. Обрабатывает данные, вызывает методы репозиториев, выполняет агрегацию и расчеты.
*   **Слой репозиториев (Repository Layer):** Инкапсулирует все взаимодействия с базой данных. Каждая сущность имеет свой репозиторий с методами для CRUD операций и специфичных запросов.
*   **Слой моделей (Model Layer):** SQLAlchemy модели, отражающие структуру базы данных.

#### **Структура проекта**

```
/actionable-sentiment-backend
├── app/                      # Основной код приложения
│   ├── api/                  # API эндпоинты (роутеры)
│   │   ├── deps.py           # Зависимости для роутеров (DB session, auth, etc.)
│   │   └── v1/               # Версия API v1
│   │       ├── __init__.py
│   │       ├── dashboard.py  # Роутер для POST /dashboard/overview
│   │       ├── config.py     # Роутер для GET /config (если требуется)
│   │       └── search.py     # Роутер для /search (опционально)
│   ├── core/                 # Основная конфигурация и настройки
│   │   ├── config.py         # Настройки приложения (Pydantic BaseSettings)
│   │   ├── logging.py        # Конфигурация логирования
│   │   ├── security.py       # CORS, middleware для безопасности
│   │   └── exceptions.py     # Кастомные исключения
│   ├── db/                   # Все, что связано с БД
│   │   ├── base.py           # Базовая декларативная модель SQLAlchemy
│   │   ├── session.py        # Управление сессиями БД
│   │   └── init_db.py        # Инициализация БД, seed данные
│   ├── models/               # Модели данных SQLAlchemy
│   │   ├── __init__.py
│   │   ├── review.py         # Модель Review
│   │   ├── annotation.py     # Модель Annotation
│   │   ├── source.py         # Модель Source (справочник источников)
│   │   ├── category.py       # Модель Category (категории/аспекты)
│   │   └── sentiment.py      # Модель Sentiment (тональности)
│   ├── repositories/         # Репозитории для работы с БД
│   │   ├── __init__.py
│   │   ├── base.py           # Базовый репозиторий с CRUD операциями
│   │   ├── review_repository.py
│   │   ├── config_repository.py
│   │   └── dashboard_repository.py
│   ├── schemas/              # Схемы данных Pydantic
│   │   ├── __init__.py
│   │   ├── dashboard.py      # Схемы для /dashboard/overview (OverviewResponse, MetricSchema, etc.)
│   │   ├── config.py         # Схемы для конфигурации (опционально)
│   │   ├── search.py         # Схемы для поиска (опционально)
│   │   ├── filters.py        # Схемы для фильтров (DateRange, FilterParams)
│   │   └── common.py         # Общие схемы и утилиты
│   ├── services/             # Слой бизнес-логики
│   │   ├── __init__.py
│   │   ├── dashboard_service.py  # Логика для дашборда
│   │   ├── config_service.py     # Логика для конфигурации
│   │   ├── search_service.py     # Логика для поиска
│   │   └── aggregation_service.py # Утилиты для агрегации данных
│   ├── middleware/           # Кастомные middleware
│   │   ├── __init__.py
│   │   ├── logging_middleware.py  # Логирование запросов
│   │   └── error_handler.py       # Глобальная обработка ошибок
│   └── main.py               # Главный файл приложения FastAPI
│
├── database/                 # Файлы БД
│   └── bank_reviews.db
│
├── docs/                     # Документация
│   ├── api.md
│   ├── requir.md
│   └── architecture.md       # Этот файл
│
├── tests/                    # Тесты
│   ├── conftest.py
│   ├── test_api/
│   ├── test_services/
│   └── test_repositories/
│
├── alembic/                  # Миграции базы данных
│   └── versions/
│
├── .env                      # Файл с переменными окружения
├── .env.example              # Пример конфигурации
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── requirements-dev.txt      # Зависимости для разработки
└── README.md
```

### **4. Детальная схема базы данных**

> **Примечание:** Данная схема отражает существующую структуру базы данных `bank_reviews.db`.  
> **Статистика:** 1321 отзыв, 3568 аннотаций, 2 источника, множество категорий.

#### **4.1. Основные таблицы**

**Таблица `reviews`** - Хранит отзывы клиентов банка
```sql
CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY,          -- Уникальный идентификатор отзыва
    date DATE NOT NULL,                     -- Дата отзыва
    text TEXT NOT NULL,                     -- Полный текст отзыва
    source_id INTEGER NOT NULL,             -- FK к таблице sources
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id)
);
```
**Особенности:**
- Используется `review_id` вместо стандартного `id`
- Один отзыв может иметь несколько аннотаций для разных категорий
- Текущие данные: 1321 отзыв

**Таблица `annotations`** - Аннотации отзывов (связь с категориями и тональностью)
```sql
CREATE TABLE annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,             -- FK к таблице reviews
    category_id INTEGER NOT NULL,           -- FK к таблице categories (аспект анализа)
    sentiment_id INTEGER NOT NULL,          -- FK к таблице sentiments
    summary TEXT NOT NULL,                  -- Краткое описание проблемы/темы
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (sentiment_id) REFERENCES sentiments(id)
);
```
**Особенности:**
- Модель "многие-ко-многим" между reviews и categories
- Каждая аннотация имеет свою тональность (позитив/негатив/нейтральный)
- Summary содержит краткое описание упоминания категории в отзыве
- Текущие данные: 3568 аннотаций

**Таблица `sources`** - Справочник источников отзывов
```sql
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- Название источника
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Текущие данные:**
- `Banki.ru` - отзывы с сайта Banki.ru
- `Sravni.ru` - отзывы с сайта Sravni.ru

**Таблица `categories`** - Справочник категорий/аспектов для анализа
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- Название категории
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Примеры категорий:**
- Банкоматы
- Вклады
- Договоры страхования жизни
- Карточная служба
- Карты
- Кредиты
- Курьерская служба
- Кэшбэк / Бонусы
- Обслуживание в офисе
- Приложение
- Процентные ставки
- ... и другие

**Таблица `sentiments`** - Справочник тональностей
```sql
CREATE TABLE sentiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,              -- Название тональности
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Значения:**
- `позитив` (id: 1)
- `негатив` (id: 2)
- `нейтральный` (id: 3)

#### **4.2. Индексы для оптимизации запросов**

```sql
-- Индексы на таблице reviews
CREATE INDEX idx_reviews_date ON reviews(date);
CREATE INDEX idx_reviews_source ON reviews(source_id);

-- Индексы на таблице annotations
CREATE INDEX idx_annotations_review ON annotations(review_id);
CREATE INDEX idx_annotations_category ON annotations(category_id);
CREATE INDEX idx_annotations_sentiment ON annotations(sentiment_id);

-- Композитные индексы для сложных запросов
CREATE INDEX idx_annotations_review_category ON annotations(review_id, category_id);
CREATE INDEX idx_annotations_category_sentiment ON annotations(category_id, sentiment_id);
```

#### **4.3. Аналитические представления (Views)**

База данных содержит набор предустановленных представлений для аналитики:

**`category_statistics`** - Статистика по категориям
```sql
CREATE VIEW category_statistics AS
SELECT
    c.name AS category,
    COUNT(a.id) AS total_mentions,
    COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) AS positive_mentions,
    COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) AS negative_mentions,
    COUNT(CASE WHEN sent.name = 'нейтральный' THEN 1 END) AS neutral_mentions,
    ROUND(100.0 * COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) / COUNT(a.id), 2) AS positive_percentage,
    ROUND(100.0 * COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) / COUNT(a.id), 2) AS negative_percentage
FROM categories c
LEFT JOIN annotations a ON c.id = a.category_id
LEFT JOIN sentiments sent ON a.sentiment_id = sent.id
GROUP BY c.id, c.name
HAVING COUNT(a.id) > 0
ORDER BY total_mentions DESC;
```

**`problematic_categories`** - Проблемные категории с высоким процентом негатива
```sql
CREATE VIEW problematic_categories AS
SELECT
    c.name AS category,
    COUNT(a.id) AS total_mentions,
    COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) AS negative_mentions,
    ROUND(100.0 * COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) / COUNT(a.id), 2) AS negative_percentage
FROM categories c
JOIN annotations a ON c.id = a.category_id
JOIN sentiments sent ON a.sentiment_id = sent.id
GROUP BY c.id, c.name
HAVING COUNT(a.id) >= 10
ORDER BY negative_percentage DESC, total_mentions DESC;
```

**`reviews_timeline`** - Временная динамика отзывов
```sql
CREATE VIEW reviews_timeline AS
SELECT
    DATE(r.date) AS review_date,
    strftime('%Y-%m', r.date) AS year_month,
    COUNT(DISTINCT r.review_id) AS reviews_count,
    COUNT(a.id) AS annotations_count,
    COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) AS positive_annotations,
    COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) AS negative_annotations,
    ROUND(100.0 * COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN sent.name IN ('позитив', 'негатив') THEN 1 END), 0), 2) AS positive_ratio
FROM reviews r
LEFT JOIN annotations a ON r.review_id = a.review_id
LEFT JOIN sentiments sent ON a.sentiment_id = sent.id
GROUP BY DATE(r.date), strftime('%Y-%m', r.date)
ORDER BY review_date;
```

**`source_comparison`** - Сравнение источников
```sql
CREATE VIEW source_comparison AS
SELECT
    s.name AS source,
    COUNT(DISTINCT r.review_id) AS total_reviews,
    COUNT(a.id) AS total_annotations,
    ROUND(1.0 * COUNT(a.id) / COUNT(DISTINCT r.review_id), 2) AS avg_annotations_per_review,
    COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) AS positive_annotations,
    COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) AS negative_annotations,
    ROUND(100.0 * COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) / 
          NULLIF(COUNT(CASE WHEN sent.name IN ('позитив', 'негатив') THEN 1 END), 0), 2) AS positive_ratio
FROM sources s
LEFT JOIN reviews r ON s.id = r.source_id
LEFT JOIN annotations a ON r.review_id = a.review_id
LEFT JOIN sentiments sent ON a.sentiment_id = sent.id
GROUP BY s.id, s.name
ORDER BY total_reviews DESC;
```

**`review_sentiment_summary`** - Общая тональность каждого отзыва
```sql
CREATE VIEW review_sentiment_summary AS
SELECT
    r.review_id,
    r.date,
    s.name AS source,
    SUBSTR(r.text, 1, 100) || '...' AS preview,
    COUNT(a.id) AS total_annotations,
    COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) AS positive_count,
    COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) AS negative_count,
    COUNT(CASE WHEN sent.name = 'нейтральный' THEN 1 END) AS neutral_count,
    CASE
        WHEN COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) >
             COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) THEN 'Преимущественно позитивный'
        WHEN COUNT(CASE WHEN sent.name = 'негатив' THEN 1 END) >
             COUNT(CASE WHEN sent.name = 'позитив' THEN 1 END) THEN 'Преимущественно негативный'
        ELSE 'Смешанный/Нейтральный'
    END AS overall_sentiment
FROM reviews r
LEFT JOIN annotations a ON r.review_id = a.review_id
LEFT JOIN sources s ON r.source_id = s.id
LEFT JOIN sentiments sent ON a.sentiment_id = sent.id
GROUP BY r.review_id, r.date, s.name, r.text;
```

**Дополнительные представления:**
- `category_sentiment_details` - детализация по категориям и тональностям
- `review_details` - детальная информация по отзывам
- `review_length_stats` - статистика по длине отзывов
- `reviews_without_annotations` - отзывы без аннотаций

#### **4.4. Модель данных - диаграмма связей**

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   reviews   │         │ annotations  │         │ categories │
├─────────────┤         ├──────────────┤         ├────────────┤
│ review_id PK│◄────────│ id PK        │────────►│ id PK      │
│ date        │         │ review_id FK │         │ name UNIQUE│
│ text        │         │ category_id  │         └────────────┘
│ source_id FK│         │ sentiment_id │
│ created_at  │         │ summary      │         ┌────────────┐
└─────┬───────┘         │ created_at   │         │ sentiments │
      │                 └──────┬───────┘         ├────────────┤
      │                        │                 │ id PK      │
      │                        └────────────────►│ name UNIQUE│
      │                                          └────────────┘
      │                                           (позитив,
      │                                            негатив,
      │                                            нейтральный)
      │
      │                 ┌─────────┐
      └────────────────►│ sources │
                        ├─────────┤
                        │ id PK   │
                        │ name    │
                        └─────────┘
                         (Banki.ru,
                          Sravni.ru)
```

#### **4.5. Особенности текущей схемы**

**Преимущества:**
- ✅ Гибкая модель - один отзыв может относиться к нескольким категориям
- ✅ Детальная тональность - каждая категория в отзыве имеет свою оценку
- ✅ Summary для контекста - краткое описание упоминания
- ✅ Готовые аналитические представления для быстрых запросов
- ✅ Хорошая нормализация данных

**Ограничения и рекомендации:**
- ⚠️ Отсутствует FTS5 для полнотекстового поиска (нужно будет добавить)
- ⚠️ Нет таблицы для критических проблем (создается программно или нужна миграция)
- ⚠️ Категории не группируются (можно добавить поле `category_group`)
- ⚠️ Отсутствует информация о продуктах (кредиты, карты отдельно)

#### **4.6. Маппинг между схемой БД и требованиями API**

> **Важно:** Существующая структура БД и требования API фронтэнда не совпадают напрямую. Необходим слой трансформации данных.

**Несоответствия и решения:**

| API требование (api.md) | Существующая БД | Решение |
|-------------------------|-----------------|---------|
| `products` (credit-cards, debit-cards, mortgage) | `categories` (Карты, Кредиты, Вклады) | **Маппинг:** Создать виртуальное поле `product_category` через группировку категорий. Например: категории "Карты", "Кэшбэк/Бонусы" → product "cards" |
| `aspects` (Процентная ставка, Кешбэк/бонусы) | `categories` (используются как аспекты) | **Без изменений:** Categories = Aspects. Переименовать в коде для ясности |
| `sentiment` (positive, neutral, negative) | `sentiment.name` (позитив, негатив, нейтральный) | **Маппинг:** Транслировать на уровне сервиса: "позитив" → "positive" |
| `sentiment_score` (0-100) | Отсутствует | **Вычисление:** Рассчитывать на основе соотношения аннотаций: % позитивных аннотаций = score |
| `trendData` (массив за 7 дней) | `reviews.date` | **Агрегация:** Группировать по дням через SQL |
| `topics` (топ-3 темы дня) | `categories` через `annotations` | **Агрегация:** TOP 3 категории по количеству упоминаний за день |
| `critical_issues` (таблица проблем) | Отсутствует | **Создание:** Динамически генерировать из `problematic_categories` view |

**Пример маппинга Categories → Products:**

```python
# В сервисном слое
CATEGORY_TO_PRODUCT_MAPPING = {
    "cards": ["Карты", "Кэшбэк / Бонусы", "Карточная служба"],
    "credits": ["Кредиты", "Процентные ставки"],
    "deposits": ["Вклады"],
    "insurance": ["Договоры страхования жизни"],
    "service": ["Обслуживание в офисе", "Банкоматы", "Курьерская служба"],
    "app": ["Приложение"],
}

def map_category_to_product(category_name: str) -> str:
    """Маппинг категории БД на продукт API"""
    for product, categories in CATEGORY_TO_PRODUCT_MAPPING.items():
        if category_name in categories:
            return product
    return "other"
```

**Стратегия преобразования sentiment:**

```python
SENTIMENT_MAPPING = {
    "позитив": "positive",
    "негатив": "negative",
    "нейтральный": "neutral"
}

def calculate_sentiment_score(positive_count: int, neutral_count: int, negative_count: int) -> float:
    """
    Рассчитывает sentiment score (0-100)
    0-33: negative, 34-66: neutral, 67-100: positive
    """
    total = positive_count + neutral_count + negative_count
    if total == 0:
        return 50.0  # neutral по умолчанию
    
    # Weighted score: positive=100, neutral=50, negative=0
    score = (positive_count * 100 + neutral_count * 50) / total
    return round(score, 2)
```

**Генерация Critical Issues:**

```python
async def generate_critical_issues(db: AsyncSession, filters: FilterParams) -> List[CriticalIssue]:
    """
    Динамически генерирует критические проблемы из problematic_categories
    """
    # Запрос к problematic_categories view
    query = """
        SELECT 
            category,
            total_mentions as volume,
            negative_percentage,
            negative_mentions
        FROM problematic_categories
        WHERE negative_percentage > 50  -- Высокий процент негатива
        LIMIT 20
    """
    
    results = await db.execute(text(query))
    issues = []
    
    for row in results:
        issue = CriticalIssue(
            id=f"issue_{slugify(row.category)}",
            title=f"Проблемы с: {row.category}",
            impact=get_impact_level(row.negative_percentage),
            sentiment=100 - row.negative_percentage,
            volume=row.volume,
            trend=calculate_trend(row.category, filters.date_range),
            priority=get_priority(row.negative_percentage, row.volume),
            # ... остальные поля
        )
        issues.append(issue)
    
    return issues
```

### **5. Ключевые архитектурные решения**

#### **5.1. Асинхронность**
Все операции ввода-вывода (запросы к БД, внешние API) должны быть асинхронными (`async/await`), чтобы обеспечить высокую производительность под нагрузкой.

**Конфигурация SQLAlchemy:**
```python
engine = create_async_engine(
    "sqlite+aiosqlite:///./database/bank_reviews.db",
    echo=False,
    connect_args={"check_same_thread": False},
    execution_options={"isolation_level": "AUTOCOMMIT"}
)
```

#### **5.2. Repository Pattern**
Каждая сущность имеет свой репозиторий, наследующийся от базового:

```python
class BaseRepository:
    async def get_by_id(self, id: int)
    async def get_all(self, skip: int, limit: int)
    async def create(self, obj: dict)
    async def update(self, id: int, obj: dict)
    async def delete(self, id: int)

class ReviewRepository(BaseRepository):
    async def get_by_filters(self, filters: FilterParams) -> List[Review]
    async def get_with_annotations(self, review_id: int) -> Review
    async def get_reviews_with_sentiment_summary(self, filters: FilterParams) -> List[Dict]
    
class AnnotationRepository(BaseRepository):
    async def get_by_review_id(self, review_id: int) -> List[Annotation]
    async def get_by_category(self, category_id: int, filters: FilterParams) -> List[Annotation]
    async def get_sentiment_distribution(self, filters: FilterParams) -> Dict
    
class CategoryRepository(BaseRepository):
    async def get_statistics(self, filters: FilterParams) -> List[Dict]
    async def get_problematic_categories(self, threshold: float = 50.0) -> List[Dict]
    async def get_top_categories_by_date(self, date: datetime, limit: int = 3) -> List[str]

class DashboardRepository:
    """Специализированный репозиторий для сложных агрегаций"""
    async def get_overview_data(self, filters: FilterParams) -> Dict
    async def get_metrics_with_trends(self, filters: FilterParams) -> Dict
    async def get_sentiment_dynamics(self, filters: FilterParams) -> List[Dict]
    async def get_sparkline_data(self, filters: FilterParams, days: int = 7) -> Dict
    async def get_top_topics_by_date(self, date: str, filters: FilterParams) -> List[str]
```

#### **5.3. Фильтрация и Query Builder**
Универсальная система фильтрации через Pydantic модели:

```python
class FilterParams(BaseModel):
    date_range: Optional[DateRange] = None
    sources: Optional[List[str]] = None              # ["Banki.ru", "Sravni.ru"]
    categories: Optional[List[str]] = None            # Категории (аспекты)
    products: Optional[List[str]] = None              # Виртуальная группировка категорий
    sentiments: Optional[List[str]] = None            # ["positive", "neutral", "negative"]
    search_text: Optional[str] = None

    @validator('sentiments')
    def translate_sentiments(cls, v):
        """Транслирует sentiment для БД: positive -> позитив"""
        if not v:
            return v
        mapping = {"positive": "позитив", "neutral": "нейтральный", "negative": "негатив"}
        return [mapping.get(s, s) for s in v]

class QueryBuilder:
    """Построитель запросов с применением фильтров"""
    
    @staticmethod
    def apply_filters(query: Select, filters: FilterParams) -> Select:
        """Применяет фильтры к базовому запросу"""
        
        # Фильтр по дате
        if filters.date_range:
            query = query.where(
                Review.date.between(
                    filters.date_range.from_date,
                    filters.date_range.to_date
                )
            )
        
        # Фильтр по источникам
        if filters.sources:
            query = query.join(Source).where(Source.name.in_(filters.sources))
        
        # Фильтр по категориям (aspects)
        if filters.categories:
            query = query.join(Annotation).join(Category).where(
                Category.name.in_(filters.categories)
            )
        
        # Фильтр по продуктам (виртуальная группировка)
        if filters.products:
            category_names = QueryBuilder._get_categories_for_products(filters.products)
            query = query.join(Annotation).join(Category).where(
                Category.name.in_(category_names)
            )
        
        # Фильтр по тональности
        if filters.sentiments:
            query = query.join(Annotation).join(Sentiment).where(
                Sentiment.name.in_(filters.sentiments)
            )
        
        # Полнотекстовый поиск (если добавлен FTS5)
        if filters.search_text:
            query = query.where(Review.text.like(f"%{filters.search_text}%"))
        
        return query
    
    @staticmethod
    def _get_categories_for_products(products: List[str]) -> List[str]:
        """Маппинг продуктов на категории БД"""
        from app.core.mappings import PRODUCT_TO_CATEGORY_MAPPING
        categories = []
        for product in products:
            categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
        return categories
```

#### **5.4. Агрегация данных**
Специализированный сервис для сложных агрегаций:

```python
class AggregationService:
    async def calculate_sentiment_distribution(self, filters: FilterParams) -> dict
    async def calculate_trends(self, current: dict, previous: dict) -> dict
    async def calculate_sparkline(self, filters: FilterParams, days: int = 7) -> List[int]
    async def get_previous_period_filters(self, filters: FilterParams) -> FilterParams
    async def group_by_time_period(self, data: List, period: str) -> dict
```

#### **5.4.1. Пример структуры ответа `/api/dashboard/overview`**

```python
{
    "meta": {
        "date_range": {
            "from": "2025-01-01T00:00:00Z",
            "to": "2025-01-31T23:59:59Z"
        },
        "filters_applied": {
            "sources": ["banki-ru"],
            "products": ["credit-cards"]
        },
        "last_updated": "2025-10-01T15:30:00Z"
    },
    "metrics": {
        "total_reviews": {
            "current": 2847,
            "trend": {
                "direction": "up",
                "change": 245,
                "change_percent": 9
            },
            "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847]
        },
        "positive_reviews": {
            "current": 1936,
            "percentage": 68,
            "trend": {"direction": "up", "change": 156, "change_percent": 8},
            "sparkline": [1650, 1705, 1780, 1825, 1880, 1910, 1936]
        },
        "neutral_reviews": {...},
        "negative_reviews": {...}
    },
    "sentiment_dynamics": [
        {
            "date": "2025-01-01",
            "positive": 67,
            "neutral": 25,
            "negative": 8,
            "topics": ["мобильное приложение", "кэшбэк", "поддержка"]
        },
        ...
    ]
}
```

#### **5.5. Обработка ошибок**
Иерархия кастомных исключений:

```python
class ApplicationException(Exception):
    """Базовое исключение приложения"""
    
class DatabaseException(ApplicationException):
    """Ошибки работы с БД"""
    
class ValidationException(ApplicationException):
    """Ошибки валидации данных"""
    
class NotFoundException(ApplicationException):
    """Ресурс не найден"""
```

Глобальный обработчик в middleware:
```python
@app.exception_handler(ApplicationException)
async def application_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": str(exc), "timestamp": datetime.utcnow()}
    )
```

#### **5.6. Логирование**
Структурированное логирование с контекстом:

```python
logger.info(
    "dashboard_metrics_requested",
    extra={
        "endpoint": "/api/dashboard/metrics",
        "filters": filters.dict(),
        "execution_time_ms": elapsed_time,
        "result_count": len(results)
    }
)
```

#### **5.7. CORS конфигурация**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### **5.8. Кэширование**
Стратегия кэширования:
- `/api/config` - TTL: 1 час (редко меняются справочники)
- `/api/dashboard/metrics` с фильтрами - TTL: 5 минут
- Invalidation при изменении данных

```python
@cache(expire=3600)  # 1 час
async def get_config():
    return await config_service.get_configuration()
```

#### **5.9. Полнотекстовый поиск**

> **Примечание:** FTS5 отсутствует в текущей БД. Требуется миграция для добавления.

**Временное решение (LIKE-поиск):**
```python
async def search_reviews_simple(self, query: str, filters: FilterParams) -> List[Review]:
    """Простой поиск через LIKE (временное решение до добавления FTS5)"""
    stmt = select(Review).where(Review.text.like(f"%{query}%"))
    
    if filters:
        stmt = QueryBuilder.apply_filters(stmt, filters)
    
    result = await session.execute(stmt.limit(50))
    return result.scalars().all()
```

**Рекомендуемое решение (после миграции FTS5):**
```python
# Создание FTS5 таблицы (миграция Alembic)
"""
CREATE VIRTUAL TABLE reviews_fts USING fts5(
    text,
    content='reviews',
    content_rowid='review_id',
    tokenize='unicode61 remove_diacritics 1'
);

-- Триггеры для автоматической синхронизации
CREATE TRIGGER reviews_ai AFTER INSERT ON reviews BEGIN
  INSERT INTO reviews_fts(rowid, text) VALUES (new.review_id, new.text);
END;

CREATE TRIGGER reviews_ad AFTER DELETE ON reviews BEGIN
  DELETE FROM reviews_fts WHERE rowid = old.review_id;
END;

CREATE TRIGGER reviews_au AFTER UPDATE ON reviews BEGIN
  UPDATE reviews_fts SET text = new.text WHERE rowid = new.review_id;
END;
"""

async def search_reviews_fts(self, query: str, filters: FilterParams) -> List[Dict]:
    """Полнотекстовый поиск с ранжированием через FTS5"""
    stmt = text("""
        SELECT 
            r.review_id,
            r.date,
            r.text,
            s.name as source,
            bm25(reviews_fts) as rank,
            snippet(reviews_fts, -1, '<mark>', '</mark>', '...', 64) as highlight
        FROM reviews r
        JOIN reviews_fts ON r.review_id = reviews_fts.rowid
        JOIN sources s ON r.source_id = s.id
        WHERE reviews_fts MATCH :query
        ORDER BY rank
        LIMIT :limit
    """)
    
    result = await session.execute(stmt, {"query": query, "limit": 50})
    return [dict(row) for row in result]
```

#### **5.10. Мониторинг и Health Checks**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": await check_db_connection(),
        "timestamp": datetime.utcnow()
    }

# Prometheus metrics
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

#### **5.11. API Эндпоинты**

**Основной эндпоинт:**
- `POST /api/dashboard/overview` - консолидированный эндпоинт для вкладки "Обзор"
  - Принимает: `date_range`, `filters` (sources, products)
  - Возвращает: `meta`, `metrics`, `sentiment_dynamics`
  - Метрики включают: current, percentage, trend, sparkline (7 значений)

**Опциональные эндпоинты:**
- `GET /api/config` - справочники (sources, products, aspects)
- `POST /api/search` - полнотекстовый поиск (если требуется)

**Версионирование API:**
- Текущая версия: `/api/v1/*`
- Поддержка обратной совместимости
- Deprecated endpoints с предупреждениями в headers

#### **5.12. Оптимизация SQLite**
```python
# При инициализации БД
await conn.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging
await conn.execute("PRAGMA synchronous=NORMAL")
await conn.execute("PRAGMA cache_size=-64000")  # 64MB cache
await conn.execute("PRAGMA temp_store=MEMORY")
```

### **6. Тестирование**

#### **6.1. Структура тестов**
*   **Unit-тесты:** Для тестирования отдельных функций в сервисном слое и репозиториях.
*   **Интеграционные тесты:** Для тестирования взаимодействия между слоями.
*   **API-тесты (E2E):** Для полной проверки работы эндпоинтов.

#### **6.2. Test Coverage**
- Минимум 80% покрытие кода
- 100% покрытие критических бизнес-логик (расчет метрик, агрегации)

#### **6.3. Тестовое окружение**
```python
@pytest.fixture
async def test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()
```

### **7. Развертывание (Deployment)**

#### **7.1. Docker**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker"]
```

#### **7.2. Docker Compose**
```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./database:/app/database
    environment:
      - DATABASE_URL=sqlite:///./database/bank_reviews.db
```

#### **7.3. Production настройки**
- Gunicorn с несколькими workers
- Nginx как reverse proxy
- SSL/TLS сертификаты
- Rate limiting
- Request timeout

### **8. Паттерны и лучшие практики**

#### **8.1. Dependency Injection**
```python
async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session

async def get_review_repository(db: AsyncSession = Depends(get_db)):
    return ReviewRepository(db)

async def get_dashboard_service(
    repo: ReviewRepository = Depends(get_review_repository)
):
    return DashboardService(repo)
```

#### **8.2. DTO (Data Transfer Objects)**
Использование Pydantic схем для разделения внутренних моделей и API контрактов.

#### **8.3. Принцип единственной ответственности**
Каждый модуль/класс отвечает за одну конкретную задачу.

### **9. Безопасность**

*   **Валидация входных данных:** Через Pydantic схемы
*   **SQL Injection:** Защита через параметризованные запросы SQLAlchemy
*   **Rate Limiting:** Ограничение количества запросов от одного клиента
*   **CORS:** Строгая настройка разрешенных origins
*   **Sensitive Data:** Все секреты в переменных окружения

### **10. Дальнейшие улучшения**

*   **Переход на PostgreSQL:** При росте нагрузки и необходимости более сложных запросов
*   **Redis для кэширования:** Для distributed кэширования при горизонтальном масштабировании
*   **Elasticsearch:** Для продвинутого полнотекстового поиска с анализом и фасетами
*   **Фоновые задачи (Celery/ARQ):** Для длительных операций (пересчет аналитики, экспорт данных)
*   **GraphQL API:** Альтернативный интерфейс для более гибких запросов
*   **WebSocket real-time updates:** Для push-уведомлений о новых критических проблемах
*   **ML модели:** Интеграция моделей для sentiment analysis и автоматической категоризации

### **11. Миграции базы данных**

> **Важно:** Для полной реализации требований API необходимо выполнить следующие миграции существующей БД.

#### **11.1. Обязательные миграции**

**Миграция 1: Добавление FTS5 для полнотекстового поиска**
```python
# alembic/versions/001_add_fts5_search.py
"""
Приоритет: Высокий
Описание: Добавляет FTS5 таблицу для эффективного полнотекстового поиска
"""

def upgrade():
    op.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS reviews_fts USING fts5(
            text,
            content='reviews',
            content_rowid='review_id',
            tokenize='unicode61 remove_diacritics 1'
        );
    """)
    
    # Заполнение FTS таблицы существующими данными
    op.execute("""
        INSERT INTO reviews_fts(rowid, text)
        SELECT review_id, text FROM reviews;
    """)
    
    # Триггеры для автоматической синхронизации
    op.execute("""
        CREATE TRIGGER reviews_ai AFTER INSERT ON reviews BEGIN
          INSERT INTO reviews_fts(rowid, text) VALUES (new.review_id, new.text);
        END;
    """)
    # ... остальные триггеры

def downgrade():
    op.execute("DROP TRIGGER IF EXISTS reviews_ai;")
    op.execute("DROP TABLE IF EXISTS reviews_fts;")
```

**Миграция 2: Добавление группировки категорий (опционально)**
```python
# alembic/versions/002_add_category_groups.py
"""
Приоритет: Средний
Описание: Добавляет группировку категорий для маппинга на продукты API
"""

def upgrade():
    op.add_column('categories', sa.Column('product_group', sa.String(50), nullable=True))
    op.add_column('categories', sa.Column('display_order', sa.Integer, default=0))
    
    # Обновление существующих категорий
    op.execute("""
        UPDATE categories SET product_group = 'cards' 
        WHERE name IN ('Карты', 'Кэшбэк / Бонусы', 'Карточная служба');
        
        UPDATE categories SET product_group = 'credits'
        WHERE name IN ('Кредиты', 'Процентные ставки');
        
        -- и т.д.
    """)
```

**Миграция 3: Добавление metadata полей (опционально)**
```python
# alembic/versions/003_add_metadata_fields.py
"""
Приоритет: Низкий
Описание: Добавляет дополнительные поля для аналитики
"""

def upgrade():
    # Добавление rating для отзывов
    op.add_column('reviews', sa.Column('rating', sa.Integer, nullable=True))
    
    # Добавление confidence score для аннотаций
    op.add_column('annotations', sa.Column('confidence_score', sa.Float, nullable=True))
    
    # Добавление processed_by для отслеживания ML модели
    op.add_column('annotations', sa.Column('processed_by', sa.String(100), nullable=True))
```

#### **11.2. Миграции для оптимизации**

```python
# alembic/versions/004_optimize_indexes.py
"""
Описание: Добавляет дополнительные индексы для часто используемых запросов
"""

def upgrade():
    # Композитный индекс для фильтрации по дате и источнику
    op.create_index(
        'idx_reviews_date_source', 
        'reviews', 
        ['date', 'source_id']
    )
    
    # Индекс для агрегаций по категориям и тональности
    op.create_index(
        'idx_annotations_full',
        'annotations',
        ['category_id', 'sentiment_id', 'review_id']
    )
```

#### **11.3. План выполнения миграций**

1. **Этап 1 (Критический):** Миграция FTS5 - необходима для `/api/search`
2. **Этап 2 (Рекомендуемый):** Группировка категорий - упростит фильтрацию по продуктам
3. **Этап 3 (Опциональный):** Дополнительные поля - для расширенной аналитики
4. **Этап 4 (Производительность):** Оптимизация индексов - при росте данных

**Команды для выполнения:**
```bash
# Создание миграции
alembic revision --autogenerate -m "Add FTS5 search"

# Применение миграции
alembic upgrade head

# Откат миграции (если нужно)
alembic downgrade -1
```

---

---

## **12. Ключевые изменения в архитектуре (v2.2)**

### **Изменения в API структуре:**
1. ✅ Консолидированный эндпоинт `POST /api/dashboard/overview` вместо множественных GET
2. ✅ Unified response с `meta`, `metrics`, `sentiment_dynamics`
3. ✅ Метрики теперь включают `sparkline` (массив из 7 значений)
4. ✅ Каждая метрика содержит `trend` с `direction`, `change`, `change_percent`
5. ✅ Sentiment dynamics включает опциональные топ-3 темы по каждому дню

### **Изменения в фильтрации:**
- Упрощена структура: только `sources` и `products`
- Убраны: `categories`, `sentiments`, `search_text` из основных фильтров
- Products маппируются на categories через `PRODUCT_TO_CATEGORY_MAPPING`

### **Изменения в схемах:**
- Новые схемы: `OverviewRequest`, `OverviewResponse`
- Новые компоненты: `TrendSchema`, `MetricSchema`, `SentimentDynamicsSchema`
- Метаданные теперь включают `last_updated`

### **Изменения в репозиториях:**
- DashboardRepository: новые методы `get_overview_data()`, `get_sparkline_data()`
- Упор на агрегацию данных за один запрос
- Оптимизация через использование existing views

### **Адаптация требует:**
- Обновление всех схем Pydantic в `app/schemas/dashboard.py`
- Реализация расчета sparkline в `AggregationService`
- Реализация топ-3 тем по каждому дню
- Обновление DashboardService для консолидированного ответа

---

**Документ версия:** 2.2  
**Дата последнего обновления:** 2025-10-01  
**Статус:** Адаптирован под новые требования фронтэнда (api.md v2)  
**Связанные документы:** api.md, database_api_mapping.md, implementation_plan.md
