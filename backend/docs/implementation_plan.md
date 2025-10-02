### **План реализации бэкенда "Actionable Sentiment Analysis"**

> **Важно:** План учитывает существующую структуру БД и необходимость маппинга данных между БД и API требованиями.  
> **Текущие данные:** 1321 отзыв, 3568 аннотаций в базе `bank_reviews.db`

---

## **Приоритеты реализации**

| Приоритет | Этап | Критичность | Зависимости |
|-----------|------|-------------|-------------|
| 🔴 P0 | Этап 0-2 | Критично | Базовая инфраструктура |
| 🟠 P1 | Этап 3-4 | Высокая | Основные API эндпоинты |
| 🟡 P2 | Этап 5 | Средняя | Поиск (может быть временным) |
| 🟢 P3 | Этап 6-7 | Желательно | Тесты и оптимизация |

---

### **Этап 0: Подготовка окружения и изучение БД**

**Задача:** Настроить рабочее окружение, изучить существующую БД, установить зависимости.

**Время:** ~2 часа

**Действия:**

1. **Создание виртуального окружения:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

2. **Создание `requirements.txt`:**
   ```txt
   # Core
   fastapi==0.104.1
   uvicorn[standard]==0.24.0
   pydantic==2.5.0
   pydantic-settings==2.1.0
   python-dotenv==1.0.0
   
   # Database
   sqlalchemy[asyncio]==2.0.23
   aiosqlite==0.19.0
   alembic==1.13.0
   
   # Utilities
   python-slugify==8.0.1
   python-dateutil==2.8.2
   
   # Logging & Monitoring
   structlog==23.2.0
   prometheus-fastapi-instrumentator==6.1.0
   
   # Caching
   fastapi-cache2[redis]==0.2.1
   
   # Testing
   pytest==7.4.3
   pytest-asyncio==0.21.1
   httpx==0.25.2
   pytest-cov==4.1.0
   faker==20.1.0
   
   # Development
   black==23.12.0
   ruff==0.1.8
   mypy==1.7.1
   ```

3. **Установка зависимостей:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Изучение существующей БД:**
   ```bash
   # Проверка структуры БД
   python -c "import sqlite3; conn = sqlite3.connect('database/bank_reviews.db'); 
   cursor = conn.cursor(); 
   cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"'); 
   print([row[0] for row in cursor.fetchall()]); 
   conn.close()"
   ```

5. **Инициализация Git:**
   ```bash
   git init
   git add .gitignore requirements.txt
   git commit -m "Initial commit: project setup"
   ```

6. **Создание `.gitignore`:**
   ```
   venv/
   __pycache__/
   *.pyc
   .env
   *.db-journal
   .pytest_cache/
   .coverage
   htmlcov/
   .mypy_cache/
   .ruff_cache/
   ```

7. **Создание `.env.example`:**
   ```env
   DATABASE_URL=sqlite+aiosqlite:///./database/bank_reviews.db
   ENVIRONMENT=development
   LOG_LEVEL=INFO
   CORS_ORIGINS=["http://localhost:3000"]
   ```

**Результат:** 
- ✅ Окружение настроено
- ✅ Зависимости установлены
- ✅ Структура БД изучена
- ✅ Git инициализирован

### **Этап 1: Создание структуры проекта и базовой конфигурации**

**Задача:** Создать полную структуру проекта с учетом Repository Pattern, middleware и маппингов.

**Время:** ~3-4 часа

**Действия:**

1. **Создание структуры каталогов:**
   ```bash
   mkdir -p app/{api/{v1},core,db,models,repositories,schemas,services,middleware,utils}
   mkdir -p tests/{test_api,test_services,test_repositories}
   mkdir -p alembic/versions
   ```

2. **Создание `__init__.py` файлов:**
   ```bash
   # Windows PowerShell
   Get-ChildItem -Path app -Recurse -Directory | ForEach-Object { New-Item -Path "$($_.FullName)\__init__.py" -ItemType File -Force }
   ```

