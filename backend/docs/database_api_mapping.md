# Маппинг между базой данных и API

> **Цель документа:** Описать правила преобразования данных между существующей структурой БД и требованиями API фронтэнда.

---

## 1. Обзор структуры данных

### База данных (реальная структура)
- **reviews** (1321 записей) - отзывы клиентов
- **annotations** (3568 записей) - связь отзывов с категориями и тональностью
- **sources** (2 записи) - источники: "Banki.ru", "Sravni.ru"
- **categories** (~30 записей) - категории/аспекты: "Карты", "Кредиты", "Приложение" и т.д.
- **sentiments** (3 записи) - тональности: "позитив", "негатив", "нейтральный"

### API требования (из api.md)
- Нужны: `products`, `aspects`, `sentiment` (в английском формате)
- Требуется: `sentiment_score` (0-100), `trendData`, `critical_issues`

---

## 2. Ключевые маппинги

### 2.1. Sentiment (Тональность)

| БД (ru) | API (en) | Sentiment Score |
|---------|----------|-----------------|
| позитив | positive | 67-100 |
| нейтральный | neutral | 34-66 |
| негатив | negative | 0-33 |

**Код:**
```python
SENTIMENT_MAPPING = {
    "позитив": "positive",
    "негатив": "negative",
    "нейтральный": "neutral"
}
```

### 2.2. Categories → Products

**Проблема:** В БД есть только `categories`, а API требует `products`.

**Решение:** Создаем виртуальную группировку categories → products согласно api.md:

| Product (API) | Categories (БД) |
|---------------|-----------------|
| `credit-cards` | Карты, Кредиты, Процентные ставки |
| `debit-cards` | Карты, Кэшбэк / Бонусы |
| `mortgage` | Кредиты, Процентные ставки |
| `auto-loan` | Кредиты |
| `consumer-loan` | Кредиты |
| `deposits` | Вклады |
| `savings` | Вклады |
| `mobile-app` | Приложение |
| `online-banking` | Приложение |
| `support` | Обслуживание в офисе, Курьерская служба |

**Код:**
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

**Примечание:** Возможны пересечения категорий между продуктами (например, "Карты" входит и в credit-cards, и в debit-cards).

### 2.3. Sources

**Согласно api.md, возможные sources:**
`app-store`, `google-play`, `banki-ru`, `irecommend`, `social-vk`, `social-telegram`, `reviews-site`

**Текущие данные в БД:**
- `Banki.ru`
- `Sravni.ru`

**Маппинг:**
| БД | API value |
|----|-----------|
| Banki.ru | banki-ru |
| Sravni.ru | irecommend |

**Код:**
```python
SOURCE_DB_TO_API = {
    "Banki.ru": "banki-ru",
    "Sravni.ru": "irecommend"
}

SOURCE_API_TO_DB = {v: k for k, v in SOURCE_DB_TO_API.items()}
```

**Примечание:** При добавлении новых источников в БД, необходимо обновить маппинг.

---

## 3. Вычисляемые поля

### 3.1. Sentiment Score (0-100)

**Формула:**
```python
def calculate_sentiment_score(positive: int, neutral: int, negative: int) -> float:
    total = positive + neutral + negative
    if total == 0:
        return 50.0
    
    # Weighted: positive=100, neutral=50, negative=0
    score = (positive * 100 + neutral * 50) / total
    return round(score, 2)
```

**Пример:**
- 10 позитивных, 5 нейтральных, 3 негативных
- Score = (10×100 + 5×50 + 3×0) / 18 = 1250 / 18 = 69.44

### 3.2. Trend Data (за 7 дней)

**Источник:** Группировка reviews по `date` + агрегация annotations

**SQL:**
```sql
SELECT 
    DATE(r.date) as date,
    COUNT(CASE WHEN s.name = 'позитив' THEN 1 END) as positive,
    COUNT(CASE WHEN s.name = 'нейтральный' THEN 1 END) as neutral,
    COUNT(CASE WHEN s.name = 'негатив' THEN 1 END) as negative
FROM reviews r
JOIN annotations a ON r.review_id = a.review_id
JOIN sentiments s ON a.sentiment_id = s.id
WHERE r.date >= DATE('now', '-7 days')
GROUP BY DATE(r.date)
ORDER BY date;
```

### 3.3. Topics (топ-3 темы дня)

**Источник:** Топ-3 категории по количеству упоминаний за конкретный день

**SQL:**
```sql
SELECT c.name
FROM categories c
JOIN annotations a ON c.id = a.category_id
JOIN reviews r ON a.review_id = r.review_id
WHERE DATE(r.date) = :target_date
GROUP BY c.id, c.name
ORDER BY COUNT(*) DESC
LIMIT 3;
```

### 3.4. Critical Issues

**Источник:** View `problematic_categories` + вычисления

**Логика:**
1. Берем категории с `negative_percentage > 50%`
2. Генерируем `CriticalIssue` объекты
3. Приоритет определяется по формуле: `negative_percentage × volume`

**Код:**
```python
def get_priority(negative_pct: float, volume: int) -> str:
    score = negative_pct * volume
    if score > 5000:
        return "P0"
    elif score > 2000:
        return "P1"
    else:
        return "P2"

def get_impact(negative_pct: float) -> str:
    if negative_pct >= 70:
        return "Высокий"
    elif negative_pct >= 50:
        return "Средний"
    else:
        return "Низкий"
```

