# Project Basic Structure

This document outlines the basic structure of the `senana/langchain` project.

## Overview

The project is designed to interact with Large Language Models (LLMs) through the Ollama service. It is structured to be modular, with clear separation of concerns for configuration, model management, and application logic.

## Directory Structure

The main project code is located under `senana/langchain/`. Here is a breakdown of the key directories and their purpose:

### `senana/langchain/app/`

This directory is intended for the application's entry point, likely a web service.

-   **`app/main.py`**: The main file to launch the application (e.g., a FastAPI app). Currently, it is empty.
-   **`app/api/v1/`**: This sub-directory is intended to hold the API definitions.
    -   **`endpoints.py`**: Contains API endpoint definitions. Currently, it is empty.

### `senana/langchain/configs/`

This directory contains all configuration files for the project.

-   **`llm_config.yml`**: The primary configuration file for LLMs. It defines:
    -   The default model and a list of alternative models.
    -   Default and model-specific parameters (e.g., `temperature`, `top_p`).
    -   Ollama server connection details (`base_url`, `timeout`).
-   **`prompts.yml`**: Intended for storing prompt templates. Currently, it is empty.

### `senana/langchain/src/`

This is the main source code directory, organized into sub-modules.

#### `src/core/`

This module is intended for the core business logic of the application. The files are currently empty placeholders.

-   **`agents.py`**: Intended for defining AI agents.
-   **`orchestration.py`**: Intended for orchestrating workflows between different components.
-   **`pipelines.py`**: Intended for defining data processing pipelines.

#### `src/data_processing/`

This module is for data ingestion and preprocessing. The files are currently empty placeholders.

-   **`ingestion.py`**: For loading data from various sources.
-   **`preprocessing.py`**: For cleaning and transforming data.

#### `src/llm/`

This is the most developed module, responsible for all interactions with LLMs.

-   **`model_loader.py`**: Contains `ModelLoader`, a class responsible for:
    -   Connecting to the Ollama server.
    -   Loading LLM models using `langchain-ollama`.
    -   Checking which models are available on the server.
-   **`model_registry.py`**: Contains `ModelRegistry`, a class that:
    -   Loads model definitions from `llm_config.yml`.
    -   Manages a registry of all known models and their metadata.
    -   Tracks the availability of models.
-   **`model_configurator.py`**: Contains `ModelConfigurator`, a class for:
    -   Creating runtime configurations for models.
    -   Merging default parameters with model-specific and user-provided overrides.

#### `src/utils/`

This module contains utility classes and functions used across the project.

-   **`config_loader.py`**: Provides `ConfigLoader` for loading YAML configuration files. It includes logic to find configuration files in various project locations.
-   **`config_manager.py`**: A singleton `ConfigManager` class that provides centralized access to configuration values from `llm_config.yml` and other config files.
-   **`parsers.py`**: Intended for data parsing functions. Currently, it is empty.

### Root Files

-   **`pyproject.toml`**: Project definition file for dependency management with tools like Poetry or Rye. Currently, it is empty.
-   **`requirements.txt`**: A standard Python dependency file.