3. **`app/core/config.py` - Конфигурация приложения:**
   ```python
   from pydantic_settings import BaseSettings
   from typing import List
   
   class Settings(BaseSettings):
       # Database
       DATABASE_URL: str = "sqlite+aiosqlite:///./database/bank_reviews.db"
       
       # Application
       APP_NAME: str = "Actionable Sentiment Backend"
       VERSION: str = "1.0.0"
       ENVIRONMENT: str = "development"
       DEBUG: bool = True
       
       # CORS
       CORS_ORIGINS: List[str] = ["http://localhost:3000"]
       
       # Logging
       LOG_LEVEL: str = "INFO"
       
       # Cache
       CACHE_TTL_CONFIG: int = 3600  # 1 час для /config
       CACHE_TTL_METRICS: int = 300  # 5 минут для метрик
       
       class Config:
           env_file = ".env"
           case_sensitive = True
   
   settings = Settings()
   ```

4. **`app/core/logging.py` - Настройка структурированного логирования:**
   ```python
   import structlog
   import logging
   
   def configure_logging():
       structlog.configure(
           processors=[
               structlog.processors.TimeStamper(fmt="iso"),
               structlog.processors.add_log_level,
               structlog.processors.JSONRenderer()
           ],
           wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
       )
   
   logger = structlog.get_logger()
   ```

5. **`app/core/exceptions.py` - Кастомные исключения:**
   ```python
   class ApplicationException(Exception):
       """Базовое исключение приложения"""
       def __init__(self, message: str, status_code: int = 500):
           self.message = message
           self.status_code = status_code
           super().__init__(self.message)
   
   class DatabaseException(ApplicationException):
       """Ошибки работы с БД"""
       def __init__(self, message: str):
           super().__init__(message, status_code=500)
   
   class NotFoundException(ApplicationException):
       """Ресурс не найден"""
       def __init__(self, message: str = "Resource not found"):
           super().__init__(message, status_code=404)
   
   class ValidationException(ApplicationException):
       """Ошибки валидации"""
       def __init__(self, message: str):
           super().__init__(message, status_code=422)
   ```

6. **`app/core/mappings.py` - Маппинги БД ↔ API:**
   ```python
   """Маппинги между структурой БД и требованиями API"""
   from typing import List
   
   # Sentiment маппинг
   SENTIMENT_DB_TO_API = {
       "позитив": "positive",
       "негатив": "negative",
       "нейтральный": "neutral"
   }
   
   SENTIMENT_API_TO_DB = {v: k for k, v in SENTIMENT_DB_TO_API.items()}
   
   # Products маппинг (виртуальная группировка категорий)
   # Согласно api.md: credit-cards, debit-cards, mortgage, auto-loan, consumer-loan, 
   # deposits, savings, mobile-app, online-banking, support
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
   
   # Sources маппинг (согласно api.md)
   SOURCE_DB_TO_API = {
       "Banki.ru": "banki-ru",
       "Sravni.ru": "irecommend"  # Предположительно Sravni.ru = irecommend
   }
   
   SOURCE_API_TO_DB = {v: k for k, v in SOURCE_DB_TO_API.items()}
   
   def get_categories_for_products(products: List[str]) -> List[str]:
       """Получить категории БД для списка продуктов API"""
       categories = []
       for product in products:
           categories.extend(PRODUCT_TO_CATEGORY_MAPPING.get(product, []))
       return list(set(categories))  # Убрать дубликаты
   
   def get_db_source_names(api_sources: List[str]) -> List[str]:
       """Преобразовать API source names в БД source names"""
       return [SOURCE_API_TO_DB.get(src, src) for src in api_sources]
   ```

7. **`app/db/session.py` - Управление сессиями БД:**
   ```python
   from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
   from app.core.config import settings
   
   # Создание асинхронного движка
   engine = create_async_engine(
       settings.DATABASE_URL,
       echo=settings.DEBUG,
       connect_args={"check_same_thread": False}
   )
   
   # Фабрика сессий
   async_session_factory = async_sessionmaker(
       engine,
       class_=AsyncSession,
       expire_on_commit=False
   )
   
   # Dependency для FastAPI
   async def get_db() -> AsyncSession:
       async with async_session_factory() as session:
           try:
               yield session
           finally:
               await session.close()
   
   # Инициализация БД (настройки SQLite)
   async def init_db():
       async with engine.begin() as conn:
           await conn.execute(text("PRAGMA journal_mode=WAL"))
           await conn.execute(text("PRAGMA synchronous=NORMAL"))
           await conn.execute(text("PRAGMA cache_size=-64000"))
           await conn.execute(text("PRAGMA temp_store=MEMORY"))
   ```

