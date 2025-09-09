# Local LLM Integration Architecture: Ollama + LangChain

## 1. Module Objectives

The Local LLM Integration Module aims to:

- Provide seamless access to locally hosted large language models via Ollama
- Abstract model management and inference complexity from application logic
- Enable privacy-preserving text processing without relying on external APIs
- Support configurable prompting strategies for consistent model interactions
- Facilitate integration with the broader ABSA (Aspect-Based Sentiment Analysis) pipeline
- Ensure efficient resource utilization for optimal inference performance
- Allow for flexible model switching and configuration

## 2. System Architecture

### High-Level Architecture

```
+----------------------------------+
|          Client Applications     |
+----------------------------------+
               |
               | API Calls
               v
+----------------------------------+
|     LLM Integration Module       |
|----------------------------------|
|                                  |
|  +-----------------------------+ |
|  |   LangChain Orchestration   | |
|  +-----------------------------+ |
|         |            |          |
|         v            v          |
|  +----------+  +-----------+    |
|  | Prompts  |  | Parsers   |    |
|  +----------+  +-----------+    |
|         |            ^          |
|         v            |          |
|  +-----------------------------+ |
|  |    Model Management Layer   | |
|  +-----------------------------+ |
|               |                  |
+---------------|------------------+
                |
                v
+----------------------------------+
|           Ollama Service         |
|----------------------------------|
|                                  |
|  +-----------------------------+ |
|  |       Model Repository      | |
|  +-----------------------------+ |
|  |                             | |
|  |  +---------+  +---------+   | |
|  |  | Model 1 |  | Model 2 |   | |
|  |  +---------+  +---------+   | |
|  |                             | |
|  +-----------------------------+ |
|                                  |
+----------------------------------+
```

### Architecture Description

- **Client Applications**: External services or components that interact with the LLM Integration Module
- **LLM Integration Module**: Core module that orchestrates model interactions
  - **LangChain Orchestration**: Handles prompt chaining, context management, and tool integration
  - **Prompts**: Repository of templated prompts for different use cases
  - **Parsers**: Components to extract structured data from LLM responses
  - **Model Management Layer**: Interfaces with Ollama, handles model selection and configuration
- **Ollama Service**: Local service that provides API access to open-source LLMs
  - **Model Repository**: Collection of downloaded and configured LLM models

## 3. Component Breakdown

### 3.1. Model Management Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| ModelLoader | Handles model initialization and configuration | `src/llm/model_loader.py` |
| ModelRegistry | Maintains metadata about available models | `src/llm/model_registry.py` |
| ModelConfigurator | Handles runtime model parameter configuration | `src/llm/model_configurator.py` |

### 3.2. Inference Pipeline Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| PromptManager | Manages and renders prompt templates | `src/llm/prompt_manager.py` |
| InferenceEngine | Core component for handling LLM requests | `src/llm/inference_engine.py` |
| ResultProcessor | Processes and formats raw model outputs | `src/llm/result_processor.py` |

### 3.3. Integration Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| LLMServiceClient | Provides client interface for the LLM service | `src/llm/service_client.py` |
| APIHandler | Exposes LLM functionality via REST API | `app/api/v1/endpoints.py` |
| ConfigLoader | Loads and validates configuration | `src/utils/config_loader.py` |

## 4. Ollama Integration

### 4.1. Setup and Installation

1. Install Ollama on the target machine:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. Pull required models:
   ```bash
   ollama pull llama3
   ollama pull mistral
   ollama pull phi3
   ```

### 4.2. Model Management

- **Model Selection**: Configure preferred models in `configs/llm_config.yml`:
  ```yaml
  models:
    default: "llama3"
    alternatives:
      - name: "mistral"
        description: "Smaller but faster model"
      - name: "phi3"
        description: "Compact model for lighter workloads"
  ```

- **Custom Model Configuration**: Create custom model configurations with Modelfiles:
  ```
  # Example Modelfile for customized LLama3
  FROM llama3
  PARAMETER temperature 0.7
  PARAMETER top_p 0.9
  PARAMETER top_k 40
  SYSTEM """You are an AI assistant specialized in analyzing customer sentiment."""
  ```

### 4.3. Performance Optimization

- **Resource Allocation**: Configure memory and compute resources in `configs/ollama_config.yml`:
  ```yaml
  resources:
    gpu: true
    cpu_threads: 8
    max_memory: "8GiB"
  ```

- **Batching Strategy**: Implement request batching for multiple inputs:
  ```python
  def batch_process(texts, batch_size=4):
      """Process texts in batches for better throughput."""
      results = []
      for i in range(0, len(texts), batch_size):
          batch = texts[i:i+batch_size]
          batch_results = process_concurrent(batch)
          results.extend(batch_results)
      return results
  ```

