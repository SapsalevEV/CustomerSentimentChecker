# Model Management Components

This directory contains components for managing LLM models within the ABSA pipeline. These components handle model initialization, configuration, and metadata management.

## Architecture

The model management system is built around three core components:

1. **ModelRegistry** - Maintains metadata about available models
2. **ModelConfigurator** - Handles runtime parameter configuration
3. **ModelLoader** - Provides interface for initializing and loading models

![Model Management Architecture](https://mermaid.ink/img/pako:eNqFkj9PwzAQxb_KyQtIiMQ9PXREYoGFjC45cEstOf5z7YAo4rvjNCmkVGV57_f83v0Z9EYjaEEeYzXzC-v6xKMvqMnpXHniHvviA2azh6JsNu-OzAoLbW3PBHnEzAeeJ5ukgS7LVR0bK-nQ8WdYN7l8jQn7q_LJvG6zF2uJyrkyvsqGLw_dMb3jSMbJ57ngZwrKWPcc06l3zsZZKR23YVyU-EbiJ4TScG1nqqQ_qMnYCmNpQ9bRR-M7s9YEoRFnMchI7PMdswwVCvFXb-Y0fjG3YijQkKP6Uha2RhAPQlRqGHEXY4X-fKidUjE54r4PPbddsZ24C0oMDUFoL3vyZvkEb7bw3NFdEQwuQiWYME3XDKdR_UocsYzRcKY6aNFcroJ8UkTG9t83YKqhk1Al6-tFqhOfVLPZbxQojw4?type=png)

## Component Interfaces

### ModelRegistry

The `ModelRegistry` maintains information about available models and their configurations.

```python
registry = ModelRegistry()

# Get information about a specific model
model_info = registry.get_model_info("llama3")

# Get a list of all available models
available_models = registry.get_available_models()

# Check if a model is available locally
is_available = registry.is_model_available("mistral")

# Get the default model name
default_model = registry.get_default_model_name()
```

### ModelConfigurator

The `ModelConfigurator` handles parameter management for model configuration.

```python
configurator = ModelConfigurator(registry)

# Get parameters for a model with optional overrides
params = configurator.get_model_parameters(
    model_name="llama3", 
    override_params={"temperature": 0.5}
)

# Apply parameters to an existing LLM instance
configured_llm = configurator.apply_parameters(
    llm=my_llm,
    model_name="llama3",
    override_params={"temperature": 0.5}
)

# Create a configuration dictionary for model initialization
config = configurator.create_model_config("llama3")
```

### ModelLoader

The `ModelLoader` is the main entry point for loading and initializing LLM models.

```python
model_loader = ModelLoader()

# Get list of available model names
available_models = model_loader.get_available_model_names()

# Load a specific model with optional parameter overrides
llm = model_loader.load_model(
    model_name="llama3",
    model_params={"temperature": 0.5}
)

# Load the default model
default_llm = model_loader.get_default_model()

# Access the registry and configurator
registry = model_loader.get_model_registry()
configurator = model_loader.get_model_configurator()

# Asynchronous model loading (API compatible but currently synchronous)
async def load_async():
    llm = await model_loader.aload_model("llama3")
```

## Configuration

Models are configured through the `configs/llm_config.yml` file with the following structure:

```yaml
# LLM Configuration
models:
  default: "llama3"                          # Default model to use
  alternatives:
    - name: "mistral"                        # Alternative model name
      description: "Smaller but faster model" # Model description

# Model parameters
parameters:
  default:                                   # Default parameters for all models
    temperature: 0.7
    top_p: 0.9
  model_specific:                            # Model-specific parameter overrides
    llama3:
      temperature: 0.6

# Ollama configuration
ollama:
  base_url: "http://localhost:11434"         # Ollama API URL
  timeout: 60                                # API timeout in seconds
```

## Design Decisions

1. **Separation of Concerns**:
   - `ModelRegistry` focuses only on tracking and metadata management
   - `ModelConfigurator` handles parameter management independently
   - `ModelLoader` provides the integration layer for creating actual LLM instances

2. **Configuration-Driven**:
   - All model parameters are loaded from external configuration files
   - No hardcoded parameters or model names

3. **Extensibility**:
   - The system can be extended to support other LLM providers by implementing additional loader classes
   - Model parameters are managed in a generic way that isn't tied to specific model implementations

4. **Error Handling**:
   - Comprehensive error handling with appropriate logging
   - Graceful handling of unavailable models with fallbacks to defaults

5. **Async Support**:
   - API is designed with async compatibility for future enhancements
   - Placeholder async methods provided for API consistency

## Integration Example

```python
from src.llm.model_loader import ModelLoader

# Initialize the model loader
model_loader = ModelLoader()

# Load the default model
llm = model_loader.get_default_model()

# Use the LLM for inference
if llm:
    result = llm.invoke("Analyze the sentiment in the following text: I love this product!")
    print(result)
else:
    print("No model available. Please ensure Ollama is running with appropriate models.")
```

## Error Handling

The components handle errors with informative messages and graceful fallbacks:

1. **Configuration Errors**:
   - If the configuration file is missing or invalid, default values are used
   - Error details are logged

2. **Model Availability**:
   - If a requested model is not available locally, a warning is logged
   - API calls to check model availability include robust exception handling

3. **Parameter Validation**:
   - If invalid parameters are provided, warnings are logged
   - The system continues with valid parameters only
