import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilters } from "@/contexts/AppDataProvider";
import { Search, X, Filter } from "lucide-react";

// Available aspects for filtering
const availableAspects = [
  'Процентная ставка',
  'Кешбэк/бонусы',
  'Мобильное приложение',
  'Служба поддержки',
  'Условия обслуживания',
  'Скорость обслуживания',
  'Удобство использования',
  'Документооборот'
];

const sentimentOptions = [
  { value: 'positive', label: 'Позитивные', color: 'bg-green-100 text-green-800' },
  { value: 'neutral', label: 'Нейтральные', color: 'bg-gray-100 text-gray-800' },
  { value: 'negative', label: 'Негативные', color: 'bg-red-100 text-red-800' }
];

export function ReviewsFilter() {
  const { availableSources, availableProducts } = useFilters();
  const [searchText, setSearchText] = useState("");
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAspect = (aspect: string) => {
    setSelectedAspects(prev => 
      prev.includes(aspect) 
        ? prev.filter(a => a !== aspect)
        : [...prev, aspect]
    );
  };

  const toggleSentiment = (sentiment: string) => {
    setSelectedSentiments(prev => 
      prev.includes(sentiment) 
        ? prev.filter(s => s !== sentiment)
        : [...prev, sentiment]
    );
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const clearAllFilters = () => {
    setSearchText("");
    setSelectedAspects([]);
    setSelectedSentiments([]);
    setSelectedProducts([]);
    setSelectedSources([]);
  };

  const activeFiltersCount = selectedAspects.length + selectedSentiments.length + selectedProducts.length + selectedSources.length + (searchText ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Расширенная фильтрация
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Очистить все
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Свернуть' : 'Развернуть'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Text */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по тексту отзыва..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchText("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick Sentiment Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-sm font-medium">Сентимент:</Label>
          {sentimentOptions.map(option => (
            <Badge
              key={option.value}
              variant={selectedSentiments.includes(option.value) ? "default" : "outline"}
              className={`cursor-pointer ${selectedSentiments.includes(option.value) ? option.color : ''}`}
              onClick={() => toggleSentiment(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
            {/* Aspects Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Аспекты:</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableAspects.map(aspect => (
                  <div key={aspect} className="flex items-center space-x-2">
                    <Checkbox
                      id={aspect}
                      checked={selectedAspects.includes(aspect)}
                      onCheckedChange={() => toggleAspect(aspect)}
                    />
                    <Label htmlFor={aspect} className="text-sm cursor-pointer">
                      {aspect}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Продукты:</Label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {availableProducts.map(product => (
                  <div key={product.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={product.value}
                      checked={selectedProducts.includes(product.value)}
                      onCheckedChange={() => toggleProduct(product.value)}
                    />
                    <Label htmlFor={product.value} className="text-sm cursor-pointer">
                      {product.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources Filter */}
            <div className="space-y-3 lg:col-span-2">
              <Label className="text-sm font-medium">Источники:</Label>
              <div className="flex flex-wrap gap-2">
                {availableSources.map(source => (
                  <Badge
                    key={source.value}
                    variant={selectedSources.includes(source.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSource(source.value)}
                  >
                    {source.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {searchText && (
                <Badge variant="secondary" className="gap-1">
                  Текст: "{searchText}"
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchText("")}
                  />
                </Badge>
              )}
              {selectedSentiments.map(sentiment => {
                const option = sentimentOptions.find(o => o.value === sentiment);
                return (
                  <Badge key={sentiment} variant="secondary" className="gap-1">
                    {option?.label}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => toggleSentiment(sentiment)}
                    />
                  </Badge>
                );
              })}
              {selectedAspects.map(aspect => (
                <Badge key={aspect} variant="secondary" className="gap-1">
                  {aspect}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleAspect(aspect)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}