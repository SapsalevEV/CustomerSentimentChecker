
<Общая архитектура системы>

<Описание концепции>
Каждый поступающий отзыв пользователя проходит через сервис аналитики 
Результат сервиса аналитики записывается в базу данных.
Дашборд работает с результатами анализа через БД
В случае необходимости обработки отзывов в режиме online проработать возможность использования очереди сообщений (RabbitMQ) с интеграцией через БД


</Описание концепции>
<Высокоуровневая схема>
```
┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐
│   Frontend      │    │    Backend      │    │  ML Analytics  │
│   (React SPA)   │◄──►│   (FastAPI)     │    │    Service     │
│                 │    │                 │    │                │
└─────────────────┘    └─────────────────┘    └────────────────┘
                              │                      │
                              ▼                      ▼
                       ┌──────────────────────────────────────┐
                       │              PostgreSQL              │
                       │               Database               │
                       └──────────────────────────────────────┘
```

</Высокоуровневая схема>
</Общая архитектура системы>

<Структура проекта>

```
CustomerSentimentChecker/
├── frontend/                   # React приложение
├── backend/                    # FastAPI сервер
├── senana/                     # ML сервис с LangChain
└── docs/                       # Документация
```

Каждый каталог настравивается на размещение в отдельном контейнере docker, таким образом корректировка и развертывание какого либо из элементов не влиляют друг на друга.


</Структура проекта>

<ML Analytics Service (senana)>

<Структура директорий>

```
ml-analytics/
├── src/
│   ├── analyzers/            # Анализаторы отзывов
│   │   ├── sentiment.py      # Анализ тональности
│   │   ├── clustering.py     # Кластеризация
│   │   └── trends.py         # Анализ трендов
│   ├── chains/               # LangChain цепочки
│   │   ├── feedback_chain.py # Основная цепочка анализа
│   │   └── summary_chain.py  # Генерация саммари
│   ├── models/               # ML модели и эмбеддинги
│   ├── data/                 # Обработка данных
│   ├── api/                  # FastAPI для ML сервиса
│   └── utils/                # Утилиты
├── notebooks/                # Jupyter ноутбуки для экспериментов
├── models/                   # Сохранённые модели
└── requirements.txt
```

</Структура директорий>

</ML Analytics Service (senana)>

<Backend>

<Доменная модель>
```
/src/domain/
├── entities/
│   ├── review.py              # Review aggregate root
│   ├── product.py             # Product entity
│   ├── sentiment.py           # Sentiment value object
│   └── cluster.py             # Review cluster entity
├── repositories/
│   ├── review_repository.py   # Abstract review repo
│   └── product_repository.py  # Abstract product repo
├── services/
│   ├── review_service.py      # Business logic для отзывов
│   ├── analytics_service.py   # Аналитические вычисления
│   └── notification_service.py # Уведомления о трендах
└── value_objects/
    ├── sentiment_score.py     # Скор тональности
    └── time_period.py         # Временные периоды
```
</Доменная модель>


<API слой>

```
/src/api/
├── v1/
│   ├── endpoints/
│   │   ├── reviews.py         # CRUD операции с отзывами
│   │   ├── analytics.py       # Аналитические endpoints
│   │   ├── products.py        # Управление продуктами
│   │   └── dashboards.py      # Dashboard data endpoints
│   ├── dependencies/
│   │   ├── auth.py            # JWT authentication
│   │   ├── pagination.py      # Пагинация
│   │   └── filters.py         # Query filters
│   └── schemas/
│       ├── review_schemas.py   # Pydantic модели
│       ├── analytics_schemas.py
│       └── response_schemas.py # Стандартные ответы

```

</API слой>


<Модели данных>
</Модели данных>

</Backend>


<Frontend>

<Структура компонентов>

/src/modules/dashboard/
├── components/
│   ├── MetricCards/           // KPI карточки
│   ├── TrendCharts/           // Графики динамики
│   ├── SentimentGauge/        // Индикаторы тональности
│   └── ProductFilters/        // Фильтры по продуктам
├── hooks/
│   ├── useMetrics.ts          // Хук для загрузки метрик
│   └── useRealTimeUpdates.ts  // WebSocket подключения
└── types/
    └── dashboard.types.ts     // TypeScript определения

</Структура компонентов>

</Frontend>


<База данных>

<Схема БД>
```sql

-- Справочник продуктов банка
CREATE TABLE products (
    id UUID PRIMARY KEY,    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100)
);

-- Справочник кластеров
CREATE TABLE clusters (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    name VARCHAR(255),
    description TEXT
);

-- Справочник клиентов  
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
);


-- Справочник филиалов банка
CREATE TABLE branches (
    id_branch UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100)
);


-- Оригинальные отзывы
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    client_id UUID,    -- client_id: идентификатор клиента, оставившего отзыв
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),  -- дата и время создания отзыва
    source VARCHAR(50),                       -- источник ("app_store", "google_play", "website")
    rating INTEGER,                           -- оценка пользователя (1-5), если есть
    branch_id UUID REFERENCES branches(id),    -- филиал, если отзыв о конкретном отделении
    status VARCHAR(50) DEFAULT 'new' -- статус обработки системой (например: 'new', 'processed', 'error')

);

-- Справочник тональностей
CREATE TABLE sentiments (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,    -- 'positive', 'negative', 'neutral'
    name VARCHAR(100) NOT NULL,          -- 'Позитивная', 'Негативная', 'Нейтральная'
    description TEXT
);

-- Результаты анализа отзывов (консолидирующая таблица)
CREATE TABLE feedback_analysis_results (
    id UUID PRIMARY KEY,
    feedback_id UUID NOT NULL REFERENCES feedbacks(id),        -- ссылка на исходный отзыв
    product_id UUID REFERENCES products(id),                   -- к какому продукту отнесен отзыв
    cluster_id UUID REFERENCES clusters(id),                   -- к какому кластеру отнесен отзыв
    sentiment_id UUID REFERENCES sentiments(id),               -- определенная тональность
    confidence_score FLOAT,                                     -- уровень уверенности анализа
    processed_at TIMESTAMP NOT NULL DEFAULT NOW(),             -- время обработки
    processing_version VARCHAR(50)                             -- версия модели/алгоритма
    
);

-- Агрегированная аналитика
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    date DATE,
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    avg_rating FLOAT,
    total_feedbacks INTEGER
);
```

