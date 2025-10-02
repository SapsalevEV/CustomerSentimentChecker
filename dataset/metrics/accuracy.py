# Класс для подсчёта метрики accuracy для оценки точности определения сентиментов

import json
from collections import defaultdict
from sklearn.metrics import accuracy_score

class SentimentEvaluator:
    """
    Класс для оценки точности определения тональности
    по каждой категории продукта.
    """

    def __init__(self, golden_standard_path, model_predictions_path):
        self.golden_standard_path = golden_standard_path
        self.model_predictions_path = model_predictions_path
        self.golden_data = None
        self.model_data = None

    def _load_data(self):
        """
        Приватный метод для загрузки данных из JSON-файлов.
        """
        try:
            with open(self.golden_standard_path, 'r', encoding='utf-8') as f:
                self.golden_data = json.load(f)
            with open(self.model_predictions_path, 'r', encoding='utf-8') as f:
                self.model_data = json.load(f)
        except FileNotFoundError as e:
            print(f"Ошибка: файл не найден. Проверьте путь: {e.filename}")
            raise
        except json.JSONDecodeError:
            print("Ошибка при декодировании JSON. Проверьте формат файла.")
            raise

    def _prepare_data(self):
        """
        Приватный метод для подготовки данных для оценки.
        """
        model_predictions_map = defaultdict(dict)
        for review in self.model_data:
            review_id = review.get('id')
            if not review_id:
                continue
            for annotation in review.get('annotations', []):
                category = annotation.get('category')
                sentiment = annotation.get('sentiment')
                if category and sentiment:
                    model_predictions_map[review_id][category] = sentiment
        return model_predictions_map

    def evaluate(self):
        """
        Вычисляет метрики точности для каждой категории и общий отчёт.
        """
        self._load_data()
        model_predictions_map = self._prepare_data()

        y_true = []
        y_pred = []
        mismatched_categories = []
        category_metrics = defaultdict(lambda: {'y_true': [], 'y_pred': []})

        for review in self.golden_data:
            review_id = review.get('id')
            if not review_id:
                continue

            golden_annotations = {ann['category']: ann['sentiment'] for ann in review.get('annotations', [])}
            model_review_predictions = model_predictions_map.get(review_id, {})
            
            golden_categories_set = set(golden_annotations.keys())
            predicted_categories_set = set(model_review_predictions.keys())
            
            common_categories = golden_categories_set.intersection(predicted_categories_set)

            for cat in common_categories:
                true_label = golden_annotations[cat]
                pred_label = model_review_predictions[cat]
                y_true.append(true_label)
                y_pred.append(pred_label)
                
                # Собираем данные для метрик по каждой категории
                category_metrics[cat]['y_true'].append(true_label)
                category_metrics[cat]['y_pred'].append(pred_label)
                
            unpredicted_in_golden = list(golden_categories_set - predicted_categories_set)
            extra_predicted = list(predicted_categories_set - golden_categories_set)
            
            if unpredicted_in_golden or extra_predicted:
                mismatched_categories.append({
                    "review_id": review_id,
                    "unpredicted_in_golden": unpredicted_in_golden,
                    "extra_predicted": extra_predicted
                })

        # Вычисление общей точности
        total_accuracy = accuracy_score(y_true, y_pred) if y_true else 0

        # Вычисление точности по категориям
        category_report = {
            cat: accuracy_score(metrics['y_true'], metrics['y_pred'])
            for cat, metrics in category_metrics.items()
        }
        
        return {
            "total_accuracy": total_accuracy,
            "category_accuracy": category_report,
            "mismatched_categories": mismatched_categories
        }

# === Пример использования ===
if __name__ == "__main__":
    golden_path = "output_structured_330.json"
    #model_path = "output_renamed_reviews_330.json"
    model_path = "output_dict_330_llama_test_2.json"
    try:
        evaluator = SentimentEvaluator(golden_path, model_path)
        report = evaluator.evaluate()
        
        print("Общий отчёт по оценке тональности:")
        print(json.dumps(report, indent=4, ensure_ascii=False))

    except (FileNotFoundError, json.JSONDecodeError):
        pass # Сообщение об ошибке уже выведено внутри класса