---

## 4. Примеры API ответов

### 4.1. `POST /api/dashboard/overview`

**Запрос:**
```json
{
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": ["banki-ru"],
    "products": ["credit-cards"]
  }
}
```

**Логика обработки:**
1. Преобразовать API sources → БД sources: `["banki-ru"]` → `["Banki.ru"]`
2. Преобразовать API products → БД categories: `["credit-cards"]` → `["Карты", "Кредиты", "Процентные ставки"]`
3. Получить метрики за текущий период с фильтрами
4. Получить метрики за предыдущий период (той же длительности)
5. Рассчитать тренды (direction, change, change_percent)
6. Получить sparkline за последние 7 дней текущего периода
7. Получить sentiment dynamics по каждому дню с топ-3 темами

**SQL для основных метрик:**
```sql
SELECT 
    COUNT(DISTINCT r.review_id) as total_reviews,
    COUNT(CASE WHEN s.name = 'позитив' THEN 1 END) as positive,
    COUNT(CASE WHEN s.name = 'негатив' THEN 1 END) as negative,
    COUNT(CASE WHEN s.name = 'нейтральный' THEN 1 END) as neutral
FROM reviews r
JOIN annotations a ON r.review_id = a.review_id
JOIN sentiments s ON a.sentiment_id = s.id
JOIN sources src ON r.source_id = src.id
JOIN categories c ON a.category_id = c.id
WHERE r.date BETWEEN :from_date AND :to_date
  AND src.name IN ('Banki.ru')
  AND c.name IN ('Карты', 'Кредиты', 'Процентные ставки');
```

**SQL для sparkline (последние 7 дней):**
```sql
SELECT 
    DATE(r.date) as date,
    COUNT(DISTINCT r.review_id) as count
FROM reviews r
WHERE r.date >= DATE(:to_date, '-7 days') AND r.date <= :to_date
GROUP BY DATE(r.date)
ORDER BY date;
```

**SQL для sentiment dynamics:**
```sql
SELECT 
    DATE(r.date) as date,
    ROUND(100.0 * COUNT(CASE WHEN s.name = 'позитив' THEN 1 END) / COUNT(*), 0) as positive,
    ROUND(100.0 * COUNT(CASE WHEN s.name = 'нейтральный' THEN 1 END) / COUNT(*), 0) as neutral,
    ROUND(100.0 * COUNT(CASE WHEN s.name = 'негатив' THEN 1 END) / COUNT(*), 0) as negative
FROM reviews r
JOIN annotations a ON r.review_id = a.review_id
JOIN sentiments s ON a.sentiment_id = s.id
WHERE r.date BETWEEN :from_date AND :to_date
GROUP BY DATE(r.date)
ORDER BY date;
```

**SQL для топ-3 тем каждого дня:**
```sql
SELECT 
    c.name
FROM categories c
JOIN annotations a ON c.id = a.category_id
JOIN reviews r ON a.review_id = r.review_id
WHERE DATE(r.date) = :target_date
GROUP BY c.id, c.name
ORDER BY COUNT(*) DESC
LIMIT 3;
```

---

## 5. Важные замечания

### ⚠️ Один отзыв → Много аннотаций
Отзыв может упоминать несколько категорий с разной тональностью:
```
Review #123: "Карты отличные, но приложение тормозит"
  └── Annotation 1: category="Карты", sentiment="позитив"
  └── Annotation 2: category="Приложение", sentiment="негатив"
```

**Последствие:** При подсчете метрик учитывать, что `COUNT(annotations) ≠ COUNT(reviews)`

### ⚠️ Отсутствие данных
- Нет продуктов как отдельной сущности
- Нет sentiment_score как колонки (вычисляется)
- Нет таблицы critical_issues (генерируется)

### ⚠️ FTS5 отсутствует
Полнотекстовый поиск пока через LIKE. Требуется миграция для добавления FTS5.

---

## 6. Чек-лист для разработчиков

### **При обработке запроса:**
- [ ] Преобразовать API `sources` → БД sources через `SOURCE_API_TO_DB`
- [ ] Преобразовать API `products` → БД categories через `PRODUCT_TO_CATEGORY_MAPPING`
- [ ] Пустые массивы `[]` означают "все" (не применять фильтр)

### **При формировании ответа:**
- [ ] Транслировать БД sentiment → API: `позитив` → `positive`
- [ ] Рассчитать тренды: сравнить текущий и предыдущий периоды
- [ ] Вычислить sparkline: массив из 7 значений за последние 7 дней
- [ ] Добавить топ-3 темы для каждого дня в sentiment_dynamics
- [ ] Убедиться, что `positive + neutral + negative = 100` для каждого дня
- [ ] Добавить метаданные: `last_updated`, примененные фильтры

### **При агрегации:**
- [ ] Учитывать множественность аннотаций на отзыв
- [ ] Использовать `COUNT(DISTINCT r.review_id)` для подсчета отзывов
- [ ] Округлять проценты до целых чисел
- [ ] Проверять деление на ноль при расчете процентов

---

**Документ версия:** 1.1  
**Дата обновления:** 2025-10-01  
**Статус:** Адаптирован под новые требования API (api.md v2)  
**Связанные документы:** architecture.md, api.md, implementation_plan.md

