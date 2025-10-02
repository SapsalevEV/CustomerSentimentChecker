# API для дашборда "Обзор" и фильтров

Этот документ описывает минимальный набор API эндпоинтов, необходимых для работы вкладки **"Обзор"** дашборда и системы фильтров.

---

## 📊 Что показывает вкладка "Обзор"

### 1. Четыре карточки с метриками (KPI Cards)
- **Всего отзывов** - общее количество
- **Положительных** - количество + процент от общего
- **Нейтральных** - количество + процент от общего  
- **Отрицательных** - количество + процент от общего

**Каждая карточка содержит:**
- Текущее значение (число)
- Процент от общего числа (только для sentiment)
- Тренд: направление (↑ up / ↓ down) и процент изменения
- Мини-график: массив из 7 значений для последних 7 дней

### 2. График динамики тональности
- Временной ряд по дням
- Для каждого дня: positive, neutral, negative (в процентах)
- Опционально: топ-3 темы дня

---

## 🔧 Требуемый API эндпоинт

### `POST /api/dashboard/overview`

**Назначение:** Получить все данные для вкладки "Обзор" с учетом фильтров.

**URL:** `POST {API_BASE_URL}/dashboard/overview`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 📥 Входные данные (Request Body)

```typescript
{
  "date_range": {
    "from": "2025-01-01T00:00:00Z",  // ISO 8601 format
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": ["banki-ru", "sravni-ru"],     // Опционально, пустой массив = все источники
    "products": ["credit-cards", "debit-cards"]  // Опционально, пустой массив = все продукты
  }
}
```

### Детали входных параметров:

#### `date_range` (обязательно)
- **Тип:** Object
- **Поля:**
  - `from` (string, ISO 8601) - Начало периода
  - `to` (string, ISO 8601) - Конец периода

#### `filters` (опционально)
- **Тип:** Object
- **Поля:**
  - `sources` (string[]) - Массив ID источников для фильтрации
    - Пустой массив `[]` = все источники
    - Возможные значения: `banki-ru`, `sravni-ru`
  
  - `products` (string[]) - Массив ID продуктов для фильтрации
    - Пустой массив `[]` = все продукты
    - Возможные значения: `cards`, `debit-cards`, `mortgage`, `auto-loan`, `consumer-loan`, `deposits`, `savings`, `mobile-app`, `online-banking`, `support`

---

## 📤 Выходные данные (Response Body)

```typescript
{
  "meta": {
    "date_range": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    },
    "filters_applied": {
      "sources": ["app-store", "google-play"],
      "products": ["credit-cards"]
    },
    "last_updated": "2025-10-01T15:30:00Z"
  },
  
  "metrics": {
    "total_reviews": {
      "current": 2847,                    // Общее количество отзывов за период
      "trend": {
        "direction": "up",                // "up" | "down"
        "change": 245,                    // Абсолютное изменение
        "change_percent": 9               // Процент изменения (положительное число)
      },
      "sparkline": [2420, 2505, 2610, 2680, 2750, 2805, 2847]  // 7 значений для мини-графика
    },
    
    "positive_reviews": {
      "current": 1936,                    // Количество положительных отзывов
      "percentage": 68,                   // Процент от общего числа
      "trend": {
        "direction": "up",
        "change": 156,
        "change_percent": 8
      },
      "sparkline": [1650, 1705, 1780, 1825, 1880, 1910, 1936]
    },
    
    "neutral_reviews": {
      "current": 684,
      "percentage": 24,
      "trend": {
        "direction": "down",
        "change": 42,
        "change_percent": 6
      },
      "sparkline": [726, 720, 708, 695, 690, 687, 684]
    },
    
    "negative_reviews": {
      "current": 227,
      "percentage": 8,
      "trend": {
        "direction": "up",
        "change": 18,
        "change_percent": 8
      },
      "sparkline": [209, 212, 215, 218, 221, 224, 227]
    }
  },
  
  "sentiment_dynamics": [
    {
      "date": "2025-01-01",              // ISO date (только дата, без времени)
      "positive": 67,                     // Процент положительных (0-100)
      "neutral": 25,                      // Процент нейтральных (0-100)
      "negative": 8,                      // Процент отрицательных (0-100)
      "topics": [                         // Опционально: топ-3 темы дня
        "мобильное приложение",
        "скорость обслуживания",
        "кэшбэк"
      ]
    },
    {
      "date": "2025-01-02",
      "positive": 69,
      "neutral": 23,
      "negative": 8,
      "topics": ["интерфейс", "поддержка", "переводы"]
    }
    // ... данные за каждый день в указанном диапазоне
  ]
}
```