### 4.4. Communication Interface

```python
# Example communication with Ollama
from langchain_community.llms import Ollama

class OllamaInterface:
    def __init__(self, model_name, base_url="http://localhost:11434"):
        self.llm = Ollama(model=model_name, base_url=base_url)
        
    def generate(self, prompt, **kwargs):
        return self.llm.invoke(prompt, **kwargs)
```

## 5. LangChain Utilization

### 5.1. Component Selection

The module will leverage the following LangChain components:

- **Models**: `langchain_community.llms.Ollama`
- **Prompts**: `langchain_core.prompts.ChatPromptTemplate`
- **Chains**: LCEL (LangChain Expression Language) for composing operations
- **Output Parsers**: Structured output parsing with `PydanticOutputParser`

### 5.2. Prompt Engineering

```python
from langchain_core.prompts import ChatPromptTemplate

# Example: Creating a prompt template for sentiment analysis
sentiment_template = """
You are analyzing customer sentiment about a product or service.

Customer Review:
{review}

Analyze the sentiment in this review. Identify whether it is positive, negative, or neutral.
Provide your reasoning step by step.

Format your response as:
Sentiment: [POSITIVE/NEGATIVE/NEUTRAL]
Reasoning: [Your step-by-step reasoning]
"""

sentiment_prompt = ChatPromptTemplate.from_template(sentiment_template)
```

### 5.3. Chain Construction

```python
from langchain_core.output_parsers import StrOutputParser

# Example: Building a sentiment analysis chain
def create_sentiment_chain(model):
    """Create a chain for sentiment analysis."""
    chain = sentiment_prompt | model | StrOutputParser()
    return chain
    
# Using the chain
result = chain.invoke({"review": "The customer service was excellent but the product quality was disappointing."})
```

### 5.4. Tool Integration

```python
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType

# Example: Creating a tool for aspect extraction
def extract_aspects(text):
    """Extract product/service aspects from text."""
    # Implementation here
    return ["customer service", "product quality", "price"]

aspect_tool = Tool(
    name="AspectExtractor",
    func=extract_aspects,
    description="Extracts aspects/features from customer reviews"
)

# Creating an agent with tools
agent = initialize_agent(
    [aspect_tool], 
    llm, 
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)
```

## 6. API Design

### 6.1. Core Interface

```python
class LLMService:
    """Core service for LLM interactions."""
    
    def __init__(self, config_path="configs/llm_config.yml"):
        self.config = self._load_config(config_path)
        self.model = self._initialize_model()
        self.prompt_manager = PromptManager()
        
    def generate(self, prompt, model_params=None):
        """Generate text completion from the model."""
        configured_model = self._configure_model(model_params)
        return configured_model.invoke(prompt)
    
    def analyze_sentiment(self, text):
        """Analyze sentiment in provided text."""
        chain = self._get_chain("sentiment")
        return chain.invoke({"input": text})
    
    def extract_aspects(self, text):
        """Extract aspects from provided text."""
        chain = self._get_chain("aspect_extraction")
        return chain.invoke({"input": text})
    
    def analyze_aspects(self, text):
        """Perform full ABSA on provided text."""
        # Implementation uses orchestration from orchestration.py
        pass
```

### 6.2. REST API Endpoints

```python
# In app/api/v1/endpoints.py

from fastapi import APIRouter, Body
from pydantic import BaseModel

router = APIRouter()

class TextRequest(BaseModel):
    text: str
    model_params: dict = None

class AspectRequest(BaseModel):
    text: str
    aspects: list[str] = None

@router.post("/generate")
async def generate_text(request: TextRequest):
    """Generate text completion."""
    result = llm_service.generate(request.text, request.model_params)
    return {"generated_text": result}

@router.post("/analyze/sentiment")
async def analyze_sentiment(request: TextRequest):
    """Analyze sentiment in text."""
    result = llm_service.analyze_sentiment(request.text)
    return result

@router.post("/analyze/aspects")
async def extract_aspects(request: TextRequest):
    """Extract aspects from text."""
    result = llm_service.extract_aspects(request.text)
    return {"aspects": result}

@router.post("/analyze/absa")
async def analyze_aspects(request: AspectRequest):
    """Perform ABSA on text."""
    result = llm_service.analyze_aspects(request.text, request.aspects)
    return result
```

## 7. Security and Privacy

### 7.1. Data Handling

- **Input Sanitization**: Implement validation for all user inputs
  ```python
  def sanitize_input(text):
      """Remove potentially harmful content from input."""
      # Implementation
      return sanitized_text
  ```

