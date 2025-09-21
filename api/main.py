import logging

from processor.prompts import TOPICS_SENTIMENTS_PROMPT
from processor.review_processor import YaReviewProcessor
from dotenv import load_dotenv
import os


def setup_logger():
    """Настраивает корневой логгер."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler("app.log", encoding="utf-8"),
            logging.StreamHandler()
        ],
        force=True  # Перезаписывает предыдущие настройки
    )

# Загружаем переменные из .env
load_dotenv()

folder_id = os.getenv("YANDEX_CLOUD_FOLDER")
ya_api_key = os.getenv("YA_GPT_API_KEY")


processor = YaReviewProcessor(
    folder_id=folder_id,
    api_key=ya_api_key,
    model_name="llama"  # доступны только  "yandexgpt", "yandexgpt-lite", "llama", "llama-lite"
)


if __name__ == "__main__":
    setup_logger()
    logger = logging.getLogger(__name__)

    # Тест: строка JSON
    reviews =     {
      "data": [
        {"id": 44, "text": "Не могу дозвониться до поддержки. Пришлось ехать в офис. Только там разблокировали карту"},
        {"id": 55, "text": "Карта не работает за границей."}
      ]
    }

    system_prompt = TOPICS_SENTIMENTS_PROMPT

    n_workers = 4
    print(f"--- Тест 2: Многопоточная обработка {n_workers=} ---")
    try:
        results_threaded = processor.process_batch_threads(system_prompt, reviews, max_workers=n_workers)
    except Exception as e:
        results_threaded = []
        logger.error(f"Ошибка в многопоточной обработке: {e}")

    print(f'{results_threaded=}')

    # Запуск приложения
    #app.run()