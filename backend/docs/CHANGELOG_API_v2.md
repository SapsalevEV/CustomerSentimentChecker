# Changelog: Адаптация под новые требования API (v2)

**Дата:** 2025-10-01  
**Статус:** ✅ Завершено

---

## 📋 Обзор изменений

Архитектура и план реализации обновлены для соответствия новым требованиям фронтэнда к API.

---

## 🔄 Главные изменения

### 1. **Консолидация API эндпоинтов**

**Было:**
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/sentiment-dynamics`
- `GET /api/dashboard/critical-issues`

**Стало:**
- `POST /api/dashboard/overview` - единый эндпоинт со всеми данными

**Преимущества:**
- Меньше HTTP запросов с фронтэнда
- Консистентные фильтры для всех данных
- Упрощенная логика кэширования

---

### 2. **Новая структура запроса**

```typescript
{
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": ["banki-ru", "google-play"],  // API source IDs
    "products": ["credit-cards", "deposits"]  // API product IDs
  }
}
```

**Изменения:**
- ✅ Упрощены фильтры: только `sources` и `products`
- ✅ Убраны: `categories`, `sentiments`, `search_text`
- ✅ Все поля опциональны (пустой массив = все)

---

### 3. **Новая структура ответа**

```typescript
{
  "meta": {
    "date_range": {...},
    "filters_applied": {...},
    "last_updated": "2025-10-01T15:30:00Z"  // NEW
  },
  "metrics": {
    "total_reviews": {
      "current": 2847,
      "trend": {                             // NEW
        "direction": "up",
        "change": 245,
        "change_percent": 9
      },
      "sparkline": [2420, 2505, ...]         // NEW: 7 значений
    },
    "positive_reviews": {
      "current": 1936,
      "percentage": 68,
      "trend": {...},
      "sparkline": [...]
    },
    // ... neutral_reviews, negative_reviews
  },
  "sentiment_dynamics": [
    {
      "date": "2025-01-01",
      "positive": 67,
      "neutral": 25,
      "negative": 8,
      "topics": ["тема1", "тема2", "тема3"]  // NEW: топ-3 темы
    },
    ...
  ]
}
```

**Новые требования:**
- ✅ Тренды для всех 4 метрик
- ✅ Sparkline (массив из 7 значений) для всех метрик
- ✅ Топ-3 темы для каждого дня в sentiment_dynamics
- ✅ Метаданные с `last_updated`

---

## 🗺️ Обновленные маппинги

### Sources (БД → API)
```python
SOURCE_DB_TO_API = {
    "Banki.ru": "banki-ru",
    "Sravni.ru": "irecommend"
}
```

### Products (API → БД categories)
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

## 📊 Новые методы репозиториев

**DashboardRepository:**
```python
async def get_overview_data(filters: FilterParams) -> Dict
async def get_metrics_with_trends(filters: FilterParams) -> Dict
async def get_sparkline_data(filters: FilterParams, days: int = 7) -> Dict
async def get_sentiment_dynamics(filters: FilterParams) -> List[Dict]
async def get_top_topics_by_date(date: str, filters: FilterParams) -> List[str]
```

**AggregationService:**
```python
async def calculate_trends(current: dict, previous: dict) -> dict
async def calculate_sparkline(filters: FilterParams, days: int = 7) -> List[int]
async def get_previous_period_filters(filters: FilterParams) -> FilterParams
```

---

## 🔢 Формулы расчетов

### Тренды
```python
previous_period_length = (current_to - current_from).days
previous_from = current_from - timedelta(days=previous_period_length)
previous_to = current_from - timedelta(days=1)

change = current_value - previous_value
change_percent = abs((change / previous_value) * 100) if previous_value > 0 else 0
direction = "up" if change >= 0 else "down"
```

### Sparkline
```python
# Последние 7 дней текущего периода
sparkline_start = current_to - timedelta(days=6)
sparkline_end = current_to

