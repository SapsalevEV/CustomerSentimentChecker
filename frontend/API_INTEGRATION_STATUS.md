# API Integration Status

Статус интеграции фронтенда с Backend API.

**Backend URL**: `http://72.56.64.34:8000`
**Дата обновления**: 2025-10-01

---

## ✅ Полностью интегрированные страницы

### 1. Dashboard (Главная страница `/`)

**Статус**: ✅ **100% интеграция с реальным API**

**Используемые endpoints**:
- `GET /api/config` - загрузка фильтров (sources, products, datePresets)
- `POST /api/dashboard/overview` - метрики и sentiment dynamics

**Компоненты**:
- `src/pages/Dashboard.tsx` - использует `useMetrics()`, `useSentimentDynamics()`
- `src/contexts/UnifiedFiltersContext.tsx` - использует `useConfig()`
- `src/hooks/useDashboardData.ts` - интегрирован с API

**Особенности**:
- Автоматический fallback на mock данные при ошибках API
- Реактивная перезагрузка при изменении фильтров (React Query)
- Кеширование: config (бесконечно), dashboard data (5 минут)

**Данные из API**:
```typescript
// Метрики с трендами
- total_reviews: { current, trend, sparkline[7] }
- positive/neutral/negative_reviews: { current, percentage, trend, sparkline[7] }

// Динамика по дням
- sentiment_dynamics: [{ date, positive%, neutral%, negative%, topics[3] }]

// Метаданные
- date_range, filters_applied, last_updated
```

---

## ❌ Страницы использующие Mock данные

### 2. Comparative Analysis (`/comparative`)

**Статус**: ❌ **Mock данные - ожидает API**

**Компоненты с моками**:
- `src/components/comparative/ProductComparison.tsx`
  - Использует: `getMockSentimentData(productValue)`
  - Данные: sentiment по продуктам и аспектам

- `src/components/comparative/AspectAnalysis.tsx`
  - Использует: `getMockAspectSentiment(selectedAspect)`
  - Данные: sentiment score по аспектам для каждого продукта

**Необходимые API endpoints**:
```
POST /api/comparative/products
Request: { date_range, products: ["credit-cards", "debit-cards"] }
Response: {
  products: [{
    product_id: "credit-cards",
    aspects: [{
      name: "Процентная ставка",
      positive: 45, neutral: 30, negative: 25,
      volume: 156
    }]
  }]
}

POST /api/comparative/aspects
Request: { date_range, aspect: "Служба поддержки" }
Response: {
  aspect: "Служба поддержки",
  products: [{
    product_id: "credit-cards",
    product_name: "Кредитные карты",
    sentiment_score: 45
  }]
}
```

---

### 3. Products (`/products`)

**Статус**: ❌ **Захардкоженные данные - ожидает API**

**Захардкоженные данные в `Products.tsx`**:
- `productsMatrix` - матрица satisfaction × feedback volume
- `aspectPriorities` - importance/satisfaction по аспектам

**Необходимые API endpoints**:
```
POST /api/products/performance
Request: { date_range, filters }
Response: {
  products: [{
    id: "mobile-banking",
    name: "Мобильный банкинг",
    satisfaction: 68,
    feedback_volume: 2847,
    growth: "+12%",
    category: "digital",
    critical_features: ["Вход в приложение", "Переводы"]
  }]
}

POST /api/products/aspect-priorities
Request: { date_range, products: [] }
Response: {
  aspects: [{
    aspect: "Время обработки",
    importance: 95,
    satisfaction: 42,
    gap: -53,
    products: ["Кредиты", "Мобильный банкинг"],
    actionable: true
  }]
}
```

---

### 4. Analytics (`/analytics`)

**Статус**: ❌ **Захардкоженные данные - ожидает API**

**Захардкоженные данные в `Analytics.tsx`**:
- `heatmapData` - sentiment по продуктам × аспектам
- `timeSeriesData` - временные ряды sentiment с событиями
- `customerClusters` - кластеризация клиентов
- `correlationData` - корреляции между аспектами

**Необходимые API endpoints**:
```
POST /api/analytics/heatmap
Response: {
  products: ["Мобильный банкинг", "Карты", ...],
  aspects: ["Удобство", "Скорость", ...],
  data: [[68, 45, 82, ...], [...]] // 2D matrix
}

POST /api/analytics/time-series
Response: {
  series: [{
    date: "2024-01",
    sentiment: 65,
    events: ["Запуск нового приложения"]
  }]
}

POST /api/intelligence/smart-clusters
Response: {
  clusters: [{
    id: "cluster-1",
    name: "AI-generated name",
    keywords: ["мобильное приложение", "баги"],
    sentiment: -0.45,
    volume: 234,
    growth: 15.6,
    confidence: 0.87,
    examples: ["review text 1", "review text 2"],
    impact: "high",
    actionable: true
  }]
}

POST /api/intelligence/emerging-issues
Response: {
  emerging_issues: [{
    id: "issue-1",
    title: "Проблемы с входом в мобильное приложение",
    first_detected: "2025-09-15T10:00:00Z",
    growth_rate: 25.6,
    current_mentions: 89,
    projected_mentions: 150,
    sentiment: -0.65,
    confidence: 0.82,
    urgency_level: "high",
    key_terms: ["вход", "ошибка", "зависание"],
    recommended_actions: [...]
  }]
}

POST /api/intelligence/anomalies
Response: {
  anomalies: [{
    id: "anomaly-1",
    type: "sentiment_drop",
    title: "Резкое падение sentiment",
    description: "Сентябрь 2024: падение на 4 пункта за неделю",
    detected: "2024-09-01T00:00:00Z",
    severity: "high",
    confidence: 0.91,
    affected_products: ["mobile-app"],
    suggested_actions: [...]
  }]
}

POST /api/analytics/correlations
Response: {
  correlations: [{
    aspect_a: "Скорость",
    aspect_b: "Удовлетворенность",
    correlation: 0.78,
    significance: "high"
  }]
}
```

