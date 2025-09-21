from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Union, List, Any

from processor.json_formatter import JsonFormatter
from ya_cloud_llm.ycloud_llm import SyncYCloudLLM
import logging

logger = logging.getLogger(__name__)


class YaReviewProcessor:
    """
    Класс для обработки отзывов с использованием Yandex Foundation Models.
    """
    def __init__(self, folder_id: str, api_key: str, model_name: str = "yandexgpt-lite"):
        self.model = SyncYCloudLLM(folder_id=folder_id, api_key=api_key, model_name=model_name)
        self.formatter = JsonFormatter()

    def process_item(self, user_prompt: str, system_prompt: str, item_id: int) -> Dict[int, str]:
        '''
        Функция для обработки отзыва. Без форматирования.
        На входе - отзыв и id, на выходе - словарь {id : ответ модели}.
        '''

        answer = self.model.process_item(user_prompt, system_prompt)
        return {item_id: answer}

    def process_batch_threads(
            self,
            system_prompt: str,
            user_prompts: str,
            max_workers: int = 2
    ) -> Dict:
        """
        Параллельная обработка с помощью потоков.
        Принимает и возвращает словари. Формат входного и выходного словарей задается в api_formatter
        """
        results = []
        # проверяем входные данные на соответствие шаблону. приводим к единому формату {id : отзыв}
        logger.debug("✅ Проверка входных данных...")
        user_prompts_formatted = self.formatter.format_input(user_prompts)
        logger.debug("✅ Получен корректный формат данных.")
        if "errors" in user_prompts_formatted.keys():
            return self.formatter.format_output(user_prompts_formatted)

        # запускаем обработку в потоках
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Создаём задачи: submit(метод, user_prompt, system_prompt, item_id)
            future_to_id = {}

            for item_id, text in user_prompts_formatted.items():
                logger.debug(f"🧵 Готовим задачу: item_id={item_id}, тип={type(item_id)}, текст='{text[:50]}...'")
                future = executor.submit(self.process_item, text, system_prompt, item_id)
                future_to_id[future] = item_id

            # Собираем результаты по мере готовности
            for future in as_completed(future_to_id):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    item_id = future_to_id[future]
                    logger.error(f"❌ Ошибка при обработке item_id={item_id}: {e}")
                    results.append({
                        item_id : []
                    })
        # возвращаем текст в нужном формате
        logger.debug('✅ Получены результаты обработки.')
        return self.formatter.format_output(results)