### Детали выходных данных:

#### `meta`
Метаинформация о запросе:
- `date_range` - Запрошенный диапазон дат
- `filters_applied` - Примененные фильтры
- `last_updated` - Время последнего обновления данных

#### `metrics`
Объект с 4-мя метриками (total_reviews, positive_reviews, neutral_reviews, negative_reviews).

**Структура каждой метрики:**
- `current` (number) - Текущее значение
- `percentage` (number, опционально) - Процент от total (только для sentiment метрик)
- `trend` (object):
  - `direction` (string) - "up" или "down"
  - `change` (number) - Абсолютное изменение по сравнению с предыдущим периодом
  - `change_percent` (number) - Процентное изменение (всегда положительное число, направление в `direction`)
- `sparkline` (number[]) - Массив из 7 значений для мини-графика (последние 7 дней периода)

#### `sentiment_dynamics`
Массив объектов с данными по каждому дню:
- `date` (string) - Дата в формате ISO (YYYY-MM-DD)
- `positive` (number) - Процент положительных отзывов (0-100)
- `neutral` (number) - Процент нейтральных отзывов (0-100)
- `negative` (number) - Процент отрицательных отзывов (0-100)
- `topics` (string[], optional) - Топ-3 темы дня

**Важно:** `positive + neutral + negative` должны в сумме давать 100.

---

## 📋 Бизнес-логика на бэкенде

### Расчет трендов
Тренд рассчитывается путем сравнения текущего периода с предыдущим периодом той же длительности:

**Пример:** 
- Текущий период: 01.01.2025 - 31.01.2025 (31 день)
- Предыдущий период для сравнения: 01.12.2024 - 31.12.2024 (31 день)

```
change = current_period_value - previous_period_value
change_percent = abs((change / previous_period_value) * 100)
direction = change >= 0 ? "up" : "down"
```

### Расчет sparkline (мини-графика)
Массив из 7 последних дней запрошенного периода:
- Если период < 7 дней - вернуть все доступные дни
- Если период >= 7 дней - вернуть последние 7 дней

### Фильтрация
- Пустые массивы `sources: []` и `products: []` означают "все источники/продукты"
- Если массив не пустой - применять фильтрацию только по указанным значениям
- Фильтры работают по принципу OR внутри категории и AND между категориями

---

## 🔍 Примеры запросов

### Пример 1: Все данные за последние 30 дней
```json
{
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": [],
    "products": []
  }
}
```

### Пример 2: Только App Store и Google Play за неделю
```json
{
  "date_range": {
    "from": "2025-01-25T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": ["app-store", "google-play"],
    "products": []
  }
}
```

### Пример 3: Только кредитные карты за месяц
```json
{
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-31T23:59:59Z"
  },
  "filters": {
    "sources": [],
    "products": ["credit-cards"]
  }
}
```

---

## ⚠️ Обработка ошибок

### Ошибка 400 - Неверные параметры
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Неверный формат даты",
    "details": {
      "field": "date_range.from",
      "reason": "Должна быть в формате ISO 8601"
    }
  }
}
```

### Ошибка 401 - Не авторизован
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Требуется аутентификация"
  }
}
```

### Ошибка 422 - Недопустимые значения
```json
{
  "error": {
    "code": "INVALID_FILTER_VALUE",
    "message": "Неизвестный ID продукта",
    "details": {
      "field": "filters.products",
      "invalid_values": ["unknown-product-id"]
    }
  }
}
```

---

## 🚀 Интеграция на фронтенде

### Пример использования с API клиентом:

```typescript
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export function useDashboardOverview(
  dateRange: { from: Date; to: Date },
  sources: string[],
  products: string[]
) {
  return useQuery({
    queryKey: ['dashboard-overview', dateRange, sources, products],
    queryFn: () => apiClient.post('/dashboard/overview', {
      date_range: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      },
      filters: {
        sources,
        products
      }
    }),
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}
```

---

## 📊 Производительность

### Рекомендации:
- **Кеширование:** Кешировать ответы на 5-15 минут (данные не меняются каждую секунду)
- **Индексы БД:** Индексы на `created_at`, `source`, `product_id`, `sentiment`
- **Агрегация:** Использовать предрассчитанные агрегаты для больших периодов
- **Лимиты:** Максимальный период запроса - 1 год

### Ожидаемое время ответа:
- < 500ms для периода до 3 месяцев
- < 1000ms для периода до 1 года