---

### 5. Reviews (`/reviews`)

**Статус**: ❌ **Захардкоженная статистика - ожидает API**

**Захардкоженные данные в JSX**:
- Статистики: всего отзывов, позитивные/нейтральные/негативные

**Необходимые API endpoints**:
```
POST /api/reviews
Request: {
  date_range: { from, to },
  filters: { sources, products, sentiment },
  search_text: "optional",
  sort_by: "date",
  page: 1,
  limit: 20
}
Response: {
  data: [{
    id: "review-123",
    text: "Отзыв клиента...",
    source: "banki-ru",
    date: "2025-01-15T12:00:00Z",
    sentiment: "positive",
    score: 0.85,
    products: ["credit-cards"],
    aspects: [{
      name: "Служба поддержки",
      sentiment: "positive"
    }],
    author: "User123",
    verified: true
  }],
  total_count: 2847,
  has_more: true
}

POST /api/reviews/statistics
Request: { date_range, filters }
Response: {
  total_reviews: 2847,
  positive: 1936,
  neutral: 683,
  negative: 228,
  positive_percent: 68,
  neutral_percent: 24,
  negative_percent: 8
}
```

---

## 📊 Сводная таблица

| Страница | URL | Статус | Используемые моки | Необходимые API |
|----------|-----|--------|-------------------|-----------------|
| Dashboard | `/` | ✅ **Готово** | - | `/api/config`, `/api/dashboard/overview` |
| Comparative | `/comparative` | ❌ Mock | `getMockSentimentData`, `getMockAspectSentiment` | `/api/comparative/products`, `/api/comparative/aspects` |
| Products | `/products` | ❌ Mock | `productsMatrix`, `aspectPriorities` | `/api/products/performance`, `/api/products/aspect-priorities` |
| Analytics | `/analytics` | ❌ Mock | `heatmapData`, `timeSeriesData`, `customerClusters`, `correlationData` | `/api/analytics/heatmap`, `/api/analytics/time-series`, `/api/intelligence/*`, `/api/analytics/correlations` |
| Reviews | `/reviews` | ❌ Mock | Hardcoded JSX values | `/api/reviews`, `/api/reviews/statistics` |

---

## 🔧 Технические детали

### Существующие API методы в коде

Файл `src/lib/api-services.ts` содержит много методов для несуществующих endpoints:

**Реально работают**:
- ✅ `configApi.getConfig()`
- ✅ `dashboardApiV2.getOverview()`

**НЕ работают (endpoints не существуют)**:
- ❌ `dashboardApi.getSentimentStats()` (DEPRECATED)
- ❌ `reviewsApi.*`
- ❌ `productsApi.*`
- ❌ `intelligenceApi.*`
- ❌ `comparativeApi.*`

**Рекомендация**: Удалить/закомментировать несуществующие методы для избежания путаницы.

---

## 📋 Приоритеты для Backend разработки

### Критичные (для основного функционала)

1. **Reviews API** - `/api/reviews`, `/api/reviews/statistics`
   - Страница отзывов сейчас бесполезна
   - Нужна для полноценной работы приложения

2. **Products Performance API** - `/api/products/performance`
   - Матрица продуктов - ключевая аналитика
   - Влияет на бизнес-решения

### Важные (расширенная аналитика)

3. **Comparative Analysis API** - `/api/comparative/*`
   - Сравнительный анализ продуктов и аспектов
   - Помогает выявлять точки роста

4. **Intelligence API** - `/api/intelligence/smart-clusters`, `/api/intelligence/emerging-issues`, `/api/intelligence/anomalies`
   - ML-функционал, требует сложной обработки
   - Проактивное выявление проблем

### Опциональные (для продвинутой аналитики)

5. **Analytics API** - `/api/analytics/*`
   - Тепловые карты, временные ряды, корреляции
   - Визуализации для глубокого анализа

---

## 🚀 Как добавить новый endpoint

1. **Backend**: Реализовать endpoint согласно спецификации выше
2. **Frontend**:
   - Добавить типы в `src/types/api.ts`
   - Добавить метод в `src/lib/api-services.ts`
   - Создать hook в `src/hooks/` (например `useReviews()`)
   - Использовать в компоненте
   - Убрать mock данные и `<MockDataWarning />`

---

## 📞 Контакты

Для вопросов по интеграции API:
- Backend: http://72.56.64.34:8000/docs
- Frontend repo: этот проект
