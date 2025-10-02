import { SentimentConfig, SentimentType, SentimentLevel } from '@/types';

/**
 * Centralized sentiment configuration and utilities
 * Eliminates code duplication across components
 */

export const SENTIMENT_THRESHOLDS = {
  EXCELLENT: 70,
  GOOD: 50,
  POOR: 30,
} as const;

export const SENTIMENT_COLORS = {
  positive: {
    text: 'text-sentiment-positive',
    bg: 'bg-green-100',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    hsl: 'hsl(var(--sentiment-positive))',
  },
  neutral: {
    text: 'text-muted-foreground',
    bg: 'bg-gray-100',
    border: 'border-gray-200', 
    badge: 'bg-gray-100 text-gray-800',
    hsl: 'hsl(var(--sentiment-neutral))',
  },
  negative: {
    text: 'text-sentiment-negative',
    bg: 'bg-red-100',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    hsl: 'hsl(var(--sentiment-negative))',
  },
} as const;

export const getSentimentConfig = (score: number): SentimentConfig => {
  if (score >= SENTIMENT_THRESHOLDS.EXCELLENT) {
    return {
      score,
      level: 'excellent',
      type: 'positive',
      color: SENTIMENT_COLORS.positive.text,
      bgColor: SENTIMENT_COLORS.positive.bg,
      borderColor: SENTIMENT_COLORS.positive.border,
      label: 'Отлично',
    };
  }
  
  if (score >= SENTIMENT_THRESHOLDS.GOOD) {
    return {
      score,
      level: 'good',
      type: 'neutral',
      color: SENTIMENT_COLORS.neutral.text,
      bgColor: SENTIMENT_COLORS.neutral.bg,
      borderColor: SENTIMENT_COLORS.neutral.border,
      label: 'Хорошо',
    };
  }
  
  if (score >= SENTIMENT_THRESHOLDS.POOR) {
    return {
      score,
      level: 'poor',
      type: 'negative',
      color: SENTIMENT_COLORS.negative.text,
      bgColor: SENTIMENT_COLORS.negative.bg,
      borderColor: SENTIMENT_COLORS.negative.border,
      label: 'Плохо',
    };
  }
  
  return {
    score,
    level: 'critical',
    type: 'negative',
    color: SENTIMENT_COLORS.negative.text,
    bgColor: SENTIMENT_COLORS.negative.bg,
    borderColor: SENTIMENT_COLORS.negative.border,
    label: 'Критично',
  };
};

export const getSentimentType = (score: number): SentimentType => {
  if (score >= SENTIMENT_THRESHOLDS.EXCELLENT) return 'positive';
  if (score >= SENTIMENT_THRESHOLDS.GOOD) return 'neutral';
  return 'negative';
};

export const getSentimentLevel = (score: number): SentimentLevel => {
  if (score >= SENTIMENT_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= SENTIMENT_THRESHOLDS.GOOD) return 'good';
  if (score >= SENTIMENT_THRESHOLDS.POOR) return 'poor';
  return 'critical';
};

export const getSentimentColor = (score: number): string => {
  const type = getSentimentType(score);
  return SENTIMENT_COLORS[type].hsl;
};

export const getSentimentBadgeClass = (type: SentimentType): string => {
  return SENTIMENT_COLORS[type].badge;
};

export const getSentimentTextClass = (score: number): string => {
  const type = getSentimentType(score);
  return SENTIMENT_COLORS[type].text;
};

/**
 * Validates sentiment data and ensures no NaN values
 */
export const validateSentimentData = (data: { positive: number; neutral: number; negative: number }) => {
  return {
    positive: isNaN(data.positive) ? 0 : Math.max(0, Math.min(100, data.positive)),
    neutral: isNaN(data.neutral) ? 0 : Math.max(0, Math.min(100, data.neutral)),
    negative: isNaN(data.negative) ? 0 : Math.max(0, Math.min(100, data.negative)),
  };
};

/**
 * Calculates overall sentiment score from positive/neutral/negative percentages
 */
export const calculateSentimentScore = (data: { positive: number; neutral: number; negative: number }): number => {
  const validated = validateSentimentData(data);
  const total = validated.positive + validated.neutral + validated.negative;
  
  if (total === 0) return 0;
  
  // Weighted score: positive=1, neutral=0.5, negative=0
  return Math.round(((validated.positive + validated.neutral * 0.5) / total) * 100);
};

/**
 * Format percentage with proper locale
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with locale-specific separators
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('ru-RU');
};

/**
 * Get trending arrow icon based on trend value
 */
export const getTrendIcon = (trend: number) => {
  return trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→';
};

/**
 * Get trend color class based on trend value and whether higher is better
 */
export const getTrendColorClass = (trend: number, higherIsBetter: boolean = true): string => {
  if (trend === 0) return 'text-muted-foreground';
  
  const isPositiveTrend = higherIsBetter ? trend > 0 : trend < 0;
  return isPositiveTrend ? 'text-sentiment-positive' : 'text-sentiment-negative';
};