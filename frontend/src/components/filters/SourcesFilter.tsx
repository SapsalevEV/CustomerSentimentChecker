import { Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/contexts/AppDataProvider";
import { useState } from "react";

export function SourcesFilter() {
  const { filters, setSources, availableSources } = useFilters();
  const [open, setOpen] = useState(false);

  const toggleSource = (sourceValue: string) => {
    const newSources = filters.sources.includes(sourceValue)
      ? filters.sources.filter(s => s !== sourceValue)
      : [...filters.sources, sourceValue];
    setSources(newSources);
  };

  const clearSources = () => {
    setSources([]);
  };

  const getSelectedSourcesText = () => {
    if (filters.sources.length === 0) return "Все источники";
    if (filters.sources.length === 1) {
      const source = availableSources.find(s => s.value === filters.sources[0]);
      return source?.label || "1 источник";
    }
    return `${filters.sources.length} источников`;
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between bg-background border-input hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{getSelectedSourcesText()}</span>
            </div>
            {filters.sources.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filters.sources.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск источников..." />
            <CommandList>
              <CommandEmpty>Источники не найдены</CommandEmpty>
              <CommandGroup>
                {availableSources.map((source) => (
                  <CommandItem
                    key={source.value}
                    value={source.value}
                    onSelect={() => toggleSource(source.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.sources.includes(source.value) 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    {source.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              {filters.sources.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSources}
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