import { ProductSentiment, CriticalIssue, KPIMetric, SentimentChartData } from '@/types';
import { availableProductsFallback } from '@/contexts/UnifiedFiltersContext';

/**
 * Centralized mock data with proper typing
 * Eliminates data duplication across components
 */

// Sentiment data by product and aspect
export const getMockSentimentData = (productValue: string): ProductSentiment['aspects'] => {
  const sentimentData: Record<string, ProductSentiment['aspects']> = {
    'credit-cards': [
      { name: 'Процентная ставка', positive: 45, neutral: 30, negative: 25, volume: 156 },
      { name: 'Кешбэк/бонусы', positive: 80, neutral: 15, negative: 5, volume: 243 },
      { name: 'Мобильное приложение', positive: 35, neutral: 25, negative: 40, volume: 189 },
      { name: 'Служба поддержки', positive: 20, neutral: 35, negative: 45, volume: 134 },
      { name: 'Условия обслуживания', positive: 60, neutral: 20, negative: 20, volume: 98 },
    ],
    'debit-cards': [
      { name: 'Процентная ставка', positive: 55, neutral: 25, negative: 20, volume: 134 },
      { name: 'Кешбэк/бонусы', positive: 70, neutral: 20, negative: 10, volume: 198 },
      { name: 'Мобильное приложение', positive: 45, neutral: 30, negative: 25, volume: 156 },
      { name: 'Служба поддержки', positive: 30, neutral: 40, negative: 30, volume: 123 },
      { name: 'Условия обслуживания', positive: 65, neutral: 25, negative: 10, volume: 87 },
    ],
    'mortgage': [
      { name: 'Процентная ставка', positive: 25, neutral: 35, negative: 40, volume: 234 },
      { name: 'Кешбэк/бонусы', positive: 30, neutral: 50, negative: 20, volume: 45 },
      { name: 'Мобильное приложение', positive: 40, neutral: 30, negative: 30, volume: 78 },
      { name: 'Служба поддержки', positive: 35, neutral: 25, negative: 40, volume: 167 },
      { name: 'Условия обслуживания', positive: 45, neutral: 30, negative: 25, volume: 123 },
    ],
    'auto-loan': [
      { name: 'Процентная ставка', positive: 40, neutral: 30, negative: 30, volume: 89 },
      { name: 'Кешбэк/бонусы', positive: 35, neutral: 45, negative: 20, volume: 34 },
      { name: 'Мобильное приложение', positive: 42, neutral: 28, negative: 30, volume: 67 },
      { name: 'Служба поддержки', positive: 25, neutral: 35, negative: 40, volume: 98 },
      { name: 'Условия обслуживания', positive: 50, neutral: 25, negative: 25, volume: 76 },
    ],
    'consumer-loan': [
      { name: 'Процентная ставка', positive: 30, neutral: 35, negative: 35, volume: 145 },
      { name: 'Кешбэк/бонусы', positive: 25, neutral: 50, negative: 25, volume: 23 },
      { name: 'Мобильное приложение', positive: 38, neutral: 32, negative: 30, volume: 89 },
      { name: 'Служба поддержки', positive: 22, neutral: 38, negative: 40, volume: 134 },
      { name: 'Условия обслуживания', positive: 35, neutral: 35, negative: 30, volume: 98 },
    ],
    'deposits': [
      { name: 'Процентная ставка', positive: 70, neutral: 20, negative: 10, volume: 167 },
      { name: 'Кешбэк/бонусы', positive: 40, neutral: 40, negative: 20, volume: 45 },
      { name: 'Мобильное приложение', positive: 50, neutral: 30, negative: 20, volume: 98 },
      { name: 'Служба поддержки', positive: 45, neutral: 30, negative: 25, volume: 87 },
      { name: 'Условия обслуживания', positive: 80, neutral: 15, negative: 5, volume: 123 },
    ],
    'savings': [
      { name: 'Процентная ставка', positive: 75, neutral: 15, negative: 10, volume: 134 },
      { name: 'Кешбэк/бонусы', positive: 45, neutral: 35, negative: 20, volume: 34 },
      { name: 'Мобильное приложение', positive: 55, neutral: 25, negative: 20, volume: 78 },
      { name: 'Служба поддержки', positive: 50, neutral: 25, negative: 25, volume: 67 },
      { name: 'Условия обслуживания', positive: 85, neutral: 10, negative: 5, volume: 98 },
    ],
    'mobile-app': [
      { name: 'Процентная ставка', positive: 60, neutral: 25, negative: 15, volume: 45 },
      { name: 'Кешбэк/бонусы', positive: 85, neutral: 10, negative: 5, volume: 156 },
      { name: 'Мобильное приложение', positive: 25, neutral: 35, negative: 40, volume: 345 },
      { name: 'Служба поддержки', positive: 15, neutral: 35, negative: 50, volume: 234 },
      { name: 'Условия обслуживания', positive: 55, neutral: 25, negative: 20, volume: 89 },
    ],
    'online-banking': [
      { name: 'Процентная ставка', positive: 50, neutral: 30, negative: 20, volume: 67 },
      { name: 'Кешбэк/бонусы', positive: 75, neutral: 15, negative: 10, volume: 123 },
      { name: 'Мобильное приложение', positive: 60, neutral: 20, negative: 20, volume: 198 },
      { name: 'Служба поддержки', positive: 40, neutral: 30, negative: 30, volume: 145 },
      { name: 'Условия обслуживания', positive: 70, neutral: 20, negative: 10, volume: 98 },
    ],
    'support': [
      { name: 'Процентная ставка', positive: 45, neutral: 30, negative: 25, volume: 78 },
      { name: 'Кешбэк/бонусы', positive: 20, neutral: 50, negative: 30, volume: 34 },
      { name: 'Мобильное приложение', positive: 30, neutral: 30, negative: 40, volume: 156 },
      { name: 'Służba поддержки', positive: 18, neutral: 32, negative: 50, volume: 234 },
      { name: 'Условия обслуживания', positive: 40, neutral: 30, negative: 30, volume: 123 },
    ]
  };

  const defaultData: ProductSentiment['aspects'] = [
    { name: 'Общие условия', positive: 50, neutral: 30, negative: 20, volume: 100 },
    { name: 'Качество сервиса', positive: 45, neutral: 35, negative: 20, volume: 80 },
    { name: 'Техническая поддержка', positive: 40, neutral: 30, negative: 30, volume: 60 },
  ];

  return sentimentData[productValue] || defaultData;
};

