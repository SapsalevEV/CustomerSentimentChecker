import asyncio
import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)


def log_sync_execution_time(func):
    """
    Декоратор для синхронных функций.
    Логирует время выполнения.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"✅ [SYNC] '{func.__name__}' завершён за {duration:.2f} сек.")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ [SYNC] Ошибка в '{func.__name__}' за {duration:.2f} сек.: {type(e).__name__}: {e}")
            raise
    return wrapper


def log_async_execution_time(func):
    """
    Декоратор для асинхронных функций.
    Логирует время выполнения.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            logger.info(f"✅ [ASYNC] '{func.__name__}' завершён за {duration:.2f} сек.")
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ [ASYNC] Ошибка в '{func.__name__}' за {duration:.2f} сек.: {type(e).__name__}: {e}")
            raise
    return wrapper