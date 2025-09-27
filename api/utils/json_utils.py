import json
import re
import pandas as pd
from typing import Optional, Dict, Any
import random



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


def load_reviews_to_json(
        file_path: str,
        n_rows: Optional[int] = None,
        shuffle: bool = False,
        seed: int = 42
) -> str:
    """
    Загружает CSV с колонками 'id', 'text' и возвращает JSON в формате:
    {
      "data": [
        {"id": 1, "text": "отзыв1"},
        ...
      ]
    }

    """
    df = pd.read_csv(file_path, nrows=n_rows)

    # Проверяем обязательные столбцы
    if "id" not in df.columns or "text" not in df.columns:
        raise ValueError(f"CSV должен содержать столбцы 'id' и 'text'. Доступны: {list(df.columns)}")

    # Перемешиваем, если нужно
    if shuffle:
        df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    # Обрезаем до нужного числа строк (если n_rows задано отдельно)
    if n_rows is not None:
        df = df.head(n_rows)

    # Конвертируем в JSON-строку
    data_list = df[["id", "text"]].to_dict(orient="records")
    result =  json.dumps({"data": data_list}, ensure_ascii=False, indent=2)

    # Сохраняем JSON в файл
    with open("test_input.json", "w", encoding="utf-8") as f:
        f.write(result)

    return result