"""
Прямая проверка доступности API Ollama без дополнительных библиотек.

Скрипт для проверки, работает ли API Ollama напрямую через requests.
"""

import os
import sys
import json
import requests
from pathlib import Path

# Настройки для отключения прокси
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'

# Адреса для проверки
urls_to_check = [
    "http://localhost:11434/",
    "http://127.0.0.1:11434/",
    "http://localhost:11434/api/version",
    "http://127.0.0.1:11434/api/version",
    "http://localhost:11434/api/tags",
    "http://127.0.0.1:11434/api/tags"
]

# Проверка через POST запрос
post_urls = [
    ("http://localhost:11434/api/generate", {"model": "gpt-oss:20b", "prompt": "Hello", "stream": False}),
    ("http://127.0.0.1:11434/api/generate", {"model": "gpt-oss:20b", "prompt": "Hello", "stream": False})
]

def main():
    """Проверка API Ollama."""
    print("Начинаем проверку доступа к API Ollama...\n")
    
    print("Текущие переменные окружения:")
    print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY', 'Не установлен')}")
    print(f"HTTPS_PROXY: {os.environ.get('HTTPS_PROXY', 'Не установлен')}")
    print(f"NO_PROXY: {os.environ.get('NO_PROXY', 'Не установлен')}")
    print(f"OLLAMA_HOST: {os.environ.get('OLLAMA_HOST', 'Не установлен')}")
    print(f"OLLAMA_PORT: {os.environ.get('OLLAMA_PORT', 'Не установлен')}")
    print()
    
    # Проверка GET запросов
    print("Проверка GET запросов:")
    for url in urls_to_check:
        try:
            print(f"\nПроверка {url}:")
            response = requests.get(url, timeout=10)
            print(f"Статус: {response.status_code}")
            print(f"Заголовки: {response.headers}")
            print(f"Тело ответа: {response.text[:200]}...")
        except Exception as e:
            print(f"Ошибка: {e}")
    
    # Проверка POST запросов
    print("\n\nПроверка POST запросов:")
    for url, data in post_urls:
        try:
            print(f"\nПроверка POST к {url}:")
            print(f"Данные: {data}")
            response = requests.post(url, json=data, timeout=10)
            print(f"Статус: {response.status_code}")
            print(f"Заголовки: {response.headers}")
            print(f"Тело ответа: {response.text[:200]}...")
        except Exception as e:
            print(f"Ошибка: {e}")
            
    print("\nРекомендации:")
    print("1. Если все запросы возвращают 502, возможно, проблема с брандмауэром или антивирусом")
    print("2. Попробуйте остановить Ollama (ollama kill), затем запустить с другим портом:")
    print("   $env:OLLAMA_PORT='11435'")
    print("   ollama serve")
    print("3. Проверьте, нет ли конфликтов портов: netstat -ano | findstr :11434")
    print("4. Проверьте настройки прокси-сервера")

if __name__ == "__main__":
    main()