8. **`app/middleware/logging_middleware.py` - Логирование запросов:**
   ```python
   import time
   from starlette.middleware.base import BaseHTTPMiddleware
   from starlette.requests import Request
   from app.core.logging import logger
   
   class LoggingMiddleware(BaseHTTPMiddleware):
       async def dispatch(self, request: Request, call_next):
           start_time = time.time()
           
           response = await call_next(request)
           
           process_time = time.time() - start_time
           logger.info(
               "request_processed",
               method=request.method,
               url=str(request.url),
               status_code=response.status_code,
               process_time_ms=round(process_time * 1000, 2)
           )
           
           return response
   ```

9. **`app/middleware/error_handler.py` - Обработка ошибок:**
   ```python
   from fastapi import Request, status
   from fastapi.responses import JSONResponse
   from app.core.exceptions import ApplicationException
   from app.core.logging import logger
   
   async def application_exception_handler(request: Request, exc: ApplicationException):
       logger.error(
           "application_error",
           error=exc.message,
           status_code=exc.status_code,
           path=request.url.path
       )
       
       return JSONResponse(
           status_code=exc.status_code,
           content={
               "error": exc.message,
               "status_code": exc.status_code,
               "path": request.url.path
           }
       )
   ```

10. **`app/main.py` - Главный файл приложения:**
    ```python
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from contextlib import asynccontextmanager
    
    from app.core.config import settings
    from app.core.logging import configure_logging
    from app.core.exceptions import ApplicationException
    from app.middleware.logging_middleware import LoggingMiddleware
    from app.middleware.error_handler import application_exception_handler
    from app.db.session import init_db
    
    # Lifespan для startup/shutdown событий
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup
        configure_logging()
        await init_db()
        yield
        # Shutdown
        # Здесь можно добавить cleanup
    
    # Создание приложения
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        lifespan=lifespan
    )
    
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom middleware
    app.add_middleware(LoggingMiddleware)
    
    # Exception handlers
    app.add_exception_handler(ApplicationException, application_exception_handler)
    
    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}
    
    # Роутеры будут добавлены позже
    # app.include_router(api_router, prefix="/api")
    ```

**Результат:**
- ✅ Структура проекта создана
- ✅ Базовая конфигурация настроена
- ✅ Логирование и обработка ошибок реализованы
- ✅ Маппинги БД↔API созданы
- ✅ Middleware настроены
- ✅ FastAPI приложение готово к добавлению роутеров

### **Этап 2: Создание моделей SQLAlchemy для существующей БД**

**Задача:** Создать ORM модели, соответствующие СУЩЕСТВУЮЩЕЙ структуре БД, и настроить Alembic.

**Время:** ~4 часа

**⚠️ Важно:** БД уже существует с данными! Модели должны ТОЧНО соответствовать текущей схеме.

**Действия:**

1. **`app/db/base.py` - Базовая модель:**
   ```python
   from sqlalchemy.orm import DeclarativeBase
   
   class Base(DeclarativeBase):
       pass
   ```

2. **`app/models/review.py` - Модель Review:**
   ```python
   from sqlalchemy import Column, Integer, Text, Date, TIMESTAMP, ForeignKey
   from sqlalchemy.orm import relationship
   from app.db.base import Base
   
   class Review(Base):
       __tablename__ = "reviews"
       
       review_id = Column(Integer, primary_key=True)  # ⚠️ НЕ id!
       date = Column(Date, nullable=False)
       text = Column(Text, nullable=False)
       source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
       created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
       
       # Relationships
       source = relationship("Source", back_populates="reviews")
       annotations = relationship("Annotation", back_populates="review", cascade="all, delete-orphan")
   ```

