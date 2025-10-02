import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { subDays } from 'date-fns';
import { FilterState, CrossFilterAction } from '@/types';
import { useConfig } from '@/hooks/useConfig';

/**
 * Unified centralized state management for all filtering across the application
 * Combines the functionality of FiltersContext and DashboardContext
 * Eliminates duplication and ensures consistent filtering state everywhere
 */

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DatePreset {
  label: string;
  value: string;
  range: () => DateRange;
}

export const datePresets: DatePreset[] = [
  {
    label: 'Последние 7 дней',
    value: 'week',
    range: () => ({
      from: subDays(new Date(), 6),
      to: new Date()
    })
  },
  {
    label: 'Последние 30 дней',
    value: 'month',
    range: () => ({
      from: subDays(new Date(), 29),
      to: new Date()
    })
  },
  {
    label: 'Текущий месяц',
    value: 'current-month',
    range: () => ({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    })
  },
  {
    label: 'Текущий квартал',
    value: 'quarter',
    range: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        from: new Date(now.getFullYear(), quarter * 3, 1),
        to: now
      };
    }
  }
];

// DEPRECATED: These are fallback values if API is not available
// The real data should come from useConfig() hook
export const availableSourcesFallback = [
  { value: 'app-store', label: 'App Store' },
  { value: 'google-play', label: 'Google Play' },
  { value: 'banki-ru', label: 'Banki.ru' },
  { value: 'irecommend', label: 'iRecommend' },
  { value: 'social-vk', label: 'ВКонтакте' },
  { value: 'social-telegram', label: 'Telegram' },
  { value: 'reviews-site', label: 'Сайт отзывов' }
];

export const availableProductsFallback = [
  { value: 'credit-cards', label: 'Кредитные карты', category: 'Карты' },
  { value: 'debit-cards', label: 'Дебетовые карты', category: 'Карты' },
  { value: 'mortgage', label: 'Ипотека', category: 'Кредиты' },
  { value: 'auto-loan', label: 'Автокредит', category: 'Кредиты' },
  { value: 'consumer-loan', label: 'Потребительский кредит', category: 'Кредиты' },
  { value: 'deposits', label: 'Вклады', category: 'Депозиты' },
  { value: 'savings', label: 'Накопительные счета', category: 'Депозиты' },
  { value: 'mobile-app', label: 'Мобильное приложение', category: 'Сервисы' },
  { value: 'online-banking', label: 'Интернет-банк', category: 'Сервисы' },
  { value: 'support', label: 'Служба поддержки', category: 'Сервисы' }
];

const initialState: FilterState = {
  dateRange: {
    from: subDays(new Date(), 29),
    to: new Date()
  },
  sources: [],
  products: [],
  aspects: [],
  sentiments: [],
  searchText: undefined,
};

interface UnifiedFiltersContextType {
  // State
  state: FilterState;
  filters: FilterState; // Alias for backward compatibility

  // Config data from API
  availableSources: Array<{ value: string; label: string }>;
  availableProducts: Array<{ value: string; label: string; category: string }>;
  datePresets: DatePreset[];
  configLoading: boolean;
  configError: Error | null;

  // Reducer dispatch
  dispatch: React.Dispatch<CrossFilterAction>;

  // Generic filter methods
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilter: (key: keyof FilterState) => void;
  clearAllFilters: () => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Specific convenience methods (backward compatibility with FiltersContext)
  setDateRange: (range: DateRange) => void;
  setSources: (sources: string[]) => void;
  setProducts: (products: string[]) => void;

  // Cross-filtering methods (from DashboardContext)
  filterByProduct: (product: string) => void;
  filterByAspect: (aspect: string) => void;
  filterBySentiment: (sentiment: 'positive' | 'neutral' | 'negative') => void;

  // State queries
  isFiltered: () => boolean;
  getActiveFiltersCount: () => number;
}

const UnifiedFiltersContext = createContext<UnifiedFiltersContextType | undefined>(undefined);

function filtersReducer(state: FilterState, action: CrossFilterAction): FilterState {
  switch (action.type) {
    case 'SET_FILTER':
      if (!action.payload) return state;
      return {
        ...state,
        [action.payload.key]: action.payload.value,
      };
      
    case 'CLEAR_FILTER':
      if (!action.payload) return state;
      
      const { key } = action.payload;
      let resetValue: any;
      
      switch (key) {
        case 'dateRange':
          resetValue = initialState.dateRange;
          break;
        case 'sources':
        case 'products':
        case 'aspects':
        case 'sentiments':
          resetValue = [];
          break;
        case 'searchText':
          resetValue = undefined;
          break;
        default:
          resetValue = initialState[key];
      }
      
      return {
        ...state,
        [key]: resetValue,
      };
      
    case 'CLEAR_ALL':
      return initialState;
      
    default:
      return state;
  }
}

