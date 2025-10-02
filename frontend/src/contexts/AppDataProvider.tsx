import { ReactNode } from 'react';
import { UnifiedFiltersProvider } from './UnifiedFiltersContext';

/**
 * Unified data provider wrapper
 * Single provider for all filtering state management
 * Eliminates context duplication and ensures consistent state
 */

interface AppDataProviderProps {
  children: ReactNode;
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  return (
    <UnifiedFiltersProvider>
      {children}
    </UnifiedFiltersProvider>
  );
}

/**
 * Export all hooks for convenience
 * Components can import everything from one place
 */
export { useFilters, useDashboard, useCrossFilter, type DateRange } from './UnifiedFiltersContext';
export { useDashboardData, useMetrics, useSentimentDynamics, useCriticalIssues } from '@/hooks/useDashboardData';

// DEPRECATED: Use datePresets from useFilters() context instead
export { datePresets } from './UnifiedFiltersContext';
