"""
Tests for the model management components.
"""

import os
import unittest
from unittest.mock import MagicMock, patch

import pytest

from senana.langchain.src.llm.model_configurator import ModelConfigurator
from senana.langchain.src.llm.model_loader import ModelLoader
from senana.langchain.src.llm.model_registry import ModelInfo, ModelRegistry


class TestModelRegistry(unittest.TestCase):
    """Tests for the ModelRegistry class."""
    
    @patch('senana.langchain.src.llm.model_registry.ConfigLoader.load_config')
    def test_load_from_config(self, mock_load_config):
        """Test loading models from configuration."""
        mock_load_config.return_value = {
            "models": {
                "default": "test_model",
                "alternatives": [
                    {"name": "alt_model", "description": "Alternative model"}
                ]
            },
            "parameters": {
                "default": {"temperature": 0.7},
                "model_specific": {
                    "test_model": {"temperature": 0.5}
                }
            }
        }
        
        registry = ModelRegistry()
        
        # Check default model
        assert registry.get_default_model_name() == "test_model"
        
        # Check model info
        default_model = registry.get_model_info("test_model")
        assert default_model is not None
        assert default_model.name == "test_model"
        assert default_model.parameters.get("temperature") == 0.5
        
        # Check alternative model
        alt_model = registry.get_model_info("alt_model")
        assert alt_model is not None
        assert alt_model.name == "alt_model"
        assert alt_model.description == "Alternative model"
        assert alt_model.parameters.get("temperature") == 0.7
    
    def test_update_model_availability(self):
        """Test updating model availability."""
        registry = ModelRegistry()
        
        # Create mock models in registry
        registry._models = {
            "model1": ModelInfo(name="model1", description="Model 1"),
            "model2": ModelInfo(name="model2", description="Model 2"),
        }
        
        # Update availability
        registry.update_model_availability({"model1"})
        
        # Check availability
        assert registry.is_model_available("model1") is True
        assert registry.is_model_available("model2") is False
        
        # Check available models list
        available = registry.get_available_models()
        assert len(available) == 1
        assert available[0].name == "model1"


class TestModelConfigurator(unittest.TestCase):
    """Tests for the ModelConfigurator class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.registry = MagicMock()
        self.configurator = ModelConfigurator(self.registry)
    
    def test_get_model_parameters(self):
        """Test getting model parameters."""
        # Mock model info
        model_info = ModelInfo(
            name="test_model",
            description="Test model",
            is_available=True,
            parameters={"temperature": 0.7, "max_tokens": 2000}
        )
        self.registry.get_model_info.return_value = model_info
        
        # Get parameters without overrides
        params = self.configurator.get_model_parameters("test_model")
        assert params["temperature"] == 0.7
        assert params["max_tokens"] == 2000
        
        # Get parameters with overrides
        params = self.configurator.get_model_parameters(
            "test_model", {"temperature": 0.5, "top_p": 0.95}
        )
        assert params["temperature"] == 0.5
        assert params["top_p"] == 0.95
        assert params["max_tokens"] == 2000
    
    def test_create_model_config(self):
        """Test creating model configuration."""
        # Mock model info
        model_info = ModelInfo(
            name="test_model",
            description="Test model",
            is_available=True,
            parameters={"temperature": 0.7, "max_tokens": 2000}
        )
        self.registry.get_model_info.return_value = model_info
        
        # Create config
        config = self.configurator.create_model_config("test_model")
        assert config["model"] == "test_model"
        assert config["temperature"] == 0.7
        assert config["max_tokens"] == 2000


@pytest.mark.integration
class TestModelLoader:
    """Integration tests for the ModelLoader class."""
    
    @pytest.fixture
    def model_loader(self):
        """Create a ModelLoader instance for testing."""
        return ModelLoader()
    
    @patch('senana.langchain.src.llm.model_loader.requests.get')
    def test_update_available_models(self, mock_get, model_loader):
        """Test updating available models from API."""
        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "models": [
                {"name": "llama3:latest"},
                {"name": "mistral:latest"}
            ]
        }
        mock_get.return_value = mock_response
        
        # Call method (happens in __init__ but we can call it again for testing)
        model_loader._update_available_models()
        
        # Verify model registry was updated
        expected_models = {"llama3", "mistral"}
        model_loader._model_registry.update_model_availability.assert_called_once_with(expected_models)
    
    @patch('senana.langchain.src.llm.model_loader.Ollama')
    def test_load_model(self, mock_ollama, model_loader):
        """Test loading a model."""
        # Mock the model registry
        model_info = ModelInfo(
            name="test_model",
            description="Test model",
            is_available=True,
            parameters={"temperature": 0.7}
        )
        model_loader._model_registry.get_model_info.return_value = model_info
        model_loader._model_registry.get_default_model_name.return_value = "test_model"
        
        # Mock the model configurator
        model_loader._model_configurator.create_model_config.return_value = {
            "model": "test_model",
            "temperature": 0.7
        }
        
        # Test loading a model
        model = model_loader.load_model("test_model")
        
        # Verify Ollama was called correctly
        mock_ollama.assert_called_once()
        args = mock_ollama.call_args[1]
        assert args["model"] == "test_model"
        assert args["temperature"] == 0.7
        assert args["base_url"] == model_loader._base_url
