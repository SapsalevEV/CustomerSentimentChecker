# Actionable Sentiment Frontend

Платформа Customer Voice Analytics для анализа тональности отзывов и обратной связи клиентов.

## Технологический стек

- **React 18** с TypeScript
- **Vite** - сборщик и dev-сервер
- **React Router v6** - маршрутизация
- **React Query (TanStack Query)** - управление серверным состоянием
- **shadcn/ui** - UI компоненты на базе Radix UI
- **Tailwind CSS** - стилизация
- **Recharts** - графики и визуализация данных
- **Lucide React** - иконки

## Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Настройка окружения

Создайте файл `.env` в корне проекта:

```bash
# Backend API
VITE_API_BASE_URL="http://72.56.64.34:8000"

# Supabase (опционально, legacy)
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="..."
```

### Команды разработки

```bash
# Запуск dev-сервера (порт 8080)
npm run dev

# Сборка production
npm run build

# Сборка с source maps (для разработки)
npm run build:dev

# Проверка кода (ESLint)
npm run lint

# Предпросмотр production сборки
npm run preview
```

## Структура проекта

```
src/
├── components/          # React компоненты
│   ├── ui/             # shadcn/ui базовые компоненты
│   ├── dashboard/      # Компоненты дашборда
│   ├── filters/        # Фильтры (источники, продукты, даты)
│   ├── layout/         # Лейаут (sidebar, topbar)
│   └── common/         # Общие компоненты
├── pages/              # Страницы-маршруты
│   ├── Index.tsx       # Главная - дашборд
│   ├── Products.tsx    # Анализ продуктов
│   ├── Reviews.tsx     # Список отзывов
│   ├── Analytics.tsx   # Углубленная аналитика
│   └── ComparativeAnalysis.tsx
├── contexts/           # React Context провайдеры
│   ├── UnifiedFiltersContext.tsx  # Главный контекст фильтров
│   └── AppDataProvider.tsx        # Обертка всех провайдеров
├── hooks/              # Кастомные React хуки
│   ├── useDashboardData.ts  # Данные дашборда
│   ├── useConfig.ts         # Конфигурация (источники, продукты)
│   └── useFilters.ts        # Работа с фильтрами
├── lib/                # Утилиты и сервисы
│   ├── api-client.ts        # HTTP клиент
│   ├── api-services.ts      # API методы по доменам
│   ├── mock-data.ts         # Моковые данные
│   └── utils.ts             # Вспомогательные функции
├── types/              # TypeScript типы
│   ├── api.ts          # Типы API (из OpenAPI)
│   └── index.ts        # Внутренние типы
└── App.tsx             # Главный компонент с роутингом
```

## Архитектура

### Управление состоянием

**UnifiedFiltersContext** - центральное место для всех фильтров:
- Состояние фильтров (даты, источники, продукты, аспекты, тональность)
- Динамическая загрузка конфигурации из API
- Методы кросс-фильтрации (filterByProduct, filterByAspect, filterBySentiment)

```typescript
import { useFilters } from '@/contexts/AppDataProvider';

function MyComponent() {
  const {
    dateRange,
    selectedSources,
    selectedProducts,
    setDateRange,
    setSelectedSources
  } = useFilters();

  // ...
}
```

### Интеграция с API

**API Client** (`src/lib/api-client.ts`)
- Singleton HTTP клиент для всех запросов
- Базовый URL из `VITE_API_BASE_URL`
- Поддержка токен-аутентификации

**API Services** (`src/lib/api-services.ts`)
- Сервисные функции по доменам:
  - `configApi` - конфигурация (источники, продукты, пресеты дат)
  - `dashboardApiV2` - данные дашборда (актуальный)
  - `reviewsApi` - список отзывов
  - `productsApi` - анализ продуктов
  - `intelligenceApi` - ML-фичи (кластеры, аномалии)
  - `comparativeApi` - сравнительный анализ

**React Query хуки**
- Кэширование и автоматическое обновление данных
- Стратегия кэширования:
  - Конфигурация: `staleTime: Infinity` (не обновляется)
  - Дашборд: `staleTime: 5 минут`, автообновление при смене фильтров

```typescript
import { useDashboardData, useMetrics } from '@/hooks/useDashboardData';

function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const metrics = useMetrics();

  // ...
}
```

### Паттерн маппинга данных

API возвращает данные в формате snake_case, которые маппятся во внутренний формат camelCase:

```typescript
// Формат API (backend)
{
  metrics: {
    total_reviews: {
      current: 2847,
      trend: { direction: "up", change: 245 }
    }
  }
}

// Внутренний формат (frontend)
{
  totalReviews: 2847,
  trendData: { /* ... */ }
}
```

### Path Aliases

Настроен алиас `@/` → `./src/`:

```typescript
import { Button } from "@/components/ui/button";
import { useFilters } from "@/contexts/AppDataProvider";
```

## Статус интеграции с API

**Работающие endpoints:**
- ✅ `GET /health` - проверка здоровья API
- ✅ `GET /api/config` - конфигурация (источники, продукты)
- ✅ `POST /api/dashboard/overview` - данные дашборда

**Статус страниц:**
- ✅ Дашборд (Index) - 100% реальные данные из API
- ❌ Сравнительный анализ - моковые данные
- ❌ Продукты - моковые данные
- ❌ Аналитика - моковые данные
- ❌ Отзывы - моковые данные

Страницы с моковыми данными отображают предупреждающий баннер.

Подробный статус: см. `API_INTEGRATION_STATUS.md`

## Тестирование API

```bash
# Проверка здоровья API
curl http://72.56.64.34:8000/health

# Получение конфигурации
curl http://72.56.64.34:8000/api/config

# Получение данных дашборда
curl -X POST http://72.56.64.34:8000/api/dashboard/overview \
  -H "Content-Type: application/json" \
  -d '{
    "date_range": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z"
    },
    "filters": {
      "sources": [],
      "products": []
    }
  }'
```

## Добавление нового API endpoint

1. Проверьте, что endpoint существует на backend
2. Добавьте типы в `src/types/api.ts`
3. Создайте метод в `src/lib/api-services.ts`
4. Создайте/обновите хук в `src/hooks/`
5. Используйте хук в компоненте
6. Удалите `<MockDataWarning>` со страницы
7. Обновите `API_INTEGRATION_STATUS.md`

## Добавление новой страницы

1. Создайте компонент в `src/pages/`
2. Добавьте маршрут в `src/App.tsx` (ПЕРЕД catch-all `*`)
3. Добавьте ссылку в `src/components/layout/AppSidebar.tsx`

## UI Компоненты

Проект использует **shadcn/ui** - коллекцию переиспользуемых компонентов:
- Полная типизация TypeScript
- Доступность (ARIA) из коробки
- Кастомизация через Tailwind CSS
- Поддержка тем (светлая/темная)

Компоненты находятся в `src/components/ui/`.

## Особенности

- **Строгий TypeScript** - все типы явно определены
- **Empty array = all** - пустой массив фильтров означает "все", а не "ничего"
- **Graceful degradation** - при ошибках API показываются моковые данные
- **ISO 8601 даты** - для API используется ISO 8601 формат

## Документация для разработчиков

- `CLAUDE.md` - подробная документация для AI-ассистента
- `API_INTEGRATION_STATUS.md` - статус интеграции с backend API

## Лицензия

Proprietary
