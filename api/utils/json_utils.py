import json
import re
from typing import Dict, Any


def parse_model_response(text: str) -> Dict[str, Any]:
    """
    Парсит ответ модели, убирая префиксы вроде 'json', тройные кавычки и пробелы.
    Возвращает словарь.
    """
    # Убираем пробелы по краям
    text = text.strip()

    # Удаляем префикс "json" (регистронезависимо), если он в начале
    text = re.sub(r'^\s*```?json\s*', '', text, flags=re.IGNORECASE)

    # Удаляем закрывающую тройную кавычку, если есть
    text = re.sub(r'```?\s*$', '', text)

    # Ищем первую подстроку, похожую на JSON (начинается с '{' или '[')
    match = re.search(r'[\{\[].*[\}\]]', text, re.DOTALL)
    if not match:
        raise ValueError("JSON не найден в ответе")

    json_str = match.group()

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Не удалось распарсить JSON: {e}")