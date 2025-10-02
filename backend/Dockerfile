# Multi-stage build для оптимизации размера образа

# Stage 1: Builder
FROM python:3.12-slim as builder

# Установка системных зависимостей для сборки
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Создание виртуального окружения
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копирование requirements и установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim

# Метаданные образа
LABEL maintainer="actionable-sentiment-backend"
LABEL description="FastAPI backend for bank reviews sentiment analysis"

# Установка системных зависимостей для runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создание пользователя приложения (не root для безопасности)
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Рабочая директория
WORKDIR /app

# Копирование виртуального окружения из builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копирование кода приложения
COPY --chown=appuser:appuser app/ ./app/
COPY --chown=appuser:appuser alembic/ ./alembic/
COPY --chown=appuser:appuser alembic.ini ./

# Создание директорий для данных
RUN mkdir -p /app/database /app/logs && \
    chown -R appuser:appuser /app

# Переключение на непривилегированного пользователя
USER appuser

# Expose порт
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Запуск приложения
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
