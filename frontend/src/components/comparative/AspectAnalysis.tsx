import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFilters, useCrossFilter } from "@/contexts/AppDataProvider";
import { getMockAspectSentiment } from "@/lib/mock-data";
import { getSentimentConfig, getSentimentLevel } from "@/lib/sentiment-utils";

// Available aspects for analysis
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

const chartConfig = {
  sentiment: {
    label: "Сентимент",
    color: "hsl(var(--chart-1))",
  },
};

export function AspectAnalysis() {
  const { availableProducts } = useFilters();
  const [selectedAspect, setSelectedAspect] = useState<string>('Служба поддержки');

  const sentimentData = getMockAspectSentiment(selectedAspect);
  
  console.log('Aspect data for', selectedAspect, ':', sentimentData);
  
  // Transform data for chart with validation
  const chartData = availableProducts.map(product => {
    const sentiment = sentimentData[product.value];
    const validSentiment = isNaN(sentiment) ? 0 : sentiment;
    const config = getSentimentConfig(validSentiment);
    
    return {
      product: product.label.length > 12 ? product.label.substring(0, 12) + '...' : product.label,
      fullName: product.label,
      category: product.category,
      value: product.value,
      sentiment: validSentiment,
      color: config.color
    };
  }).sort((a, b) => b.sentiment - a.sentiment); // Sort by sentiment descending

  console.log('Chart data:', chartData);

  // Find champions and laggards
  const champions = chartData.filter(item => item.sentiment >= 70);
  const laggards = chartData.filter(item => item.sentiment < 30);

  return (
    <div className="space-y-6">
      {/* Aspect Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выберите аспект для анализа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedAspect} onValueChange={setSelectedAspect}>
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableAspects.map(aspect => (
                  <SelectItem key={aspect} value={aspect}>
                    {aspect}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              Анализ по аспекту "{selectedAspect}" для всех продуктов
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Рейтинг продуктов по аспекту "{selectedAspect}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    className="text-xs fill-muted-foreground"
                    label={{ value: 'Позитивный сентимент (%)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="product"
                    width={75}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background p-3 border rounded-lg shadow-lg">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground mb-1">{data.category}</p>
                            <p className="text-sm">
                              Сентимент: <span className="font-medium">{data.sentiment}%</span>
                            </p>
                            <p className="text-sm">
                              Оценка: <span className="font-medium">{getSentimentLevel(data.sentiment)}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sentiment" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Insights Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ключевые инсайты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Champions */}
            {champions.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  🏆 Чемпионы (≥70%)
                </h4>
                <div className="space-y-1">
                  {champions.slice(0, 3).map(product => (
                    <div key={product.value} className="flex items-center justify-between text-sm">
                      <span>{product.fullName}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {product.sentiment}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Laggards */}
            {laggards.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  ⚠️ Отстающие (&lt;30%)
                </h4>
                <div className="space-y-1">
                  {laggards.slice(0, 3).map(product => (
                    <div key={product.value} className="flex items-center justify-between text-sm">
                      <span>{product.fullName}</span>
                      <Badge variant="destructive">
                        {product.sentiment}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Лидер:</span>
                  <span className="font-medium">{chartData[0]?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Средний балл:</span>
                  <span className="font-medium">
                    {Math.round(chartData.reduce((sum, item) => sum + item.sentiment, 0) / chartData.length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Разброс:</span>
                  <span className="font-medium">
                    {chartData[0]?.sentiment - chartData[chartData.length - 1]?.sentiment}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}