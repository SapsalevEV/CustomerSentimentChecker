"""
Example of using the model management components.

This script demonstrates how to use the ModelLoader, ModelRegistry,
and ModelConfigurator components to load and configure LLM models.
"""

import logging
import os
import sys
import traceback
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.llm.model_loader import ModelLoader
from src.utils.config_manager import ConfigManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def main():
    """
    Example of using model management components.
    """
    logger.info("Initializing ModelLoader...")
    
    try:
        # Print current working directory to help with debugging
        logger.info(f"Current working directory: {os.getcwd()}")
        
        # Print environment variables that might affect configuration
        logger.info(f"OLLAMA_BASE_URL: {os.environ.get('OLLAMA_BASE_URL', 'Not set')}")
        
        # Initialize config manager and load configuration
        config_manager = ConfigManager()
        config = config_manager.get_config("llm_config.yml")
        
        if not config:
            logger.warning("Configuration could not be loaded. Using defaults.")
        else:
            logger.info(f"Configuration loaded successfully. Default model: {config_manager.get_default_model()}")
        
        # Create model loader
        model_loader = ModelLoader()
        
        # Get available models
        available_models = model_loader.get_available_model_names()
        logger.info(f"Available models: {available_models}")
        
        # Get model registry
        registry = model_loader.get_model_registry()
        default_model = registry.get_default_model_name()
        logger.info(f"Default model: {default_model}")
        
        # List all models with their availability
        logger.info("Model information:")
        all_models = registry.get_all_models()
        if not all_models:
            logger.warning("No models found in registry!")
        
        for model in all_models:
            status = "Available" if model.is_available else "Not available"
            logger.info(f"  - {model.name}: {model.description} ({status})")
            
            # Show parameters for the model
            params = model.parameters or {}
            param_str = ", ".join(f"{k}={v}" for k, v in params.items())
            logger.info(f"    Parameters: {param_str}")
        
        # Try to load the default model
        logger.info(f"Loading default model ({default_model or 'none specified'})...")
        llm = model_loader.get_default_model()
        
        if llm:
            # Use the model for a simple inference
            logger.info("Running inference...")
            prompt = """Ты — экспертный ИИ-аналитик, специализирующийся на обработке клиентских отзывов для банков. Твоя задача — проводить детальный, аспектно-ориентированный анализ текста, который предоставляет пользователь. Ты должен выявлять ключевые продукты и услуги, о которых говорит клиент, определять тональность его высказываний по каждому аспекту и классифицировать суть проблем.

Твой ответ ДОЛЖЕН быть предоставлен ИСКЛЮЧИТЕЛЬНО в формате JSON, который строго соответствует следующей Pydantic-схеме. Не добавляй никаких комментариев, объяснений или вводных фраз вне самой JSON-структуры.

<JSON_SCHEMA>
{
"title": "FullReviewAnalysis",
"description": "Полная структурированная анкета для одного отзыва клиента.",
"type": "object",
"properties": {
"review_source": {
"description": "Источник отзыва (например, 'Google Play', 'VK', 'App Store'). Если источник неизвестен, укажи 'Неизвестно'.",
"title": "Review Source",
"type": "string"
},
"timestamp": {
"description": "Дата и время проведения анализа в формате ISO 8601.",
"title": "Timestamp",
"type": "string",
"format": "date-time"
},
"overall_sentiment": {
"description": "Общая итоговая тональность всего отзыва.",
"title": "Overall Sentiment",
"enum": [
"positive",
"negative",
"mixed"
]
},
"aspect_analysis": {
"description": "Список всех упомянутых в отзыве аспектов и их детальный анализ. ",
"title": "Aspect Analysis",
"type": "array",
"items": {
"$ref": "#/definitions/AspectAnalysis"
}
},
"summary": {
"description": "Краткое резюме отзыва в 1-2 предложениях для быстрого понимания сути.",
"title": "Summary",
"type": "string"
}
},
"required": [
"review_source",
"timestamp",
"overall_sentiment",
"aspect_analysis",
"summary"
],
"definitions": {
"AspectAnalysis": {
"title": "AspectAnalysis",
"type": "object",
"properties": {
"aspect_category": {
"description": "Общая категория банковского продукта или услуги.",
"title": "Aspect Category",
"enum": [
"Мобильное приложение",
"Кредитные карты",
"Дебетовые карты",
"Вклады и счета",
"Ипотека",
"Обслуживание в отделении",
"Служба поддержки",
"Банкоматы"
]
},
"specific_mention": {
"description": "Точная цитата или краткое описание аспекта, упомянутого клиентом (например, 'кешбэк', 'очередь', 'интерфейс перевода денег').",
"title": "Specific Mention",
"type": "string"
},
"sentiment": {
[cite_start]"description": "Тональность мнения клиента именно об этом аспекте. ",
"title": "Sentiment",
"enum": [
"positive",
"negative",
"neutral"
]
},
"problem_type": {
"description": "Классификация сути проблемы, если она была высказана.",
"title": "Problem Type",
"enum": [
"Техническая ошибка / Баг",
"Неудобный интерфейс / UX",
"Плохое качество обслуживания",
"Невыгодные условия / Тарифы",
"Недостаток функционала",
"Другое",
"Нет проблемы"
]
}
},
"required": [
"aspect_category",
"specific_mention",
"sentiment",
"problem_type"
]
}
}
}
</JSON_SCHEMA>
Проанализируй следующий отзыв:
'{Если у вас несколько счетов и вкладов на млрд руб. и вы вдруг пропустили штраф, допустим 500₽, который ушел к приставам, то по их наставлению банк спишет деньги и со счетов и с вкладов (без снятия и пополнения), тем самым оставив проценты себе, а Вам предложит передать привет фссп рф. Кстати, если вы положили валюту на счет и открыли Юнион пэй карту, то теперь можете только обменять их на рубли по курсу банка ! А уже банк махнет их по ЦБ и Вам опять спасибо.}'"""
            
            try:
                result = llm.invoke(prompt)
                logger.info(f"Model output:\n{result}")
            except Exception as e:
                logger.error(f"Inference failed: {e}")
                logger.error(f"Error type: {type(e).__name__}")
                logger.error(f"Traceback: {traceback.format_exc()}")
        else:
            logger.warning(
                "Could not load model. Please make sure Ollama is running "
                "and required models are available."
            )
            default_model = registry.get_default_model_name() or config_manager.get_default_model()
            logger.info(
                f"Чтобы исправить ошибку подключения к серверу Ollama:\n"
                f"1. Установите Ollama с сайта https://ollama.com\n"
                f"2. Запустите сервер командой 'ollama serve'\n"
                f"3. Скачайте модель командой 'ollama pull {default_model}'\n"
                f"4. Проверьте, что модель установлена: 'ollama list'\n"
                f"5. Проверьте, что сервер доступен по адресу {config_manager.get_ollama_base_url()}"
            )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")


if __name__ == "__main__":
    main()