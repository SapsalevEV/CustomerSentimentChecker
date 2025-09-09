# Naming Conventions

This document outlines the naming conventions used throughout this project to ensure code consistency, clarity, and maintainability.

## General Principles

-   **Clarity over Brevity**: Names should be descriptive and unambiguous, even if it makes them longer. Avoid single-letter variable names except for simple loop counters.
-   **Consistency**: Follow the established conventions consistently across the entire codebase.

## Conventions by Type

### 1. Files and Directories

-   **Convention**: All file and directory names should be in `snake_case` (lowercase with underscores).
-   **Examples**:
    -   Files: `model_loader.py`, `config_manager.py`
    -   Directories: `data_processing`, `src/llm`

### 2. Variables, Functions, and Methods

-   **Convention**: Use `snake_case` for all variables, functions, and method names.
-   **Details**:
    -   For private methods or attributes, prefix the name with a single underscore (e.g., `_load_from_config`).
    -   For methods that should not be overridden, prefix the name with a double underscore (e.g., `__internal_method`).
-   **Examples**:
    -   Variables: `model_name`, `config_path`
    -   Functions/Methods: `load_model()`, `get_model_parameters()`

### 3. Classes

-   **Convention**: Class names should use `PascalCase` (also known as `CapWords`), where each word in the name is capitalized.
-   **Examples**:
    -   `ModelLoader`
    -   `ConfigManager`
    -   `ModelInfo`

### 4. Constants

-   **Convention**: Constants should be declared in `UPPER_CASE_SNAKE_CASE` (all uppercase letters with underscores separating words).
-   **Details**: Constants are typically defined at the module level.
-   **Examples**:
    -   `DEFAULT_CONFIG_DIR = "configs"`
    -   `DEFAULT_TIMEOUT = 60`

### 5. Type Hints

-   **Convention**: For type variables defined using `typing.TypeVar`, use `PascalCase`.
-   **Examples**:
    -   `from typing import TypeVar`
    -   `T = TypeVar('T')`
    -   `KT = TypeVar('KT')`

### 6. Enums

-   **Convention**: Enums should use `PascalCase` for the class name and `UPPER_CASE_SNAKE_CASE` for the members.
-   **Example**:
    ```python
    from enum import Enum

    class ModelStatus(Enum):
        AVAILABLE = "available"
        UNAVAILABLE = "unavailable"
    ```

### 7. Interfaces (Abstract Base Classes)

-   **Convention**: Abstract Base Classes (ABCs) should follow the `PascalCase` convention, similar to regular classes. It is common to add a `Base` suffix to the name.
-   **Example**:
    ```python
    class BaseLoader:
        def load(self):
            raise NotImplementedError
    ```