3. **`app/models/annotation.py` - Модель Annotation:**
   ```python
   from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
   from sqlalchemy.orm import relationship
   from app.db.base import Base
   
   class Annotation(Base):
       __tablename__ = "annotations"
       
       id = Column(Integer, primary_key=True, autoincrement=True)
       review_id = Column(Integer, ForeignKey("reviews.review_id"), nullable=False)
       category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
       sentiment_id = Column(Integer, ForeignKey("sentiments.id"), nullable=False)
       summary = Column(Text, nullable=False)
       created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
       
       # Relationships
       review = relationship("Review", back_populates="annotations")
       category = relationship("Category", back_populates="annotations")
       sentiment = relationship("Sentiment", back_populates="annotations")
   ```

4. **`app/models/source.py` - Модель Source:**
   ```python
   from sqlalchemy import Column, Integer, Text, TIMESTAMP
   from sqlalchemy.orm import relationship
   from app.db.base import Base
   
   class Source(Base):
       __tablename__ = "sources"
       
       id = Column(Integer, primary_key=True, autoincrement=True)
       name = Column(Text, nullable=False, unique=True)
       created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
       
       # Relationships
       reviews = relationship("Review", back_populates="source")
   ```

5. **`app/models/category.py` - Модель Category:**
   ```python
   from sqlalchemy import Column, Integer, Text, TIMESTAMP
   from sqlalchemy.orm import relationship
   from app.db.base import Base
   
   class Category(Base):
       __tablename__ = "categories"
       
       id = Column(Integer, primary_key=True, autoincrement=True)
       name = Column(Text, nullable=False, unique=True)
       created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
       
       # Relationships
       annotations = relationship("Annotation", back_populates="category")
   ```

6. **`app/models/sentiment.py` - Модель Sentiment:**
   ```python
   from sqlalchemy import Column, Integer, Text, TIMESTAMP
   from sqlalchemy.orm import relationship
   from app.db.base import Base
   
   class Sentiment(Base):
       __tablename__ = "sentiments"
       
       id = Column(Integer, primary_key=True, autoincrement=True)
       name = Column(Text, nullable=False, unique=True)
       created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
       
       # Relationships
       annotations = relationship("Annotation", back_populates="sentiment")
   ```

7. **`app/models/__init__.py` - Экспорт моделей:**
   ```python
   from app.db.base import Base
   from app.models.review import Review
   from app.models.annotation import Annotation
   from app.models.source import Source
   from app.models.category import Category
   from app.models.sentiment import Sentiment
   
   __all__ = ["Base", "Review", "Annotation", "Source", "Category", "Sentiment"]
   ```

8. **Инициализация Alembic:**
   ```bash
   alembic init alembic
   ```

9. **Настройка `alembic.ini`:**
   ```ini
   # Изменить строку sqlalchemy.url
   sqlalchemy.url = sqlite+aiosqlite:///./database/bank_reviews.db
   ```

10. **Настройка `alembic/env.py`:**
    ```python
    from logging.config import fileConfig
    from sqlalchemy import engine_from_config, pool
    from alembic import context
    
    # Импорт моделей
    from app.models import Base
    from app.core.config import settings
    
    config = context.config
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("+aiosqlite", ""))
    
    if config.config_file_name is not None:
        fileConfig(config.config_file_name)
    
    target_metadata = Base.metadata
    
    # Остальной код по умолчанию...
    ```

11. **⚠️ НЕ создавать миграции для существующей схемы:**
    ```bash
    # НЕ выполнять:
    # alembic revision --autogenerate -m "Initial"
    # alembic upgrade head
    
    # Вместо этого:
    # Создать пустую "базовую" миграцию, чтобы Alembic знал о текущем состоянии
    alembic revision -m "Existing database schema"
    ```

12. **Редактирование созданной миграции (сделать пустой):**
    ```python
    def upgrade() -> None:
        # БД уже существует, ничего не делаем
        pass
    
    def downgrade() -> None:
        # Откат не нужен
        pass
    ```

