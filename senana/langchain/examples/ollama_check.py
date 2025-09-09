"""
Простой скрипт для проверки доступности Ollama API
"""

import os
import requests
import subprocess
import time
import sys

def check_url(url):
    """Проверяет доступность URL"""
    try:
        print(f"Checking {url}...")
        resp = requests.get(url, timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Headers: {resp.headers}")
        print(f"Content (first 100 chars): {resp.text[:100]}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def run_command(cmd):
    """Запускает команду и возвращает результат"""
    print(f"Running command: {cmd}")
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            check=False, 
            capture_output=True, 
            text=True
        )
        print(f"Return code: {result.returncode}")
        print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Error output: {result.stderr}")
        return result
    except Exception as e:
        print(f"Error executing command: {e}")
        return None

def main():
    """Основная функция"""
    print("===== CHECKING OLLAMA API =====")
    
    # Проверка переменных окружения
    print("\n1. Checking environment variables:")
    env_vars = ["OLLAMA_HOST", "OLLAMA_PORT", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"]
    for var in env_vars:
        print(f"{var}: {os.environ.get(var, 'Not set')}")
    
    # Устанавливаем переменные окружения
    print("\n2. Setting environment variables:")
    os.environ["OLLAMA_HOST"] = "127.0.0.1"
    os.environ["NO_PROXY"] = "localhost,127.0.0.1"
    print(f"OLLAMA_HOST set to: {os.environ.get('OLLAMA_HOST')}")
    print(f"NO_PROXY set to: {os.environ.get('NO_PROXY')}")
    
    # Проверка процессов Ollama
    print("\n3. Checking Ollama processes:")
    run_command("tasklist | findstr ollama")
    
    # Проверка статуса Ollama
    print("\n4. Checking Ollama status:")
    run_command("ollama ps")
    
    # Проверка портов
    print("\n5. Checking port 11434:")
    run_command("netstat -ano | findstr :11434")
    
    # Проверка установленных моделей
    print("\n6. Checking installed models:")
    run_command("ollama list")
    
    # Проверка веб-доступа
    print("\n7. Checking web access:")
    urls = [
        "http://localhost:11434",
        "http://127.0.0.1:11434",
        "http://localhost:11434/api/version",
        "http://127.0.0.1:11434/api/version"
    ]
    
    for url in urls:
        check_url(url)
    
    # Пытаемся выполнить curl
    print("\n8. Trying curl:")
    run_command("curl -v http://127.0.0.1:11434/api/version")
    
    # Выводим рекомендации
    print("\n===== RECOMMENDATIONS =====")
    print("1. If 'curl' works but Python requests fail, it may be a proxy/firewall issue")
    print("2. Try running 'ollama serve' in a separate terminal")
    print("3. Try using port 11435 by setting OLLAMA_PORT=11435 environment variable")
    print("4. Check your Windows Defender Firewall settings")
    
if __name__ == "__main__":
    main()
