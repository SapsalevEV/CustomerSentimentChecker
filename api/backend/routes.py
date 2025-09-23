# backend/routes.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import logging

from processor.json_formatter import JsonFormatter
from processor.prompts import TOPICS_SENTIMENTS_PROMPT
from shemas.models import AnalyzeRequest

router = APIRouter()

# Настройка логгера
logger = logging.getLogger(__name__)

# Эти объекты будут переданы через зависимость или созданы здесь
formatter = JsonFormatter()


@router.post("/analyze", response_model=dict)
async def analyze(
        request_body: AnalyzeRequest,
        request: Request
):
    # Получаем processor из состояния приложения
    processor = request.app.state.processor

    try:
        # Получаем JSON из тела запроса
        body = await request.json()
        logger.info(f"Получен запрос на анализ: {len(body.get('data', []))} отзывов")

        # Обработка
        result = processor.process_batch_threads(
            system_prompt=TOPICS_SENTIMENTS_PROMPT,
            user_prompts=body,
            max_workers=4
        )
        return result

    except ValueError as e:
        # Ошибки валидации входных данных
        logger.warning(f"Ошибка валидации: {e}")
        return {
            "predictions": [],
            "warnings": f"Invalid input: {str(e)}"
        }

    except Exception as e:
        # Неожиданные ошибки
        logger.error(f"Неизвестная ошибка при обработке: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