# Для каждого дня: count reviews/annotations
```

### Топ-3 темы
```python
# Для каждого дня в sentiment_dynamics:
SELECT c.name
FROM categories c
JOIN annotations a ON c.id = a.category_id
JOIN reviews r ON a.review_id = r.review_id
WHERE DATE(r.date) = :target_date
GROUP BY c.id, c.name
ORDER BY COUNT(*) DESC
LIMIT 3;
```

---

## 📝 Обновленные файлы

### ✅ `docs/architecture.md` (v2.2)
- Обновлена структура API эндпоинтов
- Добавлены новые методы репозиториев
- Добавлена секция 5.11 "API Эндпоинты"
- Добавлена секция 12 "Ключевые изменения"

### ✅ `docs/implementation_plan.md` (v2.1)
- Обновлен Этап 4: Dashboard API
- Добавлены новые Pydantic схемы
- Обновлены оценки времени
- Добавлен раздел "Ключевые изменения"

### ✅ `docs/database_api_mapping.md` (v1.1)
- Обновлены маппинги products
- Обновлены маппинги sources
- Добавлены SQL примеры для sparkline
- Обновлен чек-лист разработчика

### ✅ `docs/api.md` (существующий)
- Используется как источник требований
- Никаких изменений не требуется

---

## ⏱️ Обновленные сроки

| Этап | Время | Изменение |
|------|-------|-----------|
| 0. Окружение | 2ч | Без изменений |
| 1. Структура | 4ч | Без изменений |
| 2. Модели БД | 4ч | Без изменений |
| 3. Config API | 6ч | Без изменений |
| 4. Dashboard | 10ч | Без изменений |
| 5. Поиск | 4ч | Теперь опционально |
| 6. Тесты | 8ч | Без изменений |
| 7. Production | 5ч | Без изменений |

**MVP (без поиска и тестов):** 26 часов  
**Production Ready (полный):** 43 часа

---

## ✅ Checklist для реализации

### Схемы Pydantic
- [ ] `OverviewRequest` с date_range и filters
- [ ] `OverviewResponse` с meta, metrics, sentiment_dynamics
- [ ] `TrendSchema` с direction, change, change_percent
- [ ] `MetricSchema` с current, trend, sparkline
- [ ] `SentimentDynamicsSchema` с date, %, topics

### Репозитории
- [ ] `DashboardRepository.get_overview_data()`
- [ ] `DashboardRepository.get_metrics_with_trends()`
- [ ] `DashboardRepository.get_sparkline_data()`
- [ ] `DashboardRepository.get_top_topics_by_date()`

### Сервисы
- [ ] `AggregationService.calculate_trends()`
- [ ] `AggregationService.calculate_sparkline()`
- [ ] `AggregationService.get_previous_period_filters()`
- [ ] `DashboardService.get_overview()`

### Маппинги
- [ ] Обновить `app/core/mappings.py`
- [ ] Добавить `get_db_source_names()`
- [ ] Обновить `PRODUCT_TO_CATEGORY_MAPPING`

### Роутер
- [ ] `POST /api/dashboard/overview`
- [ ] Валидация входных данных
- [ ] Обработка ошибок
- [ ] Документация Swagger

### Тесты
- [ ] Тесты маппингов
- [ ] Тесты расчета трендов
- [ ] Тесты расчета sparkline
- [ ] E2E тесты эндпоинта

---

## 🚀 Следующие шаги

1. **Немедленно:** Начать с Этапа 0-2 (окружение, структура, модели)
2. **Приоритет 1:** Реализовать Этап 4 (Dashboard API)
3. **Приоритет 2:** Реализовать Этап 3 (/config) если требуется
4. **Опционально:** Этап 5 (поиск) отложить на будущее
5. **Финал:** Этапы 6-7 (тесты и production)

---

## 📚 Связанные документы

- `docs/api.md` - Требования к API (источник истины)
- `docs/architecture.md` - Архитектура бэкенда
- `docs/implementation_plan.md` - Пошаговый план реализации
- `docs/database_api_mapping.md` - Маппинги и преобразования

---

**Автор:** Cursor AI  
**Дата:** 2025-10-01

