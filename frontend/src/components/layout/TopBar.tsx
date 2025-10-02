import { Search, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { SourcesFilter } from "@/components/filters/SourcesFilter";
import { ProductsFilter } from "@/components/filters/ProductsFilter";
import { useFilters, useDashboard } from "@/contexts/AppDataProvider";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function TopBar() {
  const { filters, resetFilters, setSources, setProducts, availableSources, availableProducts } = useFilters();
  const { setFilter, clearAllFilters, getActiveFiltersCount } = useDashboard();
  const [searchValue, setSearchValue] = useState("");

  // Sync search with dashboard filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('searchText', searchValue || undefined);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchValue, setFilter]);

  const handleResetAll = () => {
    resetFilters();
    clearAllFilters();
    setSearchValue("");
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Get active filter chips
  const getActiveFilterChips = () => {
    const chips: Array<{ label: string; onRemove: () => void }> = [];

    // Sources
    filters.sources.forEach(sourceValue => {
      const source = availableSources.find(s => s.value === sourceValue);
      if (source) {
        chips.push({
          label: source.label,
          onRemove: () => {
            const newSources = filters.sources.filter(s => s !== sourceValue);
            setSources(newSources);
          }
        });
      }
    });

    // Products
    filters.products.forEach(productValue => {
      const product = availableProducts.find(p => p.value === productValue);
      if (product) {
        chips.push({
          label: product.label,
          onRemove: () => {
            const newProducts = filters.products.filter(p => p !== productValue);
            setProducts(newProducts);
          }
        });
      }
    });

    return chips;
  };

  const activeChips = getActiveFilterChips();

  return (
    <div className="flex flex-col bg-card border-b border-border">
      <header className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger />
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск по отзывам, инцидентам, клиентам..."
              className="pl-10 w-80 bg-muted/50 border-none focus:bg-background"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchValue("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {/* Global Filters */}
          <div className="flex items-center gap-3 ml-6 flex-1 justify-center">
            <DateRangeFilter />
            <SourcesFilter />
            <ProductsFilter />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="text-muted-foreground hover:text-foreground relative"
              title="Сбросить все фильтры"
              disabled={activeFiltersCount === 0}
            >
              <RotateCcw className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Active Filters Display */}
      {(activeChips.length > 0 || searchValue) && (
        <div className="px-6 py-2 bg-muted/30 border-t border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            Активные фильтры:
          </span>
          
          {/* Date Range Badge */}
          <Badge variant="secondary" className="gap-1">
            {format(filters.dateRange.from, 'd MMM', { locale: ru })} - {format(filters.dateRange.to, 'd MMM', { locale: ru })}
          </Badge>

          {/* Search Badge */}
          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              Поиск: "{searchValue}"
              <button
                onClick={() => setSearchValue("")}
                className="ml-1 hover:bg-background/50 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {/* Filter Chips */}
          {activeChips.slice(0, 5).map((chip, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-1 hover:bg-background/50 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {activeChips.length > 5 && (
            <Badge variant="outline">
              +{activeChips.length - 5} ещё
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Очистить всё
          </Button>
        </div>
      )}
    </div>
  );
}