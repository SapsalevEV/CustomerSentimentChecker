import pandas as pd
from typing import Optional

def csv_to_json(csv_file: str, json_file: str, encoding: str = 'utf-8') -> None:
    """
    Конвертирует CSV файл в JSON с корректной поддержкой русских символов.
    
    Args:
        csv_file: Путь к CSV файлу
        json_file: Путь для сохранения JSON файла
        encoding: Кодировка файла (по умолчанию utf-8)
    """
    # Читаем CSV с указанной кодировкой
    df = pd.read_csv(csv_file, encoding=encoding)
    
    # Сохраняем в JSON с корректной поддержкой русских символов
    df.to_json(
        json_file, 
        orient='records', 
        force_ascii=False  # Важно для корректного отображения русских букв
    )

if __name__ == "__main__":
    # Конвертируем CSV в JSON с поддержкой русских букв
    csv_to_json(
        'backend/json/total_data_banki_i_sravni (2).csv',
        'backend/json/customer_reviews.json'
    )