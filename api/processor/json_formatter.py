from typing import Dict, Any, List, Union
import json

from pydantic import ValidationError

from shemas.models import InputData, Prediction, OutputData
from utils.json_utils import parse_model_response


class JsonFormatter:
    """
    Форматировщик на основе Pydantic моделей.
    Автоматически валидирует вход и формирует выход.
    """

    @staticmethod
    def format_input(user_prompts: Union[Dict, str]) -> Union[Dict[int, str], Dict[str, str]]:
        try:
            # Парсим JSON
            if isinstance(user_prompts, str):
                data_dict = json.loads(user_prompts, encoding='utf-8')
            else:
                data_dict = user_prompts
            # Валидируем с помощью Pydantic
            input_data = InputData(**data_dict)
            # Преобразуем в {id: text}
            return {item.id: item.text for item in input_data.data}

        except json.JSONDecodeError as e:
            raise ValueError(f"Невозможно распарсить JSON: {str(e)}")
        except ValidationError as e:
            error_msg = "; ".join([f"{err['loc'][-1]}: {err['msg']}" for err in e.errors()])
            raise ValueError(f"Невалидные данные: {error_msg}")
        except Exception as e:
            raise ValueError(f"Ошибка обработки ввода: {str(e)}")

    @staticmethod
    def format_output(results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Формирует финальный ответ на основе списка результатов.
        Использует OutputData для валидации/формирования.
        """
        predictions = []
        error_messages = []

        for item in results:
            if "errors" in item:
                error_messages.append(item["errors"])
                continue

            item_id = list(item.keys())[0]
            raw_response = item.get(item_id)
            error = item.get("error")

            if error:
                error_messages.append(f"item_id={item_id}: {error}")
                predictions.append(Prediction(id=item_id))
                continue

            if not raw_response:
                predictions.append(Prediction(id=item_id))
                continue

            try:
                parsed = parse_model_response(raw_response)
                pred_list = parsed.get("predictions", [])

                topics = pred_list.get("topics", [])
                sentiments = pred_list.get("sentiments", [])
                if not isinstance(topics, list): topics = []
                if not isinstance(sentiments, list): sentiments = []

                predictions.append(Prediction(
                    id=item_id,
                    topics=[str(t) for t in topics],
                    sentiments=[str(s) for s in sentiments]
                ))

            except Exception as e:
                error_messages.append(f"Ошибка парсинга LLM для item_id={item_id}: {e}")
                predictions.append(Prediction(id=item_id))

        # Создаём объект вывода
        output_data = OutputData(
            predictions=predictions,
            warnings="; ".join(error_messages) if error_messages else None
        )

        # Конвертируем в словарь
        return output_data.model_dump(exclude_none=True)