/**
 * API Types - Generated from Backend OpenAPI Schema
 * Backend: http://72.56.64.34:8000/docs
 */

// ==================== Configuration API Types ====================

export interface SourceSchema {
  value: string;
  label: string;
}

export interface ProductSchema {
  value: string;
  label: string;
  category: string;
}

export interface DatePresetSchema {
  label: string;
  days: number;
}

export interface ConfigResponse {
  sources: SourceSchema[];
  products: ProductSchema[];
  date_presets?: DatePresetSchema[] | null;
}

// ==================== Dashboard API Types ====================

export interface DateRangeSchema {
  from: string; // ISO 8601 date-time
  to: string;   // ISO 8601 date-time
}

export interface FiltersSchema {
  sources: string[];
  products: string[];
}

export interface TrendSchema {
  direction: 'up' | 'down';
  change: number;
  change_percent: number;
}

export interface MetricSchema {
  current: number;
  percentage?: number | null; // For sentiment metrics
  trend: TrendSchema;
  sparkline: number[]; // Exactly 7 values
}

export interface MetricsSchema {
  total_reviews: MetricSchema;
  positive_reviews: MetricSchema;
  neutral_reviews: MetricSchema;
  negative_reviews: MetricSchema;
}

export interface SentimentDynamicsSchema {
  date: string; // ISO date (YYYY-MM-DD)
  positive: number; // 0-100
  neutral: number;  // 0-100
  negative: number; // 0-100
  topics?: string[] | null; // Top-3 topics
}

export interface MetaSchema {
  date_range: DateRangeSchema;
  filters_applied: FiltersSchema;
  last_updated: string; // ISO 8601 date-time
}

export interface OverviewRequest {
  date_range: DateRangeSchema;
  filters?: FiltersSchema;
}

export interface OverviewResponse {
  meta: MetaSchema;
  metrics: MetricsSchema;
  sentiment_dynamics: SentimentDynamicsSchema[];
}