// Aspect sentiment across all products
export const getMockAspectSentiment = (aspect: string): Record<string, number> => {
  const aspectData: Record<string, Record<string, number>> = {
    'Процентная ставка': {
      'credit-cards': 45, 'debit-cards': 55, 'mortgage': 25, 'auto-loan': 40,
      'consumer-loan': 30, 'deposits': 70, 'savings': 75, 'mobile-app': 60,
      'online-banking': 50, 'support': 45
    },
    'Кешбэк/бонусы': {
      'credit-cards': 80, 'debit-cards': 70, 'mortgage': 30, 'auto-loan': 35,
      'consumer-loan': 25, 'deposits': 40, 'savings': 45, 'mobile-app': 85,
      'online-banking': 75, 'support': 20
    },
    'Мобильное приложение': {
      'credit-cards': 35, 'debit-cards': 45, 'mortgage': 40, 'auto-loan': 42,
      'consumer-loan': 38, 'deposits': 50, 'savings': 55, 'mobile-app': 25,
      'online-banking': 60, 'support': 30
    },
    'Служба поддержки': {
      'credit-cards': 20, 'debit-cards': 30, 'mortgage': 35, 'auto-loan': 25,
      'consumer-loan': 22, 'deposits': 45, 'savings': 50, 'mobile-app': 15,
      'online-banking': 40, 'support': 18
    },
    'Условия обслуживания': {
      'credit-cards': 60, 'debit-cards': 65, 'mortgage': 45, 'auto-loan': 50,
      'consumer-loan': 35, 'deposits': 80, 'savings': 85, 'mobile-app': 55,
      'online-banking': 70, 'support': 40
    },
    'Скорость обслуживания': {
      'credit-cards': 55, 'debit-cards': 60, 'mortgage': 35, 'auto-loan': 45,
      'consumer-loan': 30, 'deposits': 75, 'savings': 80, 'mobile-app': 40,
      'online-banking': 65, 'support': 25
    },
    'Удобство использования': {
      'credit-cards': 70, 'debit-cards': 75, 'mortgage': 50, 'auto-loan': 55,
      'consumer-loan': 45, 'deposits': 85, 'savings': 90, 'mobile-app': 30,
      'online-banking': 80, 'support': 35
    },
    'Документооборот': {
      'credit-cards': 40, 'debit-cards': 45, 'mortgage': 30, 'auto-loan': 35,
      'consumer-loan': 25, 'deposits': 60, 'savings': 65, 'mobile-app': 50,
      'online-banking': 55, 'support': 30
    }
  };

  const data = aspectData[aspect];
  if (data) {
    return data;
  }

  // Default data if aspect not found
  return availableProductsFallback.reduce((acc, product) => {
    acc[product.value] = Math.floor(Math.random() * 60) + 20; // 20-80%
    return acc;
  }, {} as Record<string, number>);
};

