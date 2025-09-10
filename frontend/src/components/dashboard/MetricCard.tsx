import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  subtitle?: string;
  variant?: "default" | "positive" | "negative" | "warning";
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  subtitle, 
  variant = "default",
  className 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      case "neutral":
        return <Minus className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";
    
    switch (trend.direction) {
      case "up":
        return "text-sentiment-positive";
      case "down":
        return "text-sentiment-negative";
      case "neutral":
        return "text-sentiment-neutral";
      default:
        return "";
    }
  };

  const getCardVariant = () => {
    switch (variant) {
      case "positive":
        return "border-sentiment-positive/20 bg-sentiment-positive/5";
      case "negative":
        return "border-sentiment-negative/20 bg-sentiment-negative/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg", getCardVariant(), className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="metric-large text-foreground">
              {value}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {trend && (
            <div className="flex flex-col items-end">
              <Badge 
                variant="outline" 
                className={cn("gap-1", getTrendColor())}
              >
                {getTrendIcon()}
                <span className="font-medium">
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {trend.label}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}