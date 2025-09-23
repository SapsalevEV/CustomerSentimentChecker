from dotenv import load_dotenv
import os
import logging

# Загружаем переменные окружения
load_dotenv()

# Настраиваем логгер
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("app.log", encoding="utf-8"),
        logging.StreamHandler()
    ],
    force=True
)

logger = logging.getLogger(__name__)

# Импортируем после настройки логгера
from processor.review_processor import YaReviewProcessor
from backend.app import create_app
from backend.routes import router

# Загружаем конфигурацию
FOLDER_ID = os.getenv("YANDEX_CLOUD_FOLDER")
YA_API_KEY = os.getenv("YA_GPT_API_KEY")

if not FOLDER_ID or not YA_API_KEY:
    logger.critical("Не заданы YANDEX_CLOUD_FOLDER или YA_GPT_API_KEY")
    exit(1)

# Инициализируем процессор
processor = YaReviewProcessor(
    folder_id=FOLDER_ID,
    api_key=YA_API_KEY,
    model_name="llama"  # или yandexgpt-lite
)

# Создаём приложение
app = create_app()
# Кладём процессор в состояние приложения
app.state.processor = processor

# Монтируем роутер
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    logger.info("Запуск сервера на http://0.0.0.0:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")