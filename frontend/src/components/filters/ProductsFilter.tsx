import { Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/contexts/AppDataProvider";
import { useState } from "react";

export function ProductsFilter() {
  const { filters, setProducts, availableProducts } = useFilters();
  const [open, setOpen] = useState(false);

  const toggleProduct = (productValue: string) => {
    const newProducts = filters.products.includes(productValue)
      ? filters.products.filter(p => p !== productValue)
      : [...filters.products, productValue];
    setProducts(newProducts);
  };

  const clearProducts = () => {
    setProducts([]);
  };

  const selectAllInCategory = (category: string) => {
    const categoryProducts = availableProducts
      .filter(p => p.category === category)
      .map(p => p.value);
    
    const hasAllSelected = categoryProducts.every(p => filters.products.includes(p));
    
    if (hasAllSelected) {
      // Remove all from category
      setProducts(filters.products.filter(p => !categoryProducts.includes(p)));
    } else {
      // Add all missing from category
      const newProducts = [...new Set([...filters.products, ...categoryProducts])];
      setProducts(newProducts);
    }
  };

  const getSelectedProductsText = () => {
    if (filters.products.length === 0) return "Все продукты";
    if (filters.products.length === 1) {
      const product = availableProducts.find(p => p.value === filters.products[0]);
      return product?.label || "1 продукт";
    }
    return `${filters.products.length} продуктов`;
  };

  const categories = [...new Set(availableProducts.map(p => p.category))];

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between bg-background border-input hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{getSelectedProductsText()}</span>
            </div>
            {filters.products.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filters.products.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск продуктов..." />
            <CommandList>
              <CommandEmpty>Продукты не найдены</CommandEmpty>
              
              {categories.map((category, index) => {
                const categoryProducts = availableProducts.filter(p => p.category === category);
                const selectedInCategory = categoryProducts.filter(p => filters.products.includes(p.value));
                const hasAllSelected = selectedInCategory.length === categoryProducts.length;
                const hasPartialSelected = selectedInCategory.length > 0 && selectedInCategory.length < categoryProducts.length;
                
                return (
                  <div key={category}>
                    <CommandGroup heading={
                      <div className="flex items-center justify-between w-full">
                        <span>{category}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => selectAllInCategory(category)}
                        >
                          {hasAllSelected ? "Убрать все" : "Выбрать все"}
                        </Button>
                      </div>
                    }>
                      {categoryProducts.map((product) => (
                        <CommandItem
                          key={product.value}
                          value={product.value}
                          onSelect={() => toggleProduct(product.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.products.includes(product.value) 
                                ? "opacity-100" 
                                : "opacity-0"
                            )}
                          />
                          {product.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {index < categories.length - 1 && <CommandSeparator />}
                  </div>
                );
              })}
              
              {filters.products.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearProducts}
                    className="w-full"
                  >
                    Очистить выбор
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}