- **Data Retention**: Configure local data retention policies
  ```yaml
  # In configs/security_config.yml
  data_retention:
    store_inputs: false
    store_outputs: true
    retention_period_days: 30
    encryption_enabled: true
  ```

### 7.2. Local Model Security

- **Access Control**: Restrict Ollama API access to authorized applications
  ```yaml
  # In configs/ollama_config.yml
  security:
    api_access:
      enable_authentication: true
      api_key_required: true
      allowed_origins: ["localhost", "internal-app.company.com"]
  ```

- **Network Isolation**: Configure Ollama to only listen on local interfaces
  ```bash
  # Configure Ollama to only listen on localhost
  OLLAMA_HOST=127.0.0.1 ollama serve
  ```

### 7.3. Prompt Injection Prevention

- Implement validation logic for prompts to prevent potential prompt injection attacks
- Use parameterized prompt templates with strict type checking

## 8. Testing and Validation

### 8.1. Unit Testing

```python
# Example test for sentiment analysis
def test_sentiment_analysis():
    """Test sentiment analysis functionality."""
    positive_text = "I absolutely love this product! It exceeds all my expectations."
    negative_text = "This is the worst service I've ever experienced."
    
    result_pos = llm_service.analyze_sentiment(positive_text)
    result_neg = llm_service.analyze_sentiment(negative_text)
    
    assert result_pos["sentiment"] == "POSITIVE"
    assert result_neg["sentiment"] == "NEGATIVE"
```

### 8.2. Integration Testing

```python
# Example integration test for the full ABSA pipeline
def test_absa_pipeline():
    """Test the complete ABSA pipeline."""
    review = "The interface is intuitive, but the system often crashes when processing large files."
    
    result = llm_service.analyze_aspects(review)
    
    assert len(result["aspects"]) >= 2
    assert any(aspect["name"] == "interface" for aspect in result["aspects"])
    assert any(aspect["name"] == "system stability" for aspect in result["aspects"])
```

### 8.3. Performance Testing

- Develop scripts to benchmark inference latency and throughput
- Test system under various load conditions
- Evaluate memory usage patterns during extended operation

## 9. Extensibility

### 9.1. Model Abstraction

```python
# Abstract base class for model providers
class ModelProvider(ABC):
    @abstractmethod
    def get_model(self, model_name, **kwargs):
        """Retrieve a model instance."""
        pass
        
# Ollama implementation
class OllamaProvider(ModelProvider):
    def get_model(self, model_name, **kwargs):
        return Ollama(model=model_name, **kwargs)
        
# Future provider implementation
class AlternateProvider(ModelProvider):
    def get_model(self, model_name, **kwargs):
        # Implementation for another local model provider
        pass
```

### 9.2. Plugin Architecture

```python
# Plugin system for extensibility
class Plugin(ABC):
    @abstractmethod
    def process(self, input_data):
        """Process input data."""
        pass

# Register plugins
def register_plugin(plugin_type, plugin_instance):
    """Register a plugin for the system."""
    plugin_registry[plugin_type].append(plugin_instance)
```

### 9.3. Configuration-Driven Features

- Implement feature flags in configuration:
  ```yaml
  # In configs/features.yml
  features:
    streaming_responses: true
    model_fallback: true
    response_caching: false
  ```

## 10. Documentation Plan

### 10.1. Developer Documentation

- **API Reference**: Complete documentation of all public classes, methods, and parameters
- **Architecture Guide**: Detailed explanation of module components and interactions
- **Integration Guide**: Step-by-step instructions for integrating with other services
- **Contribution Guidelines**: Standards and procedures for contributing to the codebase

### 10.2. User Documentation

- **Setup Guide**: Instructions for installing and configuring the module
- **Usage Examples**: Common usage patterns and examples
- **Troubleshooting Guide**: Solutions to common issues and error messages
- **Performance Optimization**: Tips for optimizing performance

### 10.3. Documentation Format

- Markdown files in the repository
- Generated API docs using Sphinx
- Interactive examples in Jupyter notebooks

## References

1. LangChain Documentation: [https://python.langchain.com/docs/](https://python.langchain.com/docs/)
2. Ollama GitHub Repository: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
3. LangChain-Ollama Integration: [https://python.langchain.com/docs/integrations/llms/ollama](https://python.langchain.com/docs/integrations/llms/ollama)
4. LangChain Expression Language (LCEL): [https://python.langchain.com/docs/expression_language/](https://python.langchain.com/docs/expression_language/)
5. Prompt Engineering Guide: [https://www.promptingguide.ai/](https://www.promptingguide.ai/)
