// Core data types
export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Product {
  value: string;
  label: string;
  category: string;
}

export interface Source {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Dashboard types
export interface KPIMetric {
  label: string;
  value: string | number;
  trend: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  variant: 'positive' | 'negative' | 'warning' | 'neutral';
}

export interface CriticalIssue {
  id: string;
  title: string;
  impact: 'Высокий' | 'Средний' | 'Низкий';
  sentiment: number;
  volume: number;
  trend: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  timeToFix: string;
}

export interface AspectSentiment extends SentimentScore {
  name: string;
  volume: number;
}

export interface ProductSentiment {
  product: string;
  aspects: AspectSentiment[];
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

export interface SentimentChartData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  topics?: string[];
}

// Cross-filtering state
export interface FilterState {
  dateRange: DateRange;
  sources: string[];
  products: string[];
  aspects: string[];
  sentiments: ('positive' | 'neutral' | 'negative')[];
  searchText?: string;
}

export interface CrossFilterAction {
  type: 'SET_FILTER' | 'CLEAR_FILTER' | 'CLEAR_ALL';
  payload?: {
    key: keyof FilterState;
    value: any;
  };
}

// Sentiment utilities types
export type SentimentLevel = 'excellent' | 'good' | 'poor' | 'critical';
export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface SentimentConfig {
  score: number;
  level: SentimentLevel;
  type: SentimentType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}