13. **Применить "пустую" миграцию:**
    ```bash
    alembic upgrade head
    ```

14. **Тестирование моделей:**
    ```bash
    # Создать тестовый скрипт test_models.py
    python -c "
    import asyncio
    from app.db.session import async_session_factory
    from app.models import Review, Source
    from sqlalchemy import select
    
    async def test():
        async with async_session_factory() as session:
            result = await session.execute(select(Review).limit(5))
            reviews = result.scalars().all()
            print(f'✅ Найдено {len(reviews)} отзывов')
            
            result = await session.execute(select(Source))
            sources = result.scalars().all()
            print(f'✅ Источников: {len(sources)}')
    
    asyncio.run(test())
    "
    ```

**Результат:**
- ✅ ORM модели созданы для всех таблиц БД
- ✅ Relationships настроены
- ✅ Alembic инициализирован
- ✅ Базовая миграция создана
- ✅ Модели протестированы на реальной БД

**Checkpoint:** Запустить `uvicorn app.main:app --reload` и проверить `/health`

### **Этап 3: Repository Pattern + Схемы Pydantic + Эндпоинт `/config`**

**Задача:** Создать слой репозиториев, Pydantic схемы и первый работающий эндпоинт.

**Время:** ~5-6 часов

**Действия:**

**3.1. Создание базового репозитория:**

`app/repositories/base.py`:
```python
from typing import Generic, TypeVar, Type, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get_by_id(self, id: int) -> Optional[ModelType]:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())
```

**3.2. Репозитории для справочных данных:**

`app/repositories/config_repository.py` - для получения sources, categories

**3.3. Pydantic схемы:**

`app/schemas/config.py`:
```python
from pydantic import BaseModel
from typing import List

class SourceSchema(BaseModel):
    value: str
    label: str

class ProductSchema(BaseModel):
    value: str
    label: str
    category: str

class ConfigResponse(BaseModel):
    sources: List[SourceSchema]
    products: List[ProductSchema]
    aspects: List[str]
    datePresets: List[dict]
```

**3.4. Сервис с маппингом:**

`app/services/config_service.py` - использует маппинги из `app/core/mappings.py`

**3.5. Роутер:**

`app/api/v1/config.py` - GET `/api/config` с кэшированием

**3.6. API Dependencies:**

`app/api/deps.py`:
```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.repositories.config_repository import ConfigRepository

async def get_config_repository(db: AsyncSession = Depends(get_db)):
    return ConfigRepository(db)
```

**Результат:**
- ✅ Repository Pattern реализован
- ✅ Эндпоинт `/api/config` работает
- ✅ Маппинг БД→API функционирует
- ✅ Справочники возвращаются в нужном формате

**Тест:** `curl http://localhost:8000/api/config`

### **Этап 4: Dashboard API - Консолидированный эндпоинт `/dashboard/overview`**

**Задача:** Реализовать единый эндпоинт с метриками, трендами, sparkline и динамикой тональности.

**Время:** ~8-10 часов (самый сложный этап)

**Ключевые компоненты:**

**4.1. Схемы запроса** (`app/schemas/filters.py`):
```python
class DateRangeSchema(BaseModel):
    from_: datetime = Field(..., alias="from")
    to: datetime

class FiltersSchema(BaseModel):
    sources: List[str] = Field(default_factory=list)
    products: List[str] = Field(default_factory=list)

class OverviewRequest(BaseModel):
    date_range: DateRangeSchema
    filters: FiltersSchema
```

**4.2. Схемы ответа** (`app/schemas/dashboard.py`):
```python
class TrendSchema(BaseModel):
    direction: Literal["up", "down"]
    change: int
    change_percent: int

class MetricSchema(BaseModel):
    current: int
    percentage: Optional[int] = None
    trend: TrendSchema
    sparkline: List[int]

class SentimentDynamicsSchema(BaseModel):
    date: str
    positive: int
    neutral: int
    negative: int
    topics: Optional[List[str]] = None

class OverviewResponse(BaseModel):
    meta: MetaSchema
    metrics: MetricsSchema
    sentiment_dynamics: List[SentimentDynamicsSchema]
```

