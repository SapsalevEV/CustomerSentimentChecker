"""
Model configurator for customizing LLM runtime parameters.

This module provides functionality for configuring LLM models at runtime,
applying custom parameters and overrides.
"""

import logging
from typing import Any, Dict, Optional, Union

from langchain_core.language_models.llms import LLM

from ..utils.config_manager import ConfigManager
from .model_registry import ModelInfo, ModelRegistry

logger = logging.getLogger(__name__)


class ModelConfigurator:
    """
    Configurator for customizing LLM runtime parameters.
    
    This class handles runtime configuration of LLM models, applying parameters
    from the model registry and runtime overrides.
    """
    
    def __init__(self, model_registry: ModelRegistry) -> None:
        """
        Initialize the model configurator.
        
        Args:
            model_registry: The model registry instance containing model metadata.
        """
        self._model_registry = model_registry
        self._config_manager = ConfigManager()
    
    def get_model_parameters(
        self, model_name: Optional[str] = None, override_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get configured parameters for a model.
        
        Args:
            model_name: Name of the model to configure. If None, uses the default model.
            override_params: Optional dictionary of parameter overrides.
            
        Returns:
            Dictionary of model parameters combining defaults and overrides.
        """
        model_info = self._model_registry.get_model_info(model_name)
        
        if not model_info:
            if model_name:
                logger.warning(f"Model '{model_name}' not found. Using default parameters.")
            else:
                logger.warning("No default model found. Using empty parameters.")
            
            # Try to get parameters from config directly
            if model_name:
                default_params = self._config_manager.get_value("parameters.default", {})
                model_specific_params = self._config_manager.get_value(
                    f"parameters.model_specific.{model_name}", 
                    {}
                )
                params = {**default_params, **model_specific_params}
            else:
                params = {}
                
            # Apply override parameters if provided
            if override_params:
                params.update(override_params)
                
            return params
            
        # Start with default parameters from model info
        params = dict(model_info.parameters or {})
        
        # Apply override parameters if provided
        if override_params:
            params.update(override_params)
            
        return params
    
    def apply_parameters(self, llm: LLM, model_name: Optional[str] = None, 
                        override_params: Optional[Dict[str, Any]] = None) -> LLM:
        """
        Apply parameters to an LLM instance.
        
        Args:
            llm: The LLM instance to configure.
            model_name: Name of the model to use parameters from. If None, uses the default model.
            override_params: Optional dictionary of parameter overrides.
            
        Returns:
            The configured LLM instance.
            
        Note:
            This method attempts to set parameters on the LLM instance. Not all parameters
            may be applicable to all LLM types, and some may be ignored.
        """
        params = self.get_model_parameters(model_name, override_params)
        
        # Apply parameters to the LLM
        for key, value in params.items():
            try:
                # Use setattr for dynamic attribute setting
                setattr(llm, key, value)
            except AttributeError:
                logger.warning(f"Parameter '{key}' could not be set on LLM of type {type(llm).__name__}")
        
        return llm
    
    def create_model_config(
        self, model_name: Optional[str] = None, override_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a configuration dictionary for model initialization.
        
        Args:
            model_name: Name of the model to configure. If None, uses the default model.
            override_params: Optional dictionary of parameter overrides.
            
        Returns:
            Dictionary containing configuration to initialize the model.
        """
        if model_name is None:
            model_name = self._model_registry.get_default_model_name()
        
        model_info = self._model_registry.get_model_info(model_name)
        if not model_info:
            logger.warning(f"Model '{model_name}' not found in registry. Using basic configuration.")
            # Create base configuration with model name
            config = {"model": model_name} if model_name else {}
            
            # Apply parameters
            params = self.get_model_parameters(model_name, override_params)
            config.update(params)
            
            return config
            
        # Create base configuration with model name
        config = {"model": model_info.name}
        
        # Apply model parameters
        params = self.get_model_parameters(model_name, override_params)
        config.update(params)
            
        return config