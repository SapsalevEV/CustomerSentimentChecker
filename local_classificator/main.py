import pandas as pd
import json
import os
import requests
from typing import List, Dict, Optional
from pathlib import Path

from llama_cpp import Llama


def download_model(url: str, model_path: str) -> bool:
    """
    Скачивает модель с указанного URL, если она ещё не существует.
    
    Args:
        url: URL для скачивания модели
        model_path: Путь для сохранения модели
        
    Returns:
        bool: True если модель была скачана или уже существует
    """
    if os.path.exists(model_path):
        print(f"✅ Модель уже существует: {model_path}")
        return True
    
    print(f"📥 Скачиваем модель с {url}...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(model_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\r📥 Прогресс: {progress:.1f}%", end="", flush=True)
        
        print(f"\n✅ Модель успешно скачана: {model_path}")
        return True
        
    except Exception as e:
        print(f"\n❌ Ошибка при скачивании модели: {e}")
        if os.path.exists(model_path):
            os.remove(model_path)  # Удаляем частично скачанный файл
        return False


class LLMLocal:
    def __init__(
        self,
        model_path: str,
        n_ctx: int = 4096,
        n_threads: int = 4,
        n_gpu_layers: int = 35,
        verbose: bool = False,
        use_system_role: bool = True
    ):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Модель не найдена: {model_path}")

        print(f"🔧 Загружаем GGUF модель: {model_path}")
        self.llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_threads=n_threads,
            n_gpu_layers=n_gpu_layers,
            verbose=verbose,
        )
        self.use_system_role = use_system_role

    def answer(
        self,
        messages: list,
        max_new_tokens: int = 256,
        temperature: float = 0.1
    ) -> str:
        try:
            if self.use_system_role:
                output = self.llm.create_chat_completion(
                    messages=messages,
                    max_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=0.9,
                )
                return output["choices"][0]["message"]["content"].strip()
            else:
                # Склеиваем system + user в один user-запрос
                full_content = ""
                for msg in messages:
                    if msg["role"] == "system":
                        full_content += f"{msg['content']}\n\n"
                    elif msg["role"] == "user":
                        full_content += f"Отзыв:\n{msg['content']}"
                output = self.llm.create_chat_completion(
                    messages=[{"role": "user", "content": full_content}],
                    max_tokens=max_new_tokens,
                    temperature=temperature,
                    top_p=0.9,
                )
                return output["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"❌ Ошибка при генерации: {e}")
            return ""



class LLMClassifier:
    def __init__(
        self,
        llm,
        categories: List[str],
        system_prompt: Optional[str] = None
    ):
        self.llm = llm
        self.categories = [cat.strip() for cat in categories]
        self.default_system_prompt = system_prompt or self._default_prompt()

    def _default_prompt(self) -> str:
        cats = ", ".join([f'"{cat}"' for cat in self.categories])
        return f"""Ты анализируешь отзывы клиентов банка.
Доступные категории: {cats}.
Проанализируй отзыв и выдели все упомянутые категории.

Формат ответа:
{{
  "annotations": [
    {{
      "category": "...",
      "summary": "...",
      "sentiment": "позитив|негатив|нейтрально"
    }}
  ]
}}
Не добавляй пояснений."""

    def classify(
        self,
        text: str,
        system_prompt: Optional[str] = None,
        max_new_tokens: int = 300,
        temperature: float = 0.1
    ) -> dict:
        prompt = system_prompt or self.default_system_prompt

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": text}
        ]

        raw_response = self.llm.answer(
            messages=messages,
            max_new_tokens=max_new_tokens,
            temperature=temperature
        )

        return self._clean_json(raw_response)

    def _clean_json(self, text: str) -> dict:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start == -1 or end == 0:
                return {"annotations": []}
            cleaned = text[start:end]
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"⚠️ Ошибка парсинга JSON: {e} | Текст: {text[:300]}...")
            return {"annotations": []}


import random
# проверка результатов
def classify_test(results: List[dict], allowed_categories: List[str], n_samples: int = 3):
    allowed_set = set(cat.strip() for cat in allowed_categories)
    found_categories = set()

    # Проверка на недопустимые категории
    for item in results:
        for ann in item.get("annotations", []):
            cat = ann.get("category", "").strip()
            found_categories.add(cat)
            if cat not in allowed_set:
                print(f"🔴 ID {item['id']} — wrong category: '{cat}'")

    print(f"\n📊 Все найденные категории: {sorted(found_categories)}")
    status = "✅ Все категории корректны." if all(c in allowed_set for c in found_categories) else "❌ Есть неразрешённые."
    print(status)

    # Группировка по категориям
    cat_to_reviews = {cat: [] for cat in allowed_set}
    for item in results:
        for ann in item.get("annotations", []):
            cat = ann.get("category", "").strip()
            if cat in cat_to_reviews:
                cat_to_reviews[cat].append(item)

    # Примеры
    print(f"\n🎯 Примеры (по {n_samples} на категорию):")
    for cat in sorted(cat_to_reviews.keys()):
        reviews = cat_to_reviews[cat]
        if not reviews:
            continue
        print(f"\n📌 '{cat}' ({len(reviews)} упоминаний)")
        sampled = random.sample(reviews, min(n_samples, len(reviews)))
        for r in sampled:
            summaries = [a.get("summary", "...") for a in r.get("annotations", []) if a.get("category") == cat]
            summary_text = "; ".join(summaries[:2])
            print(f"  🔹 ID {r['id']} — {summary_text[:150]}...")


