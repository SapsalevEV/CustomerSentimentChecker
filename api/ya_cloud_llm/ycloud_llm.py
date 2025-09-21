from abc import ABC, abstractmethod

from yandex_cloud_ml_sdk import YCloudML


class YCloudLLM(ABC):
    """
    Абстрактный класс для обработки запросов к Yandex Cloud Foundation Models.
    Позволяет легко менять реализацию (sync/async).
    """
    def __init__(self, folder_id: str, api_key: str, model_name: str = "yandexgpt-lite"):
        self.folder_id = folder_id
        self.api_key = api_key
        self.model_name = model_name
        self.model_uri = f"gpt://{folder_id}/{model_name}/latest"

    @abstractmethod
    def process_item(self, user_prompt: str, system_prompt: str) -> str:
        raise NotImplementedError()



class SyncYCloudLLM(YCloudLLM):
    """
    Реализация для синхронного использования.
    """
    def __init__(self, folder_id: str, api_key: str, model_name: str = "yandexgpt-lite"):
        super().__init__(folder_id, api_key, model_name)
        self.sdk = YCloudML(folder_id=folder_id, auth=api_key)
        self.model = self.sdk.models.completions(self.model_uri).configure(temperature=0.3, max_tokens=2000)

    def process_item(self, user_prompt: str, system_prompt: str) -> str:
        """
        Возвращает сырой текст от LLM.
        При ошибке — пробрасывает исключение наверх.
        """
        try:
            result = self.model.run([
                {"role": "system", "text": system_prompt},
                {"role": "user", "text": user_prompt}
            ])

            return result[0].text.strip()

        except Exception as e:
            raise
