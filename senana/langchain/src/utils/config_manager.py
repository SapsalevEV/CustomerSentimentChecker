"""
Configuration manager for centralized access to settings.

This module provides a centralized way to access configuration values
throughout the application, avoiding repeated file reads.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from .config_loader import ConfigLoader

logger = logging.getLogger(__name__)


class ConfigManager:
    """
    Singleton class for managing configuration settings.
    
    This class provides centralized access to configuration values
    and caches them to avoid repeated file reads.
    """
    
    _instance = None
    _configs: Dict[str, Dict[str, Any]] = {}
    
    def __new__(cls):
        """Ensure singleton pattern."""
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the config manager."""
        if not getattr(self, "_initialized", False):
            self._configs = {}
            self._initialized = True
    
    def get_config(self, config_name: str = "llm_config.yml") -> Dict[str, Any]:
        """
        Get a configuration by name.
        
        Args:
            config_name: The name of the configuration file.
        
        Returns:
            The configuration dictionary.
        """
        # Check if we've already loaded this config
        if config_name in self._configs:
            return self._configs[config_name]
            
        try:
            # Try to load the config
            config_path = ConfigLoader.get_config_path(config_name)
            config = ConfigLoader.load_config(config_path)
            self._configs[config_name] = config
            return config
        except (FileNotFoundError, Exception) as e:
            logger.warning(f"Could not load config {config_name}: {e}")
            # Return empty config if file not found
            self._configs[config_name] = {}
            return {}
    
    def get_value(
        self, 
        path: str, 
        default: Any = None, 
        config_name: str = "llm_config.yml"
    ) -> Any:
        """
        Get a value from a configuration.
        
        Args:
            path: The path to the value using dot notation (e.g., "models.default").
            default: The default value to return if the path doesn't exist.
            config_name: The name of the configuration file.
        
        Returns:
            The value at the path or the default value.
        """
        config = self.get_config(config_name)
        return ConfigLoader.get_or_default(config, path, default)
    
    def get_model_param(
        self,
        model_name: str,
        param_name: str,
        default: Any = None
    ) -> Any:
        """
        Get a model-specific parameter.
        
        Args:
            model_name: The name of the model.
            param_name: The name of the parameter.
            default: The default value to return if the parameter doesn't exist.
        
        Returns:
            The parameter value or the default value.
        """
        # First try model-specific parameter
        specific_value = self.get_value(
            f"parameters.model_specific.{model_name}.{param_name}", 
            None
        )
        if specific_value is not None:
            return specific_value
            
        # Fall back to default parameter
        return self.get_value(f"parameters.default.{param_name}", default)
    
    def get_default_model(self) -> str:
        """
        Get the default model name.
        
        Returns:
            The default model name or an empty string if not configured.
        """
        return self.get_value("models.default", "")
    
    def get_ollama_base_url(self) -> str:
        """
        Get the Ollama base URL.
        
        Returns:
            The Ollama base URL.
        """
        # Get from config, with fallback to environment variable or default
        return self.get_value(
            "ollama.base_url", 
            os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        )
    
    def get_ollama_timeout(self) -> int:
        """
        Get the Ollama API timeout.
        
        Returns:
            The timeout in seconds.
        """
        return self.get_value("ollama.timeout", 30)
    
    def get_alternative_models(self) -> list:
        """
        Get a list of alternative models.
        
        Returns:
            A list of alternative models.
        """
        return self.get_value("models.alternatives", [])
