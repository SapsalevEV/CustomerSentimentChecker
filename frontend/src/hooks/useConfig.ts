import { useQuery } from '@tanstack/react-query';
import { configApi } from '@/lib/api-services';
import type { ConfigResponse, SourceSchema, ProductSchema, DatePresetSchema } from '@/types/api';

/**
 * Hook to load application configuration from API
 * This includes sources, products, and date presets
 * Data is cached for 5 minutes and auto-refreshes on mount/focus
 */
export function useConfig() {
  const { data, isLoading, error } = useQuery<ConfigResponse>({
    queryKey: ['app-config'],
    queryFn: async () => {
      console.log('[useConfig] Fetching config from API...');
      try {
        const result = await configApi.getConfig();
        console.log('[useConfig] ✅ Config loaded successfully:', result);
        return result;
      } catch (err) {
        console.error('[useConfig] ❌ Failed to load config:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,        // 2 minutes - check for updates more frequently
    gcTime: 30 * 60 * 1000,          // 30 minutes - keep in cache
    retry: 1,                        // Retry once on failure (instead of giving up immediately)
    retryDelay: 1000,                // Wait 1 second before retry
    refetchOnMount: true,            // Check for updates on component mount
    refetchOnWindowFocus: true,      // Check for updates when window regains focus
  });

  console.log('[useConfig] Current state:', {
    hasData: !!data,
    sourcesCount: data?.sources?.length || 0,
    productsCount: data?.products?.length || 0,
    isLoading,
    hasError: !!error
  });

  return {
    config: data,
    sources: data?.sources || [],
    products: data?.products || [],
    datePresets: data?.date_presets || [],
    isLoading,
    error,
  };
}

/**
 * Type exports for convenience
 */
export type { SourceSchema, ProductSchema, DatePresetSchema };
