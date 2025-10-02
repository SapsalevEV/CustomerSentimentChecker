# Класс для построения матрицы переклассификации и подсчёта ментрики f1-score для оценки точности предсказания категорий продуктов

import json
from sklearn.metrics import f1_score, precision_score, recall_score
from collections import defaultdict
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

class F1MetricCalculator:
    """
    Класс для расчета F1-score, precision и recall для задачи мультилейбловой классификации,
    а также построения матрицы путаницы, используя заданный эталонный список категорий.
    """
    
    # Эталонный список категорий, который будет использоваться для матрицы и метрик
    CATEGORY_WHITELIST = [
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

    def __init__(self, golden_standard_path, model_output_path):
        self.golden_standard_path = golden_standard_path
        self.model_output_path = model_output_path
        self.golden_data = self._load_json_data(self.golden_standard_path)
        self.model_predictions, self._unique_categories_count = self._prepare_category_predictions()
        
        # Основной список категорий для расчетов и матрицы
        self.all_categories = sorted(list(self.CATEGORY_WHITELIST))
        
        # Дополнительный словарь для сбора категорий, предсказанных моделью, но отсутствующих в эталоне
        self.extra_predicted_categories = defaultdict(int) 

    def _load_json_data(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Ошибка загрузки файла {file_path}: {e}")
            return []

    def _prepare_category_predictions(self):
        predictions = {}
        unique_categories_count = defaultdict(int)
        model_data = self._load_json_data(self.model_output_path)
        
        for review in model_data:
            rid = review.get("id")
            if rid is None:
                continue
            
            cats = set()
            for ann in review.get("annotations", []):
                category = ann.get("category")
                if category:
                    cats.add(category)
            predictions[rid] = cats
            
        # Корректный подсчет предсказанных категорий
        for rid, cats in predictions.items():
             for cat in cats:
                 unique_categories_count[cat] += 1
                 
        return predictions, unique_categories_count
    
    def calculate_f1_per_review(self):
        """
        Рассчитывает F1, precision и recall для каждого отзыва, используя только категории из WHITE LIST.
        """
        metrics = {}
        # Создаем сет для быстрого доступа к разрешенным категориям
        whitelist_set = set(self.all_categories) 

        for review in self.golden_data:
            rid = review.get("id")
            if rid is None:
                continue

            # Фильтруем категории из золотого стандарта по whitelist
            true_cats = set([
                ann.get("category") for ann in review.get("annotations", []) 
                if ann.get("category") in whitelist_set
            ])
            # Фильтруем предсказания по whitelist
            pred_cats_full = self.model_predictions.get(rid, set())
            pred_cats = set([cat for cat in pred_cats_full if cat in whitelist_set])


            y_true = [1 if cat in true_cats else 0 for cat in self.all_categories]
            y_pred = [1 if cat in pred_cats else 0 for cat in self.all_categories]
            
            # Если в золотом стандарте и в предсказаниях нет категорий, считаем метрики идеальными
            if sum(y_true) == 0 and sum(y_pred) == 0:
                f1, p, r = 1.0, 1.0, 1.0
            else:
                # Используем average='micro' для мультилейбловой классификации
                f1 = f1_score(y_true, y_pred, average='micro', zero_division=0)
                p = precision_score(y_true, y_pred, average='micro', zero_division=0)
                r = recall_score(y_true, y_pred, average='micro', zero_division=0)

            metrics[rid] = {'f1': f1, 'precision': p, 'recall': r}
            
        return metrics
    
    def calculate_confusion_matrix_per_category(self):
        """
        Рассчитывает 2x2 метрики и матрицу переклассификации, 
        используя только категории из эталонного списка.
        Ошибочные предсказания, не входящие в эталонный список, собираются отдельно.
        """
        confusion_per_cat = {cat: {'TP': 0, 'FP': 0, 'FN': 0, 'TN': 0} for cat in self.all_categories}
        category_confusion = {cat: defaultdict(int) for cat in self.all_categories}
        
        whitelist_set = set(self.all_categories)
        self.extra_predicted_categories.clear() # Сброс счетчика

        for review in self.golden_data:
            rid = review.get("id")
            if rid is None:
                continue

            # Категории в золотом стандарте (должны быть в whitelist)
            true_cats_all = set([ann.get("category") for ann in review.get("annotations", [])])
            true_cats = set([cat for cat in true_cats_all if cat in whitelist_set]) 
            
            # Категории, предсказанные моделью (могут быть и не в whitelist)
            pred_cats_all = self.model_predictions.get(rid, set())
            pred_cats = set([cat for cat in pred_cats_all if cat in whitelist_set]) # Фильтруем для метрик

            # Категории, предсказанные моделью, но ОТСУТСТВУЮЩИЕ В ЭТАЛОНЕ (для отдельного отчета)
            extra_predicted_by_model = pred_cats_all - whitelist_set
            for cat in extra_predicted_by_model:
                self.extra_predicted_categories[cat] += 1
            
            # 1. Расчет TP, FP, FN, TN для 2x2 матриц (только по whitelist)
            for cat in self.all_categories:
                true_label = 1 if cat in true_cats else 0
                pred_label = 1 if cat in pred_cats else 0 # Сравнение только с отфильтрованными

                if true_label == 1 and pred_label == 1:
                    confusion_per_cat[cat]['TP'] += 1
                elif true_label == 0 and pred_label == 1:
                    confusion_per_cat[cat]['FP'] += 1
                elif true_label == 1 and pred_label == 0:
                    confusion_per_cat[cat]['FN'] += 1
                else:
                    confusion_per_cat[cat]['TN'] += 1

            # 2. Логика для МАТРИЦЫ ПЕРЕКЛАССИФИКАЦИИ (только по whitelist)
            
            # Заполняем диагональ (True Positives)
            for cat in true_cats.intersection(pred_cats):
                category_confusion[cat][cat] += 1
            
            # Путаница: Истинный (i) пропущен, и в этом же обзоре предсказан ложный (j)
            true_but_missed_cats = true_cats - pred_cats       # FN (только из whitelist)
            false_predicted_cats = pred_cats - true_cats       # FP (только из whitelist)
            
            for true_cat in true_but_missed_cats:
                for pred_cat in false_predicted_cats:
                    # Истинный класс 'true_cat' был пропущен и "заменен" классом 'pred_cat'
                    category_confusion[true_cat][pred_cat] += 1

        return confusion_per_cat, category_confusion

    def plot_confusion_heatmap(self, category_confusion):
        """
        Строит тепловую карту матрицы переклассификации, используя только self.all_categories (whitelist).
        """
        cats = self.all_categories
        matrix = np.zeros((len(cats), len(cats)))
        cat_idx = {cat: i for i, cat in enumerate(cats)}

        for true_cat, confused_with in category_confusion.items():
            for pred_cat, count in confused_with.items():
                # Проверяем, что обе категории в нашем whitelist (они должны быть)
                if true_cat in cat_idx and pred_cat in cat_idx:
                    matrix[cat_idx[true_cat], cat_idx[pred_cat]] = count

        plt.figure(figsize=(12, 10))
        sns.heatmap(matrix, xticklabels=cats, yticklabels=cats, annot=True, fmt='g', cmap='Blues', linewidths=.5, linecolor='lightgray')
        
        plt.xlabel('Предсказанный класс (FP в whitelist)', fontsize=12)
        plt.ylabel('Истинный класс (FN в whitelist)', fontsize=12)
        plt.title('Матрица Переклассификации (Только Эталонные Категории)', fontsize=14)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        plt.show()

    def print_extra_predicted_categories(self, extra_predicted_categories_data):
        """
        Выводит категории, предсказанные моделью, но отсутствующие в эталонном списке (whitelist).
        """
        if not extra_predicted_categories_data:
            print("\nНет предсказанных категорий, отсутствующих в эталонном списке (whitelist).")
            return

        print("\n" + "="*80)
        print("КАТЕГОРИИ, ПРЕДСКАЗАННЫЕ МОДЕЛЬЮ, НО ОТСУТСТВУЮЩИЕ В ЭТАЛОННОМ СПИСКЕ:")
        print("="*80)
        
        total_extra = sum(extra_predicted_categories_data.values())
        
        for cat, count in sorted(extra_predicted_categories_data.items(), key=lambda item: item[1], reverse=True):
            print(f"- {cat}: {count} раз")
        
        print(f"\nВсего предсказаний вне эталонного списка: {total_extra}")

    # --- Полный цикл генерации отчета ---
    def generate_report(self):
        """
        Основной метод, который запускает все расчеты и возвращает ключевые метрики.
        ВОЗВРАЩАЕТ 6 ЗНАЧЕНИЙ для корректной распаковки.
        """
        per_review_metrics = self.calculate_f1_per_review()
        
        # 1. Расчет средних метрик (3 шт.)
        avg_f1, avg_precision, avg_recall = self.calculate_f1_average()

        # 2. Расчет матриц (2 шт.)
        confusion_per_cat, category_confusion = self.calculate_confusion_matrix_per_category()

        # 3. Расчет статистики предсказаний (2 шт.)
        category_counts = self._unique_categories_count
        overpredicted_pct = self.calculate_overpredicted_percentage()
        
        # 4. Выводим все данные, необходимые для дальнейшего анализа
        return (
            per_review_metrics,
            avg_f1, 
            avg_precision, 
            avg_recall,
            category_counts,
            overpredicted_pct
        )

    def calculate_f1_average(self):
        all_metrics = self.calculate_f1_per_review()
        if not all_metrics:
            return 0.0, 0.0, 0.0
            
        total_f1 = sum(m['f1'] for m in all_metrics.values())
        total_precision = sum(m['precision'] for m in all_metrics.values())
        total_recall = sum(m['recall'] for m in all_metrics.values())
        
        count = len(all_metrics)
        avg_f1 = total_f1 / count
        avg_precision = total_precision / count
        avg_recall = total_recall / count
        
        return avg_f1, avg_precision, avg_recall

    def calculate_overpredicted_percentage(self):
        total_overpredicted = 0
        total_predicted = 0

        true_categories_by_id = {
             review.get("id"): set(
                 ann.get("category") for ann in review.get("annotations", []) 
                 if ann.get("category") in set(self.all_categories)
             )
             for review in self.golden_data
        }
        
        whitelist_set = set(self.all_categories)
        
        for rid, pred_cats_all in self.model_predictions.items():
            true_cats = true_categories_by_id.get(rid, set())
            pred_cats_whitelist = set([cat for cat in pred_cats_all if cat in whitelist_set])
            
            overpredicted = pred_cats_whitelist - true_cats
            total_overpredicted += len(overpredicted)
            total_predicted += len(pred_cats_whitelist)

        if total_predicted == 0:
            return 0.0
        return (total_overpredicted / total_predicted) * 100

    def get_overpredicted_classes_list(self):
        overpredicted_counts = defaultdict(int)

        true_categories_by_id = {
             review.get("id"): set(
                 ann.get("category") for ann in review.get("annotations", [])
                 if ann.get("category") in set(self.all_categories)
             )
             for review in self.golden_data
        }
        
        whitelist_set = set(self.all_categories)

        for rid, pred_cats_all in self.model_predictions.items():
            true_cats = true_categories_by_id.get(rid, set())
            pred_cats_whitelist = set([cat for cat in pred_cats_all if cat in whitelist_set])
            
            # FP - предсказано, но нет в истине (в рамках whitelist)
            overpredicted = pred_cats_whitelist - true_cats 
            for cat in overpredicted:
                overpredicted_counts[cat] += 1

        return dict(overpredicted_counts)

    def print_per_category_2x2_matrices(self, confusion_per_cat):
        """
        Выводит TP, FP, FN, TN для каждого класса и соответствующие Precision и Recall.
        """
        print("\n" + "="*80)
        print("2x2 МАТРИЦЫ ДЛЯ КАЖДОГО КЛАССА ИЗ ЭТАЛОННОГО СПИСКА (ONE-VS-REST)")
        print("="*80)

        report = {}
        
        for cat, conf in confusion_per_cat.items():
            TP, FP, FN, TN = conf['TP'], conf['FP'], conf['FN'], conf['TN']
            
            # Расчет метрик класса
            if (TP + FP) > 0:
                precision = TP / (TP + FP)
            else:
                precision = 0.0
            
            if (TP + FN) > 0:
                recall = TP / (TP + FN)
            else:
                recall = 0.0

            if (precision + recall) > 0:
                f1 = 2 * (precision * recall) / (precision + recall)
            else:
                f1 = 0.0

            report[cat] = {'Precision': precision, 'Recall': recall, 'F1': f1}
            
            # Форматированный вывод
            print(f"\n--- Класс: {cat} (Общее количество истинных в whitelist: {TP + FN}) ---")
            print(f"| {'Предсказано 1 (Положительно)':<30} | {'Предсказано 0 (Отрицательно)':<30} |")
            print("-" * 65)
            print(f"Истина 1 (Есть в обзоре): | {'TP: ' + str(TP):<30} | {'FN: ' + str(FN):<30} |")
            print(f"Истина 0 (Нет в обзоре): | {'FP: ' + str(FP):<30} | {'TN: ' + str(TN):<30} |")
            print("-" * 65)
            print(f"Precision (Точность): {precision:.4f} | Recall (Полнота): {recall:.4f} | F1: {f1:.4f}")
            
        return report

    def print_prediction_statistics(self, category_counts, overpredicted_classes, overpredicted_pct):
        """
        Выводит количество уникальных предсказаний по категориям и статистику
        по избыточно предсказанным классам (False Positives).
        """
        print("\n" + "="*80)
        print("СТАТИСТИКА ПРЕДСКАЗАНИЙ")
        print("="*80)
        
        # 1. Количество уникальных предсказаний
        print("\nКоличество уникальных предсказаний по категориям (включая extra):")
        # Сортируем по количеству предсказаний для лучшей читаемости
        sorted_counts = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        for cat, count in sorted_counts:
            print(f"  {cat}: {count}")

        # 2. Избыточно предсказанные классы (FP в whitelist)
        print("\nИзбыточно предсказанные классы и их количество (False Positives в эталонном списке):")
        if overpredicted_classes:
            sorted_fp = sorted(overpredicted_classes.items(), key=lambda x: x[1], reverse=True)
            for cat, count in sorted_fp:
                print(f"  {cat}: {count}")
        else:
            print("  Нет ложноположительных предсказаний.")

        # 3. Процент избыточных предсказаний
        print(f"\nПроцент избыточно предсказанных классов (от общего числа предсказаний в whitelist): {overpredicted_pct:.2f}%")
        print("-" * 80)
        

# --- пример использования ---
if __name__ == "__main__":
    golden_path = "output_structured_330.json"
    model_path = "output_dict_330_llama_test_2.json"
    
    # 1. Инициализация
    try:
        calculator = F1MetricCalculator(golden_path, model_path)
    except Exception as e:
        print(f"Не удалось инициализировать калькулятор метрик: {e}")
        exit()
    
    # 2. Расчет метрик.
    # generate_report теперь возвращает 6 значений, исправляя предыдущую ошибку ValueError
    per_review_metrics, avg_f1, avg_precision, avg_recall, category_counts, overpredicted_pct = calculator.generate_report()
    
    # 3. Рассчитываем матрицы. Этот вызов необходим, чтобы получить category_confusion для тепловой карты.
    confusion_per_cat, category_confusion = calculator.calculate_confusion_matrix_per_category()
    
    # 4. Вывод 2x2 матриц для каждого класса
    per_category_metrics = calculator.print_per_category_2x2_matrices(confusion_per_cat)

    # 5. Сбор и вывод статистики
    overpredicted_classes = calculator.get_overpredicted_classes_list()
    calculator.print_prediction_statistics(category_counts, overpredicted_classes, overpredicted_pct)
    
    # 6. Вывод категорий вне эталонного списка
    calculator.print_extra_predicted_categories(calculator.extra_predicted_categories)
    
    # 7. Общий вывод
    print(f"\n--- ОБЩИЕ МЕТРИКИ (Micro-average) ---")
    print(f"Среднее значение F1 (по отзывам): {avg_f1:.4f}")
    print(f"Среднее значение Precision (по отзывам): {avg_precision:.4f}")
    print(f"Среднее значение Recall (по отзывам): {avg_recall:.4f}")
    
    # 8. ДОБАВЛЕН ВЫВОД МАТРИЦЫ ОШИБОК ПО ВСЕМ КЛАССАМ ИЗ СПИСКА
    print("\n--- ТЕПЛОВАЯ КАРТА МАТРИЦЫ ПЕРЕКЛАССИФИКАЦИИ ---")
    calculator.plot_confusion_heatmap(category_confusion)