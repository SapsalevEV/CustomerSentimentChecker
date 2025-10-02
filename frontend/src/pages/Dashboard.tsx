import { SentimentDynamicsChart } from "@/components/dashboard/SentimentDynamicsChart";
import { DynamicMetricCard } from "@/components/dashboard/DynamicMetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useMetrics, useSentimentDynamics } from "@/contexts/AppDataProvider";

export function Dashboard() {
  const { metrics, isLoading, error } = useMetrics();
  const { handlers } = useSentimentDynamics();

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка загрузки данных</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные дашборда. Пожалуйста, попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Voice Analytics</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Последнее обновление</p>
          <p className="font-medium">2 минуты назад</p>
        </div>
      </div>

      {/* Key Metrics - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
        <DynamicMetricCard
          title="Отзывов"
          value={metrics.totalReviews.value}
          trend={metrics.totalReviews.trend}
          trendData={metrics.totalReviews.trendData}
          variant="primary"
          isLoading={isLoading}
        />

        <DynamicMetricCard
          title="Положительных"
          value={metrics.positiveReviews.value}
          percentage={metrics.positiveReviews.percentage}
          trend={metrics.positiveReviews.trend}
          trendData={metrics.positiveReviews.trendData}
          variant="positive"
          isLoading={isLoading}
        />

        <DynamicMetricCard
          title="Нейтральных"
          value={metrics.neutralReviews.value}
          percentage={metrics.neutralReviews.percentage}
          trend={metrics.neutralReviews.trend}
          trendData={metrics.neutralReviews.trendData}
          variant="neutral"
          isLoading={isLoading}
        />

        <DynamicMetricCard
          title="Отрицательных"
          value={metrics.negativeReviews.value}
          percentage={metrics.negativeReviews.percentage}
          trend={metrics.negativeReviews.trend}
          trendData={metrics.negativeReviews.trendData}
          variant="negative"
          isLoading={isLoading}
        />
      </div>

      {/* Interactive Sentiment Dynamics Chart - Full Width */}
      {isLoading ? (
        <Skeleton className="h-[320px] w-full" />
      ) : (
        <SentimentDynamicsChart 
          height={320} 
          onDrillDown={(date) => {
            handlers.handleDrillDown(date);
          }} 
        />
      )}
    </div>
  );
}