export function UnifiedFiltersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filtersReducer, initialState);

  // Load config from API
  const { config, sources, products, datePresets: apiDatePresets, isLoading, error } = useConfig();

  // Use API data or fallback to hardcoded values
  // FIXED: Only use fallback if API call failed (has error)
  // During loading, use real data (empty arrays) to avoid showing mock data
  const shouldUseFallback = !!error;
  const availableSourcesData = shouldUseFallback ? availableSourcesFallback : sources;
  const availableProductsData = shouldUseFallback ? availableProductsFallback : products;

  console.log('[UnifiedFiltersContext] Config state:', {
    hasConfig: !!config,
    isLoading,
    hasError: !!error,
    shouldUseFallback,
    sourcesCount: sources.length,
    productsCount: products.length,
    usingFallbackSources: shouldUseFallback,
    actualSourcesShown: availableSourcesData.length
  });

  // Merge API date presets with existing ones, preferring API data
  const datePresetsData: DatePreset[] = shouldUseFallback
    ? datePresets
    : apiDatePresets.map(preset => ({
        label: preset.label,
        value: preset.label.toLowerCase().replace(/\s+/g, '-'),
        range: () => ({
          from: subDays(new Date(), preset.days - 1),
          to: new Date()
        })
      }));

  // Generic filter methods
  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    dispatch({
      type: 'SET_FILTER',
      payload: { key, value },
    });
  };

  const clearFilter = (key: keyof FilterState) => {
    dispatch({
      type: 'CLEAR_FILTER',
      payload: { key, value: null },
    });
  };

  const clearAllFilters = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    Object.entries(newFilters).forEach(([key, value]) => {
      setFilter(key as keyof FilterState, value);
    });
  };

  const resetFilters = () => {
    clearAllFilters();
  };

  // Specific convenience methods (backward compatibility)
  const setDateRange = (range: DateRange) => {
    setFilter('dateRange', range);
  };

  const setSources = (sources: string[]) => {
    setFilter('sources', sources);
  };

  const setProducts = (products: string[]) => {
    setFilter('products', products);
  };

  // Cross-filtering methods
  const filterByProduct = (product: string) => {
    const currentProducts = state.products;
    const newProducts = currentProducts.includes(product)
      ? currentProducts.filter(p => p !== product)
      : [...currentProducts, product];
    
    setFilter('products', newProducts);
  };

  const filterByAspect = (aspect: string) => {
    const currentAspects = state.aspects;
    const newAspects = currentAspects.includes(aspect)
      ? currentAspects.filter(a => a !== aspect)
      : [...currentAspects, aspect];
    
    setFilter('aspects', newAspects);
  };

  const filterBySentiment = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const currentSentiments = state.sentiments;
    const newSentiments = currentSentiments.includes(sentiment)
      ? currentSentiments.filter(s => s !== sentiment)
      : [...currentSentiments, sentiment];
    
    setFilter('sentiments', newSentiments);
  };

  // State queries
  const isFiltered = (): boolean => {
    return (
      state.sources.length > 0 ||
      state.products.length > 0 ||
      state.aspects.length > 0 ||
      state.sentiments.length > 0 ||
      !!state.searchText
    );
  };

  const getActiveFiltersCount = (): number => {
    return (
      state.sources.length +
      state.products.length +
      state.aspects.length +
      state.sentiments.length +
      (state.searchText ? 1 : 0)
    );
  };

  const value: UnifiedFiltersContextType = {
    state,
    filters: state, // Alias for backward compatibility
    availableSources: availableSourcesData,
    availableProducts: availableProductsData,
    datePresets: datePresetsData,
    configLoading: isLoading,
    configError: error as Error | null,
    dispatch,
    setFilter,
    clearFilter,
    clearAllFilters,
    updateFilters,
    resetFilters,
    setDateRange,
    setSources,
    setProducts,
    filterByProduct,
    filterByAspect,
    filterBySentiment,
    isFiltered,
    getActiveFiltersCount,
  };

  return (
    <UnifiedFiltersContext.Provider value={value}>
      {children}
    </UnifiedFiltersContext.Provider>
  );
}

// Main hook
export function useFilters() {
  const context = useContext(UnifiedFiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a UnifiedFiltersProvider');
  }
  return context;
}

// Alias for backward compatibility with DashboardContext
export function useDashboard() {
  const context = useContext(UnifiedFiltersContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a UnifiedFiltersProvider');
  }
  return context;
}

// Hook for components that need to trigger cross-filtering
export function useCrossFilter() {
  const { filterByProduct, filterByAspect, filterBySentiment, state } = useFilters();
  
  return {
    filterByProduct,
    filterByAspect,
    filterBySentiment,
    currentFilters: state,
  };
}
