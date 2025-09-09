"""
Model registry for managing available LLM models.

This module provides functionality to track and manage available LLM models,
their metadata, and availability status.
"""
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Set

from ..utils.config_loader import ConfigLoader
from ..utils.config_manager import ConfigManager

logger = logging.getLogger(__name__)


@dataclass
class ModelInfo:
    """
    Information about an LLM model.
    
    Attributes:
        name: The name of the model.
        description: A brief description of the model.
        is_available: Whether the model is available for use.
        parameters: Optional dictionary of model-specific parameters.
    """
    name: str
    description: str
    is_available: bool = False
    parameters: Optional[Dict[str, any]] = None


class ModelRegistry:
    """
    Registry for managing LLM models.
    
    This class manages the collection of available models and their metadata,
    loaded from configuration and verified against the local Ollama instance.
    """
    
    def __init__(self, config_path: str = "llm_config.yml") -> None:
        """
        Initialize the model registry.
        
        Args:
            config_path: Path to the model configuration file.
        """
        self._models: Dict[str, ModelInfo] = {}
        self._default_model: str = ""
        self._config_path = config_path
        self._config_manager = ConfigManager()
        self._load_from_config()
    
    def _load_from_config(self) -> None:
        """
        Load model information from configuration.
        """
        try:
            # Get the configuration
            config = self._config_manager.get_config(self._config_path)
            
            if not config:
                logger.warning(f"No configuration found for {self._config_path}")
                self._add_fallback_model()
                return
                
            if "models" not in config:
                logger.warning("'models' section missing from configuration")
                self._add_fallback_model()
                return
            
            # Set default model
            self._default_model = self._config_manager.get_default_model()
            
            if not self._default_model:
                logger.warning("No default model specified in configuration")
                self._add_fallback_model()
                return
            
            # Load default parameters
            default_params = self._config_manager.get_value("parameters.default", {})
            
            # Add default model
            model_params = dict(default_params)
            model_specific_params = self._config_manager.get_value(
                f"parameters.model_specific.{self._default_model}", 
                {}
            )
            model_params.update(model_specific_params)
            
            self._models[self._default_model] = ModelInfo(
                name=self._default_model,
                description=f"Default model ({self._default_model})",
                parameters=model_params
            )
            
            # Add alternative models
            for model in self._config_manager.get_alternative_models():
                name = model.get("name", "")
                if not name or name in self._models:
                    continue
                
                model_params = dict(default_params)
                model_specific_params = self._config_manager.get_value(
                    f"parameters.model_specific.{name}", 
                    {}
                )
                model_params.update(model_specific_params)
                
                self._models[name] = ModelInfo(
                    name=name,
                    description=model.get("description", ""),
                    parameters=model_params
                )
                
        except Exception as e:
            logger.error(f"Error loading model configuration: {e}")
            self._add_fallback_model()
    
    def _add_fallback_model(self) -> None:
        """Add a fallback model when configuration is not available."""
        fallback_model = self._config_manager.get_default_model()
        if not fallback_model:
            # Last resort hardcoded fallback if config is completely unavailable
            fallback_model = "gpt-oss:20b"
            
        logger.warning(f"Using fallback model: {fallback_model}")
        self._default_model = fallback_model
        self._models[fallback_model] = ModelInfo(
            name=fallback_model,
            description=f"Fallback model ({fallback_model})"
        )
    
    def update_model_availability(self, available_models: Set[str]) -> None:
        """
        Update which models are available locally.
        
        Args:
            available_models: Set of model names that are available locally.
        """
        for model_name, model_info in self._models.items():
            model_info.is_available = model_name in available_models
    
    def get_model_info(self, model_name: Optional[str] = None) -> Optional[ModelInfo]:
        """
        Get information about a specific model.
        
        Args:
            model_name: Name of the model to retrieve. If None, returns the default model.
        
        Returns:
            ModelInfo object if found, None otherwise.
        """
        if model_name is None:
            model_name = self._default_model
        
        return self._models.get(model_name)
    
    def get_available_models(self) -> List[ModelInfo]:
        """
        Get list of all available models.
        
        Returns:
            List of ModelInfo objects for all available models.
        """
        return [info for info in self._models.values() if info.is_available]
    
    def get_all_models(self) -> List[ModelInfo]:
        """
        Get list of all models, whether available or not.
        
        Returns:
            List of ModelInfo objects for all models.
        """
        return list(self._models.values())
    
    def get_default_model_name(self) -> str:
        """
        Get the name of the default model.
        
        Returns:
            Name of the default model.
        """
        return self._default_model
    
    def is_model_available(self, model_name: str) -> bool:
        """
        Check if a specific model is available.
        
        Args:
            model_name: Name of the model to check.
        
        Returns:
            True if the model is available, False otherwise.
        """
        model_info = self.get_model_info(model_name)
        return model_info is not None and model_info.is_available