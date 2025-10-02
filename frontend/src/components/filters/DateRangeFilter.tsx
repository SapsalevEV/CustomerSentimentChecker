import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilters, type DateRange } from "@/contexts/AppDataProvider";

export function DateRangeFilter() {
  const { filters, setDateRange } = useFilters();
  const [tempRange, setTempRange] = useState<DateRange | undefined>();

  const handleRangeSelect = (range: any) => {
    if (range?.from && range?.to) {
      setTempRange({ from: range.from, to: range.to });
    } else if (range?.from) {
      setTempRange({ from: range.from, to: range.from });
    }
  };

  const applyRange = () => {
    if (tempRange?.from && tempRange?.to) {
      setDateRange(tempRange);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {filters.dateRange.from && filters.dateRange.to ? (
            `${format(filters.dateRange.from, "dd.MM.yy")} - ${format(filters.dateRange.to, "dd.MM.yy")}`
          ) : (
            <span className="text-muted-foreground">Выберите диапазон дат</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={filters.dateRange.from}
          selected={tempRange || filters.dateRange}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
        <div className="p-3 border-t">
          <Button 
            onClick={applyRange}
            className="w-full"
            disabled={!tempRange?.from || !tempRange?.to}
          >
            Применить период
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}