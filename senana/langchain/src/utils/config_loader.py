"""
Configuration loader utility.

This module provides utilities for loading and parsing configuration files.
"""
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Union

import yaml

logger = logging.getLogger(__name__)

# Constants
DEFAULT_CONFIG_DIR = "configs"
DEFAULT_CONFIG_FILE = "llm_config.yml"


class ConfigLoader:
    """Configuration loader utility class.
    
    Handles loading and parsing YAML configuration files.
    """
    
    @staticmethod
    def load_config(config_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Load a YAML configuration file.
        
        Args:
            config_path: Path to the YAML configuration file.
        
        Returns:
            A dictionary containing the configuration values.
            
        Raises:
            FileNotFoundError: If the configuration file doesn't exist.
            yaml.YAMLError: If the YAML file is invalid.
        """
        config_path = Path(config_path)
        
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as file:
            try:
                logger.debug(f"Loading configuration from {config_path}")
                config = yaml.safe_load(file)
                return config if config else {}
            except yaml.YAMLError as e:
                logger.error(f"Error parsing YAML file {config_path}: {str(e)}")
                raise yaml.YAMLError(f"Error parsing YAML file {config_path}: {str(e)}")
    
    @staticmethod
    def get_config_path(
        filename: Optional[str] = None,
        base_dir: Optional[Union[str, Path]] = None
    ) -> Path:
        """
        Get the absolute path to a configuration file.
        
        Args:
            filename: Name of the configuration file. If None, uses DEFAULT_CONFIG_FILE.
            base_dir: Base directory for the configuration file. If None,
                     attempts to find the config directory using multiple strategies.
        
        Returns:
            A Path object representing the absolute path to the configuration file.
        """
        if filename is None:
            filename = DEFAULT_CONFIG_FILE
        
        # Try different strategies to find the configuration file
        paths_to_try = []
        
        # Strategy 1: Use the provided base_dir
        if base_dir:
            paths_to_try.append(Path(base_dir) / filename)
        
        # Current working directory and its parent
        cwd = Path.cwd()
        
        # Strategy 2: Look for configs/ directory relative to the current file
        current_file = Path(__file__).resolve()
        project_root = current_file.parent.parent.parent  # src/utils -> src -> langchain
        paths_to_try.append(project_root / DEFAULT_CONFIG_DIR / filename)
        
        # Strategy 3: Look for configs/ in current working directory
        paths_to_try.append(cwd / DEFAULT_CONFIG_DIR / filename)
        
        # Strategy 4: Look in senana/langchain/configs/ from current directory
        paths_to_try.append(cwd / "senana" / "langchain" / DEFAULT_CONFIG_DIR / filename)
        
        # Strategy 5: Try one level up
        paths_to_try.append(cwd.parent / DEFAULT_CONFIG_DIR / filename)
        
        # Strategy 6: Two levels up (in case running from deeply nested directory)
        paths_to_try.append(cwd.parent.parent / DEFAULT_CONFIG_DIR / filename)
        
        # Try each path
        for path in paths_to_try:
            logger.debug(f"Checking for config at: {path}")
            if path.exists():
                logger.info(f"Found configuration file at: {path}")
                return path
        
        # If we get here, we couldn't find the file but will return the most likely path
        # This allows the caller to handle the FileNotFoundError appropriately
        logger.warning(f"Configuration file {filename} not found in any expected location")
        return paths_to_try[0]
    
    @staticmethod
    def get_or_default(
        config: Dict[str, Any],
        path: str,
        default: Any
    ) -> Any:
        """
        Get a value from a nested dictionary using dot notation, or return a default value.
        
        Args:
            config: The configuration dictionary.
            path: The path to the value using dot notation (e.g., "models.default").
            default: The default value to return if the path doesn't exist.
        
        Returns:
            The value at the path or the default value.
        """
        if not config:
            return default
        
        parts = path.split('.')
        current = config
        
        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return default
            current = current[part]
        
        return current if current is not None else default