</Схема БД>

<Индексы для производительности>
```sql
-- Индексы для быстрых запросов
CREATE INDEX idx_feedbacks_product_date ON feedbacks(product_id, created_at);
CREATE INDEX idx_feedbacks_source ON feedbacks(source);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_branch ON feedbacks(branch_id);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

-- Индексы для консолидирующей таблицы результатов анализа
CREATE INDEX idx_feedback_analysis_feedback_id ON feedback_analysis_results(feedback_id);
CREATE INDEX idx_feedback_analysis_product ON feedback_analysis_results(product_id);
CREATE INDEX idx_feedback_analysis_cluster ON feedback_analysis_results(cluster_id);
CREATE INDEX idx_feedback_analysis_sentiment ON feedback_analysis_results(sentiment_id);
CREATE INDEX idx_feedback_analysis_processed_at ON feedback_analysis_results(processed_at);
CREATE INDEX idx_feedback_analysis_product_sentiment ON feedback_analysis_results(product_id, sentiment_id);
CREATE INDEX idx_feedback_analysis_product_cluster ON feedback_analysis_results(product_id, cluster_id);
CREATE INDEX idx_feedback_analysis_confidence ON feedback_analysis_results(confidence_score);

-- Составной индекс для аналитических запросов
CREATE INDEX idx_feedback_analysis_analytics ON feedback_analysis_results(product_id, sentiment_id, processed_at);

-- Индексы для справочников
CREATE INDEX idx_sentiments_code ON sentiments(code);
CREATE INDEX idx_clusters_product ON clusters(product_id);
CREATE INDEX idx_products_category ON products(category);

-- Индексы для агрегированной аналитики
CREATE INDEX idx_daily_analytics_product_date ON daily_analytics(product_id, date);
CREATE INDEX idx_daily_analytics_date ON daily_analytics(date);
```

</Индексы для производительности>

<Примеры запросов к консолидирующей таблице>

<Получение полной информации об отзыве и результатах анализа>
```sql
SELECT 
    f.id as feedback_id,
    f.text as original_feedback,
    f.rating as user_rating,
    f.source,
    f.created_at,
    p.name as product_name,
    p.category as product_category,
    c.name as cluster_name,
    s.name as sentiment_name,
    s.code as sentiment_code,
    far.sentiment_score,
    far.confidence_score,
    far.processed_at,
    far.processing_version
FROM feedback_analysis_results far
JOIN feedbacks f ON far.feedback_id = f.id
LEFT JOIN products p ON far.product_id = p.id
LEFT JOIN clusters c ON far.cluster_id = c.id
LEFT JOIN sentiments s ON far.sentiment_id = s.id
WHERE f.id = $1;
```
</Получение полной информации об отзыве и результатах анализа>

<Аналитика по продукту с разбивкой по тональности>
```sql
SELECT 
    p.name as product_name,
    s.name as sentiment,
    COUNT(*) as feedback_count,
    AVG(far.sentiment_score) as avg_sentiment_score,
    AVG(far.confidence_score) as avg_confidence,
    AVG(f.rating) as avg_user_rating
FROM feedback_analysis_results far
JOIN feedbacks f ON far.feedback_id = f.id
JOIN products p ON far.product_id = p.id
JOIN sentiments s ON far.sentiment_id = s.id
WHERE far.processed_at >= $1  -- дата начала периода
    AND far.processed_at <= $2  -- дата окончания периода
GROUP BY p.name, s.name, p.id, s.id
ORDER BY p.name, s.name;
```
</Аналитика по продукту с разбивкой по тональности>

<Топ кластеров проблем для продукта>
```sql
SELECT 
    c.name as cluster_name,
    c.description,
    COUNT(*) as feedback_count,
    AVG(far.sentiment_score) as avg_sentiment_score,
    COUNT(CASE WHEN s.code = 'negative' THEN 1 END) as negative_count
FROM feedback_analysis_results far
JOIN clusters c ON far.cluster_id = c.id
JOIN sentiments s ON far.sentiment_id = s.id
WHERE far.product_id = $1  -- ID продукта
    AND far.processed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name, c.description
ORDER BY negative_count DESC, feedback_count DESC
LIMIT 10;
```
</Топ кластеров проблем для продукта>

<Отзывы с низкой уверенностью анализа (требуют ручной проверки)>
```sql
SELECT 
    f.text,
    p.name as product_name,
    s.name as detected_sentiment,
    far.sentiment_score,
    far.confidence_score,
    far.processed_at
FROM feedback_analysis_results far
JOIN feedbacks f ON far.feedback_id = f.id
JOIN products p ON far.product_id = p.id
JOIN sentiments s ON far.sentiment_id = s.id
WHERE far.confidence_score < 0.7  -- низкая уверенность
ORDER BY far.confidence_score ASC;
```

</Отзывы с низкой уверенностью анализа (требуют ручной проверки)>
</Примеры запросов к консолидирующей таблице>

</База данных>