**4.3. DashboardRepository** (`app/repositories/dashboard_repository.py`):
- `get_metrics_with_trends()` - метрики + тренды за текущий и предыдущий периоды
- `get_sparkline_data()` - данные за последние 7 дней для мини-графиков
- `get_sentiment_dynamics()` - динамика по дням с топ-3 темами
- `get_top_topics_by_date()` - топ-3 категории для каждого дня

**4.4. AggregationService** (`app/services/aggregation_service.py`):
- `calculate_trends()` - сравнение текущего и предыдущего периодов
- `calculate_sparkline()` - массив из 7 значений
- `get_previous_period_filters()` - фильтры для предыдущего периода
- `format_percentage()` - форматирование процентов

**4.5. DashboardService** (`app/services/dashboard_service.py`):
- `get_overview()` - главный метод, координирующий все запросы
- Использует маппинг из `app/core/mappings.py`
- Транслирует sources и products в БД категории

**4.6. Роутер** (`app/api/v1/dashboard.py`):
- `POST /api/dashboard/overview` - единый консолидированный эндпоинт

**Результат:**
- ✅ Эндпоинт `/dashboard/overview` работает
- ✅ Фильтрация реализована полностью (sources, products)
- ✅ Маппинг данных функционирует (БД → API)
- ✅ Метрики включают: current, trend, sparkline
- ✅ Sentiment dynamics с топ-3 темами по каждому дню
- ✅ Агрегации оптимизированы через Views

**Checkpoint:** Тестировать через Swagger UI (`/docs`) с примерами из api.md

---

### **Этап 5: Полнотекстовый поиск (опционально)**

**Задача:** Реализовать поиск, если требуется фронтэндом.

**Время:** ~3-4 часа

**Приоритет:** 🟡 P2 (Низкий - если не требуется фронтэндом на первом этапе)

**Варианты реализации:**

**Вариант A: Временное решение (LIKE):**
- `app/services/search_service.py` - простой LIKE-поиск для MVP
- Быстрая реализация, работает из коробки
- Подходит для небольших объемов данных (<10K отзывов)

**Вариант B: FTS5 (рекомендуемое для production):**
1. **Миграция** `alembic revision -m "Add FTS5"`:
```python
def upgrade():
    op.execute("""
        CREATE VIRTUAL TABLE reviews_fts USING fts5(
            text, content='reviews', content_rowid='review_id'
        );
    """)
    # Заполнение + триггеры для автосинхронизации
```

2. **SearchRepository** с BM25 ранжированием
3. **Роутер** `POST /api/search`

**Результат:**
- ✅ Поиск работает (MVP с LIKE или production с FTS5)
- ✅ Фильтры применяются к результатам
- ✅ Подсветка найденных фрагментов (для FTS5)

**Примечание:** На первом этапе можно отложить, если фронтэнд не использует поиск.

---

### **Этап 6: Тестирование**

**Задача:** Написать comprehensive test suite.

**Время:** ~6-8 часов

**Структура тестов:**

`tests/conftest.py`:
```python
@pytest.fixture
async def test_db():
    """In-memory тестовая БД"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    # Создание схемы + тестовые данные
    yield engine

@pytest.fixture
async def client(test_db):
    """Тестовый HTTP клиент"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

**Категории тестов:**

1. **Unit-тесты** (`tests/test_services/`):
   - Тест маппингов
   - Тест расчета sentiment_score
   - Тест агрегаций

2. **Repository тесты** (`tests/test_repositories/`):
   - Тест фильтрации
   - Тест JOIN запросов

3. **API тесты** (`tests/test_api/`):
   - Тест каждого эндпоинта
   - Тест валидации
   - Тест обработки ошибок

**Запуск:**
```bash
pytest tests/ -v --cov=app --cov-report=html
```

**Результат:**
- ✅ >80% coverage
- ✅ Все эндпоинты протестированы
- ✅ Edge cases покрыты

---

### **Этап 7: Оптимизация, мониторинг и развертывание**

**Задача:** Подготовить к production.

**Время:** ~4-5 часов

**7.1. Кэширование:**
- Декоратор `@cache()` на `/api/config`
- TTL для метрик: 5 минут

**7.2. Мониторинг:**
```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

