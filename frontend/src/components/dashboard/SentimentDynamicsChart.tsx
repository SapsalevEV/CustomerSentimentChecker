import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSentimentDynamics } from "@/contexts/AppDataProvider";
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  data?: any[];
}

function CustomTooltip({ active, payload, label, data }: CustomTooltipProps) {
  if (active && payload && payload.length && label) {
    const dataPoint = data?.find(d => d.date === label);
    
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg min-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <p className="font-medium text-foreground">
            {format(new Date(label), 'd MMM', { locale: ru })}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          {payload.map((entry, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-xs text-muted-foreground capitalize">{entry.name}</p>
              <p className="font-semibold text-sm">{entry.value}%</p>
            </div>
          ))}
        </div>
        
        {dataPoint?.topics && dataPoint.topics.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Главные темы дня:
            </p>
            <div className="space-y-1">
              {dataPoint.topics.slice(0, 3).map((topic: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}

interface SentimentDynamicsChartProps {
  height?: number;
  onDrillDown?: (date: string) => void;
}

/**
 * Interactive Sentiment Dynamics Chart
 * Automatically updates when filters change
 * Provides drill-down functionality for detailed analysis
 */
export function SentimentDynamicsChart({
  height = 300,
  onDrillDown
}: SentimentDynamicsChartProps) {
  const { 
    sentimentDynamics, 
    aggregatedData, 
    trends, 
    handlers,
    isLoading 
  } = useSentimentDynamics();
  
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const handlePointClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.date) {
      const date = data.activePayload[0].payload.date;
      setSelectedPoint(date);
      handlers.handleDrillDown(date);
      onDrillDown?.(date);
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-sentiment-positive';
      case 'down':
        return 'text-sentiment-negative';
      default:
        return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (sentimentDynamics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Нет данных для отображения. Попробуйте изменить фильтры.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(
    ...sentimentDynamics.flatMap(d => [d.positive, d.neutral, d.negative])
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">
              Динамика sentiment по дням
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Интерактивный график • Клик для детального анализа
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${getTrendColor(trends.positive.direction)}`}>
                {getTrendIcon(trends.positive.direction)}
                <span className="font-medium">
                  {trends.positive.change > 0 ? '+' : ''}
                  {trends.positive.change}%
                </span>
              </div>
            </div>
            {selectedPoint && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlers.handleDrillDown(selectedPoint)}
                className="text-xs"
              >
                Анализ {format(new Date(selectedPoint), 'd MMM', { locale: ru })}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Aggregated stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div 
            className="cursor-pointer transition-all hover:bg-green-500/5 rounded-lg p-2"
            onClick={() => handlers.handleSentimentClick('positive')}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-sentiment-positive" />
              <span className="text-xs text-muted-foreground">Позитивный</span>
            </div>
            <p className="text-lg font-semibold text-sentiment-positive">
              {'averages' in aggregatedData ? `${aggregatedData.averages.positive}%` : '-'}
            </p>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.positive.direction)}`}>
              {getTrendIcon(trends.positive.direction)}
              <span>{trends.positive.changePercent}%</span>
            </div>
          </div>
          
          <div 
            className="cursor-pointer transition-all hover:bg-blue-500/5 rounded-lg p-2"
            onClick={() => handlers.handleSentimentClick('neutral')}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">Нейтральный</span>
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              {'averages' in aggregatedData ? `${aggregatedData.averages.neutral}%` : '-'}
            </p>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.neutral.direction)}`}>
              {getTrendIcon(trends.neutral.direction)}
              <span>{trends.neutral.changePercent}%</span>
            </div>
          </div>
          
          <div 
            className="cursor-pointer transition-all hover:bg-red-500/5 rounded-lg p-2"
            onClick={() => handlers.handleSentimentClick('negative')}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-sentiment-negative" />
              <span className="text-xs text-muted-foreground">Негативный</span>
            </div>
            <p className="text-lg font-semibold text-sentiment-negative">
              {'averages' in aggregatedData ? `${aggregatedData.averages.negative}%` : '-'}
            </p>
            <div className={`flex items-center justify-center gap-1 text-xs ${getTrendColor(trends.negative.direction)}`}>
              {getTrendIcon(trends.negative.direction)}
              <span>{trends.negative.changePercent}%</span>
            </div>
          </div>
        </div>
        
        {/* Interactive chart */}
        <div className="w-full h-[320px] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={sentimentDynamics}
              onClick={handlePointClick}
              style={{ cursor: 'pointer' }}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                fontSize={12}
                className="text-muted-foreground"
                tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: ru })}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                fontSize={12}
                className="text-muted-foreground"
                domain={[0, maxValue * 1.1]}
              />
              <Tooltip content={<CustomTooltip data={sentimentDynamics} />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="positive" 
                stroke="hsl(var(--sentiment-positive))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--sentiment-positive))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--sentiment-positive))" }}
                name="Позитивный"
                animationDuration={300}
              />
              <Line 
                type="monotone" 
                dataKey="neutral" 
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: "hsl(var(--muted-foreground))" }}
                name="Нейтральный"
                animationDuration={300}
              />
              <Line 
                type="monotone" 
                dataKey="negative" 
                stroke="hsl(var(--sentiment-negative))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--sentiment-negative))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--sentiment-negative))" }}
                name="Негативный"
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
