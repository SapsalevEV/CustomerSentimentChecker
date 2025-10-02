import { useQuery } from '@tanstack/react-query';
import { useFilters, useDashboard } from '@/contexts/AppDataProvider';
import { SentimentChartData } from '@/types';
import { dashboardApiV2 } from '@/lib/api-services';
import type { OverviewResponse } from '@/types/api';

/**
 * Unified hook for dashboard data management
 * Combines FiltersContext and DashboardContext logic
 * Provides reactive data loading based on filters with React Query caching
 */

interface DashboardMetrics {
  totalReviews: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  trendData: {
    total: number[];
    positive: number[];
    neutral: number[];
    negative: number[];
  };
}

interface DashboardData {
  metrics: DashboardMetrics;
  sentimentDynamics: SentimentChartData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Map API response to internal dashboard data format
 */
function mapApiResponseToMetrics(apiResponse: OverviewResponse): DashboardMetrics {
  const { metrics } = apiResponse;

  return {
    totalReviews: metrics.total_reviews.current,
    positiveReviews: metrics.positive_reviews.current,
    neutralReviews: metrics.neutral_reviews.current,
    negativeReviews: metrics.negative_reviews.current,
    positivePercentage: metrics.positive_reviews.percentage || 0,
    neutralPercentage: metrics.neutral_reviews.percentage || 0,
    negativePercentage: metrics.negative_reviews.percentage || 0,
    trendData: {
      total: metrics.total_reviews.sparkline,
      positive: metrics.positive_reviews.sparkline,
      neutral: metrics.neutral_reviews.sparkline,
      negative: metrics.negative_reviews.sparkline,
    }
  };
}

/**
 * Fetch dashboard data from real API
 */
async function fetchDashboardData(filters: {
  dateRange: { from: Date; to: Date };
  sources: string[];
  products: string[];
  aspects: string[];
  sentiments: ('positive' | 'neutral' | 'negative')[];
  searchText?: string;
}): Promise<Omit<DashboardData, 'isLoading' | 'error' | 'refetch'>> {
  const { dateRange, sources, products } = filters;

  try {
    // Call real API
    const apiResponse = await dashboardApiV2.getOverview({
      date_range: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      filters: {
        sources: sources,
        products: products,
      }
    });

    // Map API response to internal format
    const metrics = mapApiResponseToMetrics(apiResponse);

    // Map sentiment dynamics
    const sentimentDynamics: SentimentChartData[] = apiResponse.sentiment_dynamics.map(day => ({
      date: day.date,
      positive: day.positive,
      neutral: day.neutral,
      negative: day.negative,
      topics: day.topics || [],
    }));

    return {
      metrics,
      sentimentDynamics,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data from API:', error);

    // Fallback to empty data structure
    return fetchDashboardDataMock();
  }
}

/**
 * FALLBACK: Simplified error fallback
 * Returns empty/zero data when API fails
 */
async function fetchDashboardDataMock(): Promise<Omit<DashboardData, 'isLoading' | 'error' | 'refetch'>> {
  console.warn('API fallback: Using empty data structure');

  // Return empty but valid data structure
  const metrics: DashboardMetrics = {
    totalReviews: 0,
    positiveReviews: 0,
    neutralReviews: 0,
    negativeReviews: 0,
    positivePercentage: 0,
    neutralPercentage: 0,
    negativePercentage: 0,
    trendData: {
      total: [0, 0, 0, 0, 0, 0, 0],
      positive: [0, 0, 0, 0, 0, 0, 0],
      neutral: [0, 0, 0, 0, 0, 0, 0],
      negative: [0, 0, 0, 0, 0, 0, 0],
    }
  };

  return {
    metrics,
    sentimentDynamics: [],
  };
}

/**
 * Main hook for dashboard data
 * Automatically refetches when filters change
 */
export function useDashboardData(): DashboardData {
  const { filters } = useFilters();
  const { state: dashboardFilters } = useDashboard();

  // Combine both filter contexts
  const combinedFilters = {
    dateRange: filters.dateRange,
    sources: filters.sources.length > 0 ? filters.sources : dashboardFilters.sources,
    products: filters.products.length > 0 ? filters.products : dashboardFilters.products,
    aspects: dashboardFilters.aspects,
    sentiments: dashboardFilters.sentiments,
    searchText: dashboardFilters.searchText,
  };

  // Use React Query for caching and automatic refetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardData', combinedFilters],
    queryFn: () => fetchDashboardData(combinedFilters),
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  return {
    metrics: data?.metrics || {
      totalReviews: 0,
      positiveReviews: 0,
      neutralReviews: 0,
      negativeReviews: 0,
      positivePercentage: 0,
      neutralPercentage: 0,
      negativePercentage: 0,
      trendData: {
        total: [0, 0, 0, 0, 0, 0, 0],
        positive: [0, 0, 0, 0, 0, 0, 0],
        neutral: [0, 0, 0, 0, 0, 0, 0],
        negative: [0, 0, 0, 0, 0, 0, 0],
      }
    },
    sentimentDynamics: data?.sentimentDynamics || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook for metrics data only (optimization for components that only need metrics)
 * Provides detailed KPI calculations with trend analysis
 */
export function useMetrics() {
  const { metrics, isLoading, error } = useDashboardData();

  // Calculate trend direction and percentage change
  const calculateTrend = (trendData: number[]) => {
    if (trendData.length < 2) {
      return { direction: 'up' as const, change: 0, changePercent: 0 };
    }
    
    const current = trendData[trendData.length - 1];
    const previous = trendData[0];
    const change = current - previous;
    const changePercent = previous !== 0 ? Math.round((change / previous) * 100) : 0;
    
    return {
      direction: change >= 0 ? ('up' as const) : ('down' as const),
      change,
      changePercent: Math.abs(changePercent),
    };
  };

  // Enhanced metrics with trend calculations
  const enhancedMetrics = {
    totalReviews: {
      value: metrics.totalReviews,
      trend: calculateTrend(metrics.trendData.total),
      trendData: metrics.trendData.total,
    },
    positiveReviews: {
      value: metrics.positiveReviews,
      percentage: metrics.positivePercentage,
      trend: calculateTrend(metrics.trendData.positive),
      trendData: metrics.trendData.positive,
    },
    neutralReviews: {
      value: metrics.neutralReviews,
      percentage: metrics.neutralPercentage,
      trend: calculateTrend(metrics.trendData.neutral),
      trendData: metrics.trendData.neutral,
    },
    negativeReviews: {
      value: metrics.negativeReviews,
      percentage: metrics.negativePercentage,
      trend: calculateTrend(metrics.trendData.negative),
      trendData: metrics.trendData.negative,
    },
  };

  return { 
    metrics: enhancedMetrics,
    rawMetrics: metrics,
    isLoading, 
    error 
  };
}

/**
 * Hook for sentiment dynamics data with drill-down capabilities
 * Provides temporal chart data and interaction handlers
 */
export function useSentimentDynamics() {
  const { sentimentDynamics, isLoading, error, refetch } = useDashboardData();
  const { setFilter, state: dashboardFilters } = useDashboard();
  const { setDateRange } = useFilters();

  /**
   * Handle click on a specific date in the chart
   * Sets filters to drill down into that specific date
   */
  const handleDateClick = (date: string) => {
    const clickedDate = new Date(date);
    setDateRange({
      from: clickedDate,
      to: clickedDate,
    });
    
    // Optionally trigger refetch
    refetch();
  };

  /**
   * Handle click on a specific sentiment type
   * Filters data to show only that sentiment
   */
  const handleSentimentClick = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const currentSentiments = dashboardFilters.sentiments;
    
    // Toggle sentiment filter
    if (currentSentiments.includes(sentiment)) {
      setFilter('sentiments', currentSentiments.filter(s => s !== sentiment));
    } else {
      setFilter('sentiments', [...currentSentiments, sentiment]);
    }
  };

  /**
   * Handle drill-down into a specific data point
   * Opens detailed view with filters applied
   */
  const handleDrillDown = (date: string, sentiment?: 'positive' | 'neutral' | 'negative') => {
    const clickedDate = new Date(date);
    
    // Set date filter
    setDateRange({
      from: clickedDate,
      to: clickedDate,
    });

    // Set sentiment filter if provided
    if (sentiment) {
      setFilter('sentiments', [sentiment]);
    }

    // Return navigation data for components that need it
    return {
      date: clickedDate,
      sentiment,
      topics: sentimentDynamics.find(d => d.date === date)?.topics || [],
    };
  };

  /**
   * Get aggregated data for the entire period
   */
  const getAggregatedData = () => {
    if (sentimentDynamics.length === 0) {
      return { positive: 0, neutral: 0, negative: 0, total: 0 };
    }

    const totals = sentimentDynamics.reduce(
      (acc, day) => ({
        positive: acc.positive + day.positive,
        neutral: acc.neutral + day.neutral,
        negative: acc.negative + day.negative,
      }),
      { positive: 0, neutral: 0, negative: 0 }
    );

    const total = totals.positive + totals.neutral + totals.negative;
    const avgPositive = Math.round(totals.positive / sentimentDynamics.length);
    const avgNeutral = Math.round(totals.neutral / sentimentDynamics.length);
    const avgNegative = Math.round(totals.negative / sentimentDynamics.length);

    return {
      ...totals,
      total,
      averages: {
        positive: avgPositive,
        neutral: avgNeutral,
        negative: avgNegative,
      },
    };
  };

  /**
   * Get trend direction for sentiment over time
   */
  const getSentimentTrend = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (sentimentDynamics.length < 2) {
      return { direction: 'stable' as const, change: 0 };
    }

    const firstValue = sentimentDynamics[0][sentiment];
    const lastValue = sentimentDynamics[sentimentDynamics.length - 1][sentiment];
    const change = lastValue - firstValue;

    return {
      direction: change > 2 ? ('up' as const) : change < -2 ? ('down' as const) : ('stable' as const),
      change,
      changePercent: firstValue !== 0 ? Math.round((change / firstValue) * 100) : 0,
    };
  };

  return { 
    sentimentDynamics,
    aggregatedData: getAggregatedData(),
    trends: {
      positive: getSentimentTrend('positive'),
      neutral: getSentimentTrend('neutral'),
      negative: getSentimentTrend('negative'),
    },
    handlers: {
      handleDateClick,
      handleSentimentClick,
      handleDrillDown,
    },
    isLoading, 
    error,
    refetch,
  };
}

/**
 * @deprecated Critical issues not available from API
 * This hook is kept for backwards compatibility but returns empty data
 */
export function useCriticalIssues() {
  console.warn('useCriticalIssues is deprecated: endpoint /api/critical-issues not implemented');
  return { criticalIssues: [], isLoading: false, error: null };
}
