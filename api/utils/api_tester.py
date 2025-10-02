import subprocess
import time
import logging

logger = logging.getLogger(__name__)

def test_api_with_curl(
        json_file: str,
        url: str = "http://localhost:8000/api/v1/analyze"
):
    """
    Выполняет curl-запрос к API и замеряет общее время (включая сеть).
    Использует временный файл или напрямую stdin.
    """
    start_time = time.time()

    try:
        # Команда curl
        cmd = [
            "curl", "-s", "-X", "POST",
            url,
            "-H", "Content-Type: application/json",
            "--data", f"@{json_file}"
        ]

        logger.info(f"Запуск curl к {url}...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        duration = time.time() - start_time

        if result.returncode != 0:
            logger.error(f"❌ curl завершился с ошибкой: {result.stderr}")
            return {
                "success": False,
                "error": result.stderr,
                "duration": duration
            }

        logger.info(f"✅ Ответ получен за {duration:.2f} сек")
        return {
            "success": True,
            "response": result.stdout,
            "duration": duration
        }

    except subprocess.TimeoutExpired:
        duration = time.time() - start_time
        logger.error("❌ Таймаут curl")
        return {"success": False, "error": "Timeout", "duration": duration}
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"❌ Ошибка выполнения curl: {e}")
        return {"success": False, "error": str(e), "duration": duration}