**7.3. Docker:**

`Dockerfile`:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./database:/app/database
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./database/bank_reviews.db
```

**7.4. README.md:**
- Installation guide
- API documentation link
- Deployment instructions

**7.5. Production чек-лист:**
- [ ] Логирование настроено
- [ ] Ошибки обрабатываются
- [ ] Метрики собираются
- [ ] CORS настроен
- [ ] Rate limiting добавлен (опционально)
- [ ] Health checks работают

**Результат:**
- ✅ Приложение готово к production
- ✅ Docker образ собирается
- ✅ Документация полная

---

## **Итоговая оценка времени:**

| Этап | Часов | Сложность | Приоритет |
|------|-------|-----------|-----------|
| 0. Окружение | 2 | Легко | 🔴 P0 |
| 1. Структура + Config | 4 | Средне | 🔴 P0 |
| 2. Модели БД | 4 | Средне | 🔴 P0 |
| 3. Config API | 6 | Средне | 🟠 P1 |
| 4. Dashboard Overview API | 10 | Сложно | 🔴 P0 |
| 5. Поиск (опционально) | 4 | Средне | 🟡 P2 |
| 6. Тесты | 8 | Средне | 🟢 P3 |
| 7. Production | 5 | Легко | 🟢 P3 |
| **ИТОГО (минимум)** | **26 часов** | **3-4 дня** | **Без поиска и тестов** |
| **ИТОГО (полный)** | **43 часов** | **1 неделя** | **Включая все этапы** |

### **MVP (Минимально рабочий продукт):**
- Этапы 0-4: ~26 часов
- Результат: Работающий эндпоинт `/dashboard/overview` с фильтрацией
- Фронтэнд может полностью интегрироваться

### **Production Ready:**
- Этапы 0-7: ~43 часа
- Результат: Полностью протестированное и оптимизированное приложение

---

## **Критические зависимости:**

```
Этап 0 → Этап 1 → Этап 2 → Этап 3 → Этап 4
                              ↓
                          Этап 5 (параллельно)
                              ↓
                          Этап 6 → Этап 7
```

**Можно делать параллельно:**
- Этапы 5 и 6 (если есть команда)
- Написание тестов параллельно с разработкой

---

---

## **Ключевые изменения в плане реализации (v2.1)**

### **Упрощения:**
1. ✅ Один основной эндпоинт вместо трех (`/dashboard/overview`)
2. ✅ Убран эндпоинт `/critical-issues` (не требуется фронтэндом)
3. ✅ Поиск стал опциональным (Этап 5)
4. ✅ Уменьшено количество схем Pydantic

### **Новые требования:**
1. ✅ Sparkline для всех метрик (массив из 7 значений)
2. ✅ Тренды для всех метрик с direction и change_percent
3. ✅ Топ-3 темы для каждого дня в sentiment_dynamics
4. ✅ Мета-информация в каждом ответе

### **Изменения в сроках:**
- **MVP сократился:** с 30 до 26 часов (убран /critical-issues)
- **Этап 4 остался:** 10 часов (добавились sparkline и топ-3 темы)
- **Этап 5 опционален:** можно отложить на потом

### **Критический путь для MVP:**
```
Этап 0 (2ч) → Этап 1 (4ч) → Этап 2 (4ч) → Этап 4 (10ч)
                                         ↘
                                          Этап 3 (6ч) - параллельно
```

### **Что можно делать параллельно:**
- Этап 3 (`/api/config`) и Этап 4 (`/dashboard/overview`)
- Тесты можно писать параллельно с разработкой
- Docker настройки можно делать на любом этапе

---

**Документ версия:** 2.1  
**Дата обновления:** 2025-10-01  
**Статус:** Адаптирован под новые требования фронтэнда (api.md v2)  
**Связанные документы:** architecture.md, database_api_mapping.md, api.md
