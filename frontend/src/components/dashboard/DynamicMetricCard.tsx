import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface DynamicMetricCardProps {
  title: string;
  value: number;
  percentage?: number;
  trend: {
    direction: 'up' | 'down';
    change: number;
    changePercent: number;
  };
  trendData: number[];
  variant?: 'primary' | 'positive' | 'neutral' | 'negative';
  isLoading?: boolean;
  className?: string;
}

/**
 * Dynamic Metric Card with integrated trends and mini-chart
 * Automatically updates when filters change
 * Displays both absolute values and percentages
 */
export function DynamicMetricCard({
  title,
  value,
  percentage,
  trend,
  trendData,
  variant = 'primary',
  isLoading = false,
  className
}: DynamicMetricCardProps) {
  
  // Variant styling
  const variantStyles = {
    primary: {
      card: 'bg-gradient-primary text-white border-0',
      text: 'text-white opacity-90',
      chart: 'rgba(255, 255, 255, 0.9)',
      trend: 'text-white opacity-90'
    },
    positive: {
      card: 'bg-green-500/10 border-green-500/20',
      text: 'text-green-700 dark:text-green-400',
      chart: 'rgb(34, 197, 94)',
      trend: 'text-green-700 dark:text-green-400'
    },
    neutral: {
      card: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-700 dark:text-blue-400',
      chart: 'rgb(59, 130, 246)',
      trend: 'text-blue-700 dark:text-blue-400'
    },
    negative: {
      card: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-700 dark:text-red-400',
      chart: 'rgb(239, 68, 68)',
      trend: 'text-red-700 dark:text-red-400'
    }
  };

  const styles = variantStyles[variant];

  if (isLoading) {
    return <Skeleton className="h-[140px] w-full min-w-[240px]" />;
  }

  return (
    <Card className={cn(
      'overflow-hidden min-w-[240px] transition-all hover:shadow-lg',
      styles.card,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('text-lg font-medium mb-2', styles.text)}>
              {title}
            </h3>
            <div className="flex items-baseline gap-3">
              <span className={cn('text-4xl font-mono font-bold', styles.text)}>
                {value.toLocaleString('ru-RU')}
              </span>
              {percentage !== undefined && (
                <span className={cn('text-xl font-medium', styles.text)}>
                  {percentage}%
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Mini trend chart */}
            <div className="h-16 w-24 overflow-hidden rounded-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData.map(value => ({ value }))}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={styles.chart}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Trend indicator */}
            <div className={cn(
              'flex items-center gap-1 text-lg leading-none font-semibold font-mono',
              styles.trend
            )}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {trend.direction === 'up' ? '+' : ''}
                {trend.change}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