def csv_read(filepath: str, nrows: Optional[int] = None) -> pd.DataFrame:
    df = pd.read_csv(filepath, nrows=nrows)
    required = ["id", "text"]
    if not all(col in df.columns for col in required):
        raise ValueError(f"CSV должен содержать: {required}")
    return df

def save_checkpoint(data: List[dict], filename: str):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 Чекпоинт сохранён: {filename}")


# === НАСТРОЙКИ ===
# Список категорий (уже составлен)
categories_list = [
     "Карты",
    "Банкоматы",
    "Кэшбэк / Бонусы",
    "Обслуживание в офисе",
    "Вклады",
    "Кредиты",
    "Курьерская служба",
    "Приложение / сайт",
    "Служба поддержки",
    "Счета",
    "Прочие услуги"
]

# Системный промпт
SYSTEM_PROMPT = f"""Ты — эксперт по анализу отзывов клиентов банка.
Проанализируй отзыв клиента банка и определи, какие продукты или услуги упоминаются, а также тональность отзыва (позитив/негатив/нейтральный)

Правила:
1. Категория должна быть ТОЛЬКО из следующего списка: {categories_list} . Запрещено выдумывать новые.
2. Категория "Прочие услуги" применяется только если ни одна из прочих категорий не подходит.
3. Тональность должна иметь ТОЛЬКО одно из трех значений: позитив, негатив или нейтральный.
   Если в разных частях отзыва разная окраска - в приоритете негатив.
   Например "в приложении очень богатый функционал, но невозможно долго грузится" = негатив.
4. Отвечай в формате JSON. Не добавляй элементы markdown, не отвечай простым текстом.

Формат ответа:

  {{ "annotations": [{{"category": "...", "summary": "...", "sentiment": "..." }}, ...] }}

Ответ должен быть ТОЛЬКО валидным JSON.
"""

# Путь к модели GGUF и URL для скачивания
MODEL_PATH = "model.gguf"
MODEL_URL = "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf"

# Число строк для теста (поставь None для всех)
TEST_ROWS = None

# Для classify_test - количество примеров для проверки результатов по категории
N_SAMPLES_PER_CATEGORY = 3

# Частота сохранения чекпойнтов
CHECKPOINT_EVERY = 5
OUTPUT_JSON = "llm_results.json"

# === 1. Скачивание модели (если нужно) ===
if not download_model(MODEL_URL, MODEL_PATH):
    print("❌ Не удалось скачать модель. Завершение работы.")
    exit(1)

# === 2. Чтение данных ===
df = csv_read("total_data_banki_i_sravni.csv", nrows=TEST_ROWS)
print(f"✅ Загружено {len(df)} строк")

# === 3. Инициализация LLM и классификатора ===
try:
    # Автоматическое определение доступности GPU
    try:
        import torch
        gpu_available = torch.cuda.is_available()
        n_gpu_layers = 35 if gpu_available else 0
        print(f"🖥️ GPU доступен: {gpu_available}")
    except ImportError:
        n_gpu_layers = 0
        print("🖥️ GPU не обнаружен, используем CPU")
    
    llm_engine = LLMLocal(
        model_path=MODEL_PATH,
        n_gpu_layers=n_gpu_layers,
        use_system_role=False      # ⚠️ Важно: эта модель не поддерживает system role
    )
    classifier = LLMClassifier(llm_engine, categories_list, SYSTEM_PROMPT)
    print("✅ LLM и классификатор инициализированы")
except Exception as e:
    print(f"🔴 Ошибка: {e}")
    raise

# === 4. Обработка отзывов ===
results = []

for idx, row in df.iterrows():
    review_id = row["id"]
    text = str(row["text"]).strip()

    print(f"[{idx+1}/{len(df)}] Обработка отзыва {review_id}...")
    annotation = classifier.classify(text)

    results.append({
        "id": review_id,
        "annotations": annotation.get("annotations", [])
    })

    # Чекпоинт
    if (idx + 1) % CHECKPOINT_EVERY == 0 or (idx + 1) == len(df):
        save_checkpoint(results, OUTPUT_JSON)

print(f"\n🎉 Обработка завершена! Обработано: {len(results)} отзывов")


# === Запуск теста ===
classify_test(results, categories_list, N_SAMPLES_PER_CATEGORY)

# === 5. Финальное сохранение ===
save_checkpoint(results, OUTPUT_JSON)
print(f"📤 Результат сохранён: {OUTPUT_JSON}")
