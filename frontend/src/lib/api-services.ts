/**
 * API Services
 * High-level service functions for all backend API calls
 */

import { apiClient } from './api-client';
import type {
  ConfigResponse,
  OverviewRequest,
  OverviewResponse
} from '@/types/api';

// ==================== Types ====================

export interface DateFilter {
  start_date: string;
  end_date: string;
}

export interface ReviewFilters extends DateFilter {
  sentiment?: string[];
  products?: string[];
  sources?: string[];
  search_text?: string;
}

export interface SentimentStats {
  total_feedback: number;
  overall_sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  sentiment_dynamics: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  average_score: number;
}

export interface Review {
  id: string;
  text: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  products: string[];
  aspects: Array<{
    name: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  author?: string;
  verified?: boolean;
}

export interface ReviewsResponse {
  data: Review[];
  total_count: number;
  has_more: boolean;
}

export interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  sentiment: number;
  volume: number;
  growth: number;
  confidence: number;
  examples: string[];
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface EmergingIssue {
  id: string;
  title: string;
  description: string;
  first_detected: string;
  growth_rate: number;
  current_mentions: number;
  projected_mentions: number;
  sentiment: number;
  confidence: number;
  key_terms: string[];
  sample_reviews: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  potential_causes: string[];
  recommended_actions: string[];
}

export interface Anomaly {
  id: string;
  type: 'sentiment_drop' | 'volume_spike' | 'new_issue' | 'pattern_change';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detected: string;
  confidence: number;
  impact: string;
  affected_products: string[];
  suggested_actions: string[];
  chart_data?: Array<{ date: string; value: number; anomaly?: boolean }>;
}

// ==================== API Services ====================

/**
 * Configuration API
 */
export const configApi = {
  /**
   * Get configuration data (sources, products, date presets)
   * This should be called once on app initialization
   */
  getConfig: async (): Promise<ConfigResponse> => {
    return apiClient.get<ConfigResponse>('/api/config');
  },
};

/**
 * Dashboard & Statistics (NEW - Actionable Sentiment API)
 */
export const dashboardApiV2 = {
  /**
   * Get complete dashboard overview data
   * Includes metrics with trends and sentiment dynamics
   */
  getOverview: async (request: OverviewRequest): Promise<OverviewResponse> => {
    return apiClient.post<OverviewResponse>('/api/dashboard/overview', request);
  },
};

// ==================== DEPRECATED / NOT IMPLEMENTED APIs ====================
// These endpoints do not exist on the backend yet
// See API_INTEGRATION_STATUS.md for full list of required endpoints

/**
 * @deprecated Legacy API - endpoint does not exist
 * Use dashboardApiV2.getOverview() instead
 */
export const dashboardApi = {
  getSentimentStats: async (filters: DateFilter & { filters?: Record<string, string[]> }): Promise<SentimentStats> => {
    throw new Error('Endpoint /sentiment-stats not implemented. Use /api/dashboard/overview instead');
  },
  getTopicsAnalysis: async (filters: DateFilter & { sentiment_filter?: 'pos' | 'neg' | 'neu' }): Promise<{ topics: Array<{ topic: string; count: number; average_score: number }> }> => {
    throw new Error('Endpoint /topics-analysis not implemented');
  },
};

/**
 * Reviews API (NOT IMPLEMENTED YET)
 * TODO: Implement on backend
 * See API_INTEGRATION_STATUS.md for specification
 */
export const reviewsApi = {
  getReviews: async (params: ReviewFilters & { sort_by?: string; page?: number; limit?: number }): Promise<ReviewsResponse> => {
    throw new Error('Endpoint /api/reviews not implemented. Using mock data.');
  },
  getReviewById: async (id: string): Promise<Review> => {
    throw new Error('Endpoint /api/reviews/:id not implemented. Using mock data.');
  },
};

/**
 * Products API (NOT IMPLEMENTED YET)
 * TODO: Implement on backend
 * See API_INTEGRATION_STATUS.md for specification
 */
export const productsApi = {
  getProductsPerformance: async (filters: DateFilter): Promise<{
    products: Array<{
      id: string;
      name: string;
      satisfaction: number;
      feedback_volume: number;
      growth: string;
      category: string;
      critical_features: string[];
    }>;
  }> => {
    throw new Error('Endpoint /api/products/performance not implemented. Using mock data.');
  },
  getAspectPriorities: async (filters: DateFilter & { products?: string[] }): Promise<{
    aspects: Array<{
      aspect: string;
      importance: number;
      satisfaction: number;
      gap: number;
      products: string[];
      actionable: boolean;
    }>;
  }> => {
    throw new Error('Endpoint /api/products/aspect-priorities not implemented. Using mock data.');
  },
};

/**
 * Intelligence & ML API (NOT IMPLEMENTED YET)
 * TODO: Implement on backend
 * See API_INTEGRATION_STATUS.md for specification
 */
export const intelligenceApi = {
  getSmartClusters: async (filters: DateFilter & { min_confidence?: number }): Promise<{ clusters: TopicCluster[] }> => {
    throw new Error('Endpoint /api/intelligence/smart-clusters not implemented. Using mock data.');
  },
  getEmergingIssues: async (params: { lookback_days?: number; min_growth_rate?: number }): Promise<{ emerging_issues: EmergingIssue[] }> => {
    throw new Error('Endpoint /api/intelligence/emerging-issues not implemented. Using mock data.');
  },
  getAnomalies: async (params: { time_window_hours?: number; severity_threshold?: string }): Promise<{ anomalies: Anomaly[] }> => {
    throw new Error('Endpoint /api/intelligence/anomalies not implemented. Using mock data.');
  },
};

/**
 * Comparative Analysis API (NOT IMPLEMENTED YET)
 * TODO: Implement on backend
 * See API_INTEGRATION_STATUS.md for specification
 */
export const comparativeApi = {
  getComparativeProducts: async (params: DateFilter & { products: string[] }): Promise<{
    products: Array<{
      product_id: string;
      aspects: Array<{
        name: string;
        positive: number;
        neutral: number;
        negative: number;
      }>;
    }>;
  }> => {
    throw new Error('Endpoint /api/comparative/products not implemented. Using mock data.');
  },
  getAspectComparison: async (params: DateFilter & { aspect: string }): Promise<{
    aspect: string;
    products: Array<{
      product_id: string;
      product_name: string;
      sentiment: number;
      category: string;
    }>;
  }> => {
    throw new Error('Endpoint /api/comparative/aspects not implemented. Using mock data.');
  },
};