// Critical issues data
export const criticalIssues: CriticalIssue[] = [
  {
    id: "CRIT-001",
    title: "Сбои мобильного приложения",
    impact: "Высокий",
    sentiment: 28,
    volume: 312,
    trend: "+34%",
    description: "Частые крэши при входе в приложение, особенно на Android устройствах",
    priority: "P0",
    timeToFix: "2-3 дня"
  },
  {
    id: "CRIT-002",
    title: "Задержки доставки карт",
    impact: "Средний",
    sentiment: 35,
    volume: 189,
    trend: "+28%",
    description: "Увеличение времени доставки карт до 10-14 дней",
    priority: "P1",
    timeToFix: "1-2 недели"
  },
  {
    id: "CRIT-003",
    title: "Долгое ожидание поддержки",
    impact: "Средний",
    sentiment: 42,
    volume: 156,
    trend: "+19%",
    description: "Среднее время ожидания в телефонной поддержке превышает 8 минут",
    priority: "P1",
    timeToFix: "3-5 дней"
  },
  {
    id: "CRIT-004",
    title: "Сложность интерфейса переводов",
    impact: "Низкий",
    sentiment: 48,
    volume: 134,
    trend: "+15%",
    description: "Пользователи жалуются на сложность процесса международных переводов",
    priority: "P2",
    timeToFix: "2-3 недели"
  },
  {
    id: "CRIT-005",
    title: "Недоступность банкоматов",
    impact: "Средний",
    sentiment: 31,
    volume: 98,
    trend: "+12%",
    description: "Участились случаи неработающих банкоматов в центральных районах",
    priority: "P1",
    timeToFix: "1 неделя"
  }
];

// Dashboard KPI data
export const kpiMetrics: KPIMetric[] = [
  {
    label: "Отзывов сегодня",
    value: "2,847",
    trend: {
      value: 12,
      direction: "up",
      label: "к вчерашнему дню"
    },
    variant: "positive"
  },
  {
    label: "Очередь обработки",
    value: "94%",
    trend: {
      value: -3,
      direction: "down",
      label: "к прошлому часу"
    },
    variant: "warning"
  },
  {
    label: "Среднее время ответа",
    value: "2.4ч",
    trend: {
      value: 8,
      direction: "up",
      label: "к целевым 2.0ч"
    },
    variant: "negative"
  }
];

// Sentiment dynamics chart data  
export const getMockSentimentDynamics = (): SentimentChartData[] => [
  { 
    date: "2024-01-14", 
    positive: 68, 
    neutral: 24, 
    negative: 8,
    topics: ["Быстрое одобрение", "Удобное приложение", "Хороший кешбэк"]
  },
  { 
    date: "2024-01-15", 
    positive: 71, 
    neutral: 21, 
    negative: 8,
    topics: ["Качественная поддержка", "Низкие комиссии", "Быстрые переводы"]
  },
  { 
    date: "2024-01-16", 
    positive: 69, 
    neutral: 23, 
    negative: 8,
    topics: ["Стабильное приложение", "Выгодные условия", "Понятный интерфейс"]
  },
  { 
    date: "2024-01-17", 
    positive: 73, 
    neutral: 19, 
    negative: 8,
    topics: ["Быстрые выплаты", "Отличный сервис", "Удобные банкоматы"]
  },
  { 
    date: "2024-01-18", 
    positive: 76, 
    neutral: 16, 
    negative: 8,
    topics: ["Простое оформление", "Хорошие бонусы", "Качественная работа"]
  },
  { 
    date: "2024-01-19", 
    positive: 74, 
    neutral: 18, 
    negative: 8,
    topics: ["Надежный банк", "Выгодная ипотека", "Понятные условия"]
  },
  { 
    date: "2024-01-20", 
    positive: 73, 
    neutral: 19, 
    negative: 8,
    topics: ["Удобный офис", "Быстрое обслуживание", "Хорошие тарифы"]
  }
];