"""
Model loader for initializing and managing LLM instances.

This module provides functionality for loading and initializing LLM models
from the Ollama service using LangChain integration.
"""

import logging
import os
from typing import Any, Dict, List, Optional, Set, Type, Union, cast

import requests
from langchain_ollama import OllamaLLM
from langchain_core.language_models.llms import LLM

from ..utils.config_manager import ConfigManager
from .model_configurator import ModelConfigurator
from .model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class ModelLoader:
    """
    Loader for initializing and managing LLM instances.
    
    This class handles loading and initialization of LLM models from
    the Ollama service using LangChain integration.
    """
    
    def __init__(self, config_path: str = "llm_config.yml") -> None:
        """
        Initialize the model loader.
        
        Args:
            config_path: Path to the model configuration file.
        """
        self._config_path = config_path
        self._config_manager = ConfigManager()
        self._base_url = self._config_manager.get_ollama_base_url()
        self._timeout = self._config_manager.get_ollama_timeout()
        
        self._model_registry = ModelRegistry(config_path)
        self._model_configurator = ModelConfigurator(self._model_registry)
        
        # Update model availability status
        self._update_available_models()
        
    def _adapt_ollama_parameters(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Адаптирует параметры для совместимости с OllamaLLM.
        
        Args:
            config: Исходная конфигурация.
            
        Returns:
            Адаптированная конфигурация, совместимая с OllamaLLM.
        """
        adapted_config = dict(config)
        
        # Отображение параметров из стандартного LLM в параметры OllamaLLM
        param_mapping = {
            "max_tokens": "max_tokens",  # В новой версии это уже max_tokens
            "max_length": "max_tokens",  # Для совместимости со старым кодом
        }
        
        # Применяем маппинг параметров
        for old_param, new_param in param_mapping.items():
            if old_param in adapted_config and old_param != new_param:
                if new_param not in adapted_config:
                    adapted_config[new_param] = adapted_config[old_param]
                else:
                    logger.warning(f"Both {old_param} and {new_param} specified, using {new_param}")
                adapted_config.pop(old_param)
        
        # Список параметров, поддерживаемых в последней версии OllamaLLM
        # Обновленный список для langchain-ollama версии 0.0.3+
        supported_params = {
            "model", "base_url", "temperature", "top_p", "top_k",
            "num_ctx", "num_predict", "num_thread", "repeat_penalty",
            "repeat_last_n", "seed", "stop", "tfs_z", "mirostat",
            "mirostat_eta", "mirostat_tau", "num_gpu", "num_batch",
            "callbacks", "max_tokens", "request_timeout", "timeout",
            "format", "keep_alive", "system"
        }
        
        # Проверяем и удаляем неподдерживаемые параметры
        unsupported_params = [k for k in adapted_config if k not in supported_params]
        for param in unsupported_params:
            logger.warning(f"Unsupported parameter '{param}' removed from configuration")
            adapted_config.pop(param)
        
        logger.debug(f"Final OllamaLLM parameters: {adapted_config}")
        return adapted_config
    
    def check_ollama_server(self) -> bool:
        """
        Проверяет доступность сервера Ollama.
        
        Returns:
            True, если сервер доступен, False в противном случае.
        """
        # Пробуем несколько вариантов проверки, чтобы повысить надежность
        methods_to_try = [
            # Метод 1: Проверка версии API
            {
                "url": f"{self._base_url.rstrip('/')}/api/version",
                "method": "get",
                "description": "API version endpoint"
            },
            # Метод 2: Проверка корневого пути (в некоторых версиях работает лучше)
            {
                "url": f"{self._base_url.rstrip('/')}/",
                "method": "get",
                "description": "Root endpoint"
            },
            # Метод 3: Проверка через список моделей
            {
                "url": f"{self._base_url.rstrip('/')}/api/tags",
                "method": "get",
                "description": "API tags endpoint"
            }
        ]
        
        for method in methods_to_try:
            try:
                logger.info(f"Checking Ollama server with {method['description']} at {method['url']}")
                
                if method['method'] == 'get':
                    response = requests.get(method['url'], timeout=self._timeout)
                else:
                    continue
                    
                if response.status_code == 200:
                    logger.info(f"Ollama server is running (via {method['description']})")
                    return True
                else:
                    logger.warning(f"{method['description']} responded with status code: {response.status_code}")
                    # Продолжаем проверять другие методы, даже если этот не сработал
            except requests.RequestException as e:
                logger.warning(f"Checking with {method['description']} failed: {e}")
                # Продолжаем проверять другие методы
        
        # Если все методы проверки не сработали
        logger.error(f"Ollama server seems unavailable at {self._base_url}")
        logger.info(
            "Проверьте следующее:\n"
            "1. Сервер Ollama запущен с помощью команды 'ollama serve'\n"
            f"2. Сервер доступен по адресу {self._base_url}\n"
            "3. Нет проблем с сетью или файерволом\n"
            "4. Попробуйте перезапустить сервер Ollama"
        )
        return False

    def _update_available_models(self) -> None:
        """
        Check Ollama API to determine which models are available locally.
        
        Updates the model registry with the availability status of each model.
        """
        if not self.check_ollama_server():
            # Если сервер не доступен, помечаем все модели как доступные для демонстрации
            model_names = {info.name for info in self._model_registry.get_all_models()}
            logger.info(f"Setting models as available for demonstration: {model_names}")
            self._model_registry.update_model_availability(model_names)
            return
            
        try:
            logger.info(f"Checking for available models at {self._base_url}/api/tags")
            response = requests.get(
                f"{self._base_url}/api/tags",
                timeout=self._timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                # Собираем как полные имена моделей, так и базовые имена
                available_models: Set[str] = set()
                for model in data.get("models", []):
                    # Добавляем полное имя модели (с тегом)
                    available_models.add(model["name"])
                    # Добавляем также базовое имя (без тега)
                    base_name = model["name"].split(":")[0]
                    available_models.add(base_name)
                self._model_registry.update_model_availability(available_models)
                logger.info(f"Available models: {', '.join(available_models)}")
            else:
                logger.warning(
                    f"Failed to fetch available models: {response.status_code}, {response.text}"
                )
                # Set all models as unavailable since we can't check
                self._model_registry.update_model_availability(set())
        except requests.RequestException as e:
            logger.error(f"Error connecting to Ollama API: {e}")
            logger.warning("Cannot determine model availability. Is Ollama running?")
            # Mark all models as available for demonstration purposes
            model_names = {info.name for info in self._model_registry.get_all_models()}
            logger.info(f"Setting models as available for demonstration: {model_names}")
            self._model_registry.update_model_availability(model_names)
    
    def get_available_model_names(self) -> List[str]:
        """
        Get names of all available models.
        
        Returns:
            List of available model names.
        """
        return [model.name for model in self._model_registry.get_available_models()]
    
    def load_model(
        self, model_name: Optional[str] = None, 
        model_params: Optional[Dict[str, Any]] = None
    ) -> Optional[LLM]:
        """
        Load an LLM model with the specified parameters.
        
        Args:
            model_name: Name of the model to load. If None, loads the default model.
            model_params: Optional dictionary of model parameter overrides.
            
        Returns:
            Initialized LLM instance, or None if loading fails.
            
        Raises:
            ValueError: If no models are available in the registry.
        """
        # Проверяем доступность сервера Ollama
        server_available = self.check_ollama_server()
        if not server_available:
            logger.error(
                "Сервер Ollama недоступен. Убедитесь, что он запущен с помощью команды 'ollama serve' "
                f"и доступен по адресу {self._base_url}"
            )
            return None
            
        if model_name is None or model_name == "":
            model_name = self._model_registry.get_default_model_name()
            logger.info(f"Using default model: {model_name}")
            
        # Handle case where no default model is set
        if model_name == "":
            model_name = self._config_manager.get_default_model()
            if not model_name:
                logger.warning("No default model specified in configuration")
                # Check if we have any models in the registry
                available_models = self._model_registry.get_available_models()
                if available_models:
                    model_name = available_models[0].name
                    logger.info(f"Using first available model: {model_name}")
                else:
                    raise ValueError("No models available in the registry")
        
        model_info = self._model_registry.get_model_info(model_name)
        
        if not model_info:
            logger.error(f"Model '{model_name}' not found in registry")
            # Try to recover by using any available model
            available_models = self._model_registry.get_available_models()
            if available_models:
                model_name = available_models[0].name
                model_info = available_models[0]
                logger.info(f"Falling back to available model: {model_name}")
            else:
                raise ValueError("No models available in the registry")
        
        # Проверка наличия модели на сервере
        if server_available:
            try:
                # Проверяем модели через GET запрос к /api/tags
                check_url = f"{self._base_url.rstrip('/')}/api/tags"
                logger.info(f"Checking if model {model_name} is available on server")
                
                try:
                    response = requests.get(check_url, timeout=self._timeout)
                    
                    if response.status_code == 200:
                        models_data = response.json()
                        # Создаем список, включающий как полные имена моделей, так и базовые имена
                        available_models = set()
                        for model in models_data.get("models", []):
                            # Добавляем полное имя модели
                            full_name = model["name"]
                            available_models.add(full_name)
                            # Добавляем базовое имя (без тега)
                            base_name = full_name.split(":")[0]
                            available_models.add(base_name)
                        
                        # Проверяем по точному имени или базовому имени
                        if model_name in available_models:
                            logger.info(f"Model '{model_name}' is available on server")
                            model_info.is_available = True
                        else:
                            # Проверяем полную модель с версией если указано только базовое имя
                            model_found = False
                            for model in models_data.get("models", []):
                                if model["name"].startswith(f"{model_name}:") or model["name"] == model_name:
                                    logger.info(f"Model '{model_name}' is available as '{model['name']}'")
                                    model_info.is_available = True
                                    model_found = True
                                    break
                            
                            if not model_found:
                                logger.warning(
                                    f"Model '{model_name}' not found on server. Please run 'ollama pull {model_name}' to download it."
                                )
                                return None
                    else:
                        logger.warning(f"Failed to check models: {response.status_code}")
                        # В случае ошибки считаем, что модель может быть доступна
                        model_info.is_available = True
                except Exception as e:
                    logger.warning(f"Error checking model availability via /api/tags: {e}")
                    # В случае ошибки считаем, что модель может быть доступна
                    model_info.is_available = True
            except requests.RequestException as e:
                logger.error(f"Error checking model availability: {e}")
                # В случае ошибки считаем, что модель может быть доступна
                model_info.is_available = True
        # Force model to be available for demonstration purposes in development
        else:
            if not model_info.is_available:
                logger.warning(f"Model '{model_name}' is not available locally, but will use it for demonstration")
                model_info.is_available = True
        
        try:
            # Get configuration for model initialization
            config = self._model_configurator.create_model_config(model_name, model_params)
            
            # Add base_url from configuration
            config["base_url"] = self._base_url
            
            # Initialize LLM
            logger.info(f"Loading model: {model_name}")
            # Проверим и адаптируем параметры для OllamaLLM
            adapted_config = self._adapt_ollama_parameters(config)
            return OllamaLLM(**adapted_config)
        
        except Exception as e:
            logger.error(f"Error loading model '{model_name}': {e}")
            return None
    
    def get_default_model(
        self, model_params: Optional[Dict[str, Any]] = None
    ) -> Optional[LLM]:
        """
        Load the default model with the specified parameters.
        
        Args:
            model_params: Optional dictionary of model parameter overrides.
            
        Returns:
            Initialized LLM instance for the default model, or None if loading fails.
        """
        default_model = self._model_registry.get_default_model_name()
        return self.load_model(default_model, model_params)
    
    def get_model_registry(self) -> ModelRegistry:
        """
        Get the model registry instance.
        
        Returns:
            The ModelRegistry instance.
        """
        return self._model_registry
    
    def get_model_configurator(self) -> ModelConfigurator:
        """
        Get the model configurator instance.
        
        Returns:
            The ModelConfigurator instance.
        """
        return self._model_configurator
    
    async def aload_model(
        self, model_name: Optional[str] = None, 
        model_params: Optional[Dict[str, Any]] = None
    ) -> Optional[LLM]:
        """
        Asynchronously load an LLM model with the specified parameters.
        
        Args:
            model_name: Name of the model to load. If None, loads the default model.
            model_params: Optional dictionary of model parameter overrides.
            
        Returns:
            Initialized LLM instance, or None if loading fails.
            
        Note:
            This method currently uses the synchronous implementation but is
            provided for API compatibility with async workflows.
        """
        # Currently Ollama loading in LangChain doesn't have async initialization
        # This is a placeholder for future async implementation
        return self.load_model(model_name, model_params)