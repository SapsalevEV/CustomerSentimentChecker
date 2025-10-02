import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFilters, useCrossFilter } from "@/contexts/AppDataProvider";
import { X, Plus } from "lucide-react";

import { getMockSentimentData } from "@/lib/mock-data";
import { getSentimentBadgeClass, getSentimentTextClass, validateSentimentData } from "@/lib/sentiment-utils";

const chartConfig = {
  positive: { label: "Позитивные", color: "hsl(var(--chart-positive))" },
  neutral: { label: "Нейтральные", color: "hsl(var(--chart-neutral))" },
  negative: { label: "Негативные", color: "hsl(var(--chart-negative))" },
};

export function ProductComparison() {
  const { availableProducts } = useFilters();
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['credit-cards', 'debit-cards']);

  const addProduct = (productValue: string) => {
    if (!selectedProducts.includes(productValue) && selectedProducts.length < 4) {
      setSelectedProducts([...selectedProducts, productValue]);
    }
  };

  const removeProduct = (productValue: string) => {
    if (selectedProducts.length > 1) {
      setSelectedProducts(selectedProducts.filter(p => p !== productValue));
    }
  };

  const availableToAdd = availableProducts.filter(p => !selectedProducts.includes(p.value));

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выберите продукты для сравнения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Selected Products */}
            {selectedProducts.map(productValue => {
              const product = availableProducts.find(p => p.value === productValue);
              return (
                <Badge key={productValue} variant="secondary" className="flex items-center gap-2 py-2 px-3">
                  {product?.label}
                  {selectedProducts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeProduct(productValue)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              );
            })}

            {/* Add Product */}
            {availableToAdd.length > 0 && selectedProducts.length < 4 && (
              <Select onValueChange={addProduct}>
                <SelectTrigger className="w-48">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <SelectValue placeholder="Добавить продукт" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map(product => (
                    <SelectItem key={product.value} value={product.value}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Максимум 4 продукта. Минимум 2 для сравнения.
          </p>
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      <div className={`grid gap-6 ${
        selectedProducts.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        selectedProducts.length === 3 ? 'grid-cols-1 xl:grid-cols-3' :
        selectedProducts.length === 4 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4' :
        'grid-cols-1'
      }`}>
        {selectedProducts.map(productValue => {
          const product = availableProducts.find(p => p.value === productValue);
          const sentimentData = getMockSentimentData(productValue);
          
          console.log('Product:', productValue, 'Data:', sentimentData);
          
          // Transform data for stacked bar chart with validation
          const chartData = sentimentData.map(aspect => {
            const validatedAspect = validateSentimentData(aspect);
            return {
              aspect: aspect.name.length > 15 ? aspect.name.substring(0, 15) + '...' : aspect.name,
              fullName: aspect.name,
              positive: validatedAspect.positive,
              neutral: validatedAspect.neutral,
              negative: validatedAspect.negative,
            };
          });

          console.log('Chart data for', productValue, ':', chartData);

          return (
            <Card key={productValue}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {product?.label}
                  <Badge variant="outline">{product?.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="horizontal"
                      margin={{ top: 20, right: 10, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        domain={[0, 100]}
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis 
                        type="category" 
                        dataKey="aspect"
                        width={55}
                        className="text-xs fill-muted-foreground"
                        tick={{ fontSize: 10 }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value, name, props) => [
                          `${value}%`,
                          chartConfig[name as keyof typeof chartConfig]?.label || name
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = chartData.find(d => d.aspect === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar dataKey="negative" stackId="sentiment" fill={chartConfig.negative.color} />
                      <Bar dataKey="neutral" stackId="sentiment" fill={chartConfig.neutral.color} />
                      <Bar dataKey="positive" stackId="sentiment" fill={chartConfig.positive.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}