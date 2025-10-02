import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingDown, Users, Clock, Target, Brain } from "lucide-react";

interface PredictiveAlert {
  id: string;
  type: "churn_risk" | "sentiment_decline" | "volume_surge" | "seasonal_pattern";
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  impact: {
    customers: number;
    revenue: string;
  };
  preventionActions: Array<{
    action: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high"; 
    timeline: string;
  }>;
  confidence: number;
  trend: "increasing" | "stable" | "decreasing";
  lastUpdated: string;
}

const mockPredictiveAlerts: PredictiveAlert[] = [
  {
    id: "pred-1",
    type: "churn_risk",
    title: "Прогноз оттока клиентов сегмента 'Проблемные'",
    description: "ML-модель прогнозирует увеличение оттока на 23% среди клиентов с повторными жалобами на мобильное приложение в следующие 30 дней.",
    probability: 78,
    timeframe: "следующие 30 дней",
    impact: {
      customers: 267,
      revenue: "₽4.2М"
    },
    preventionActions: [
      {
        action: "Персональные извинения и компенсации",
        effort: "medium",
        impact: "high",
        timeline: "1-2 дня"
      },
      {
        action: "Приоритетная техподдержка для группы риска",
        effort: "low", 
        impact: "medium",
        timeline: "немедленно"
      },
      {
        action: "Упрощение процесса смены тарифа",
        effort: "high",
        impact: "high", 
        timeline: "2-3 недели"
      }
    ],
    confidence: 84,
    trend: "increasing",
    lastUpdated: "2 часа назад"
  },
  {
    id: "pred-2",
    type: "sentiment_decline", 
    title: "Ожидается падение sentiment по депозитам",
    description: "Обнаружена корреляция между снижением ставок ЦБ и негативным sentiment. Прогноз: -12 пунктов в следующие 2 недели.",
    probability: 67,
    timeframe: "следующие 2 недели",
    impact: {
      customers: 1840,
      revenue: "₽890К"
    },
    preventionActions: [
      {
        action: "Проактивная коммуникация о преимуществах",
        effort: "low",
        impact: "medium",
        timeline: "3-5 дней"
      },
      {
        action: "Запуск дополнительных бонусов",
        effort: "medium",
        impact: "high",
        timeline: "1 неделя"
      },
      {
        action: "Альтернативные инвестиционные продукты",
        effort: "high",
        impact: "high",
        timeline: "2-4 недели"
      }
    ],
    confidence: 71,
    trend: "stable",
    lastUpdated: "5 часов назад"
  },
  {
    id: "pred-3",
    type: "volume_surge",
    title: "Прогноз всплеска жалоб перед Новым годом",
    description: "Исторические паттерны указывают на 40% рост объема жалоб в период 25-31 декабря, особенно по международным переводам.",
    probability: 89,
    timeframe: "25-31 декабря",
    impact: {
      customers: 3200,
      revenue: "₽0"
    },
    preventionActions: [
      {
        action: "Увеличение штата поддержки",
        effort: "medium",
        impact: "high",
        timeline: "до 20 декабря"
      },
      {
        action: "Превентивные уведомления о сроках",
        effort: "low",
        impact: "medium",
        timeline: "с 15 декабря"
      },
      {
        action: "Временное упрощение лимитов",
        effort: "high",
        impact: "high",
        timeline: "согласование до 1 декабря"
      }
    ],
    confidence: 92,
    trend: "stable",
    lastUpdated: "12 часов назад"
  }
];

export function PredictiveAlerts() {
  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-red-600';
    if (prob >= 50) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-purple-100 text-purple-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Predictive Alerts
          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
            Machine Learning
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* High Priority Alert */}
          <Alert className="border-red-200 bg-red-50">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <span className="font-semibold">Высокий риск оттока!</span> 267 клиентов в зоне риска с вероятностью 78%. Рекомендуется немедленное вмешательство.
            </AlertDescription>
          </Alert>

          {/* Predictive Alerts List */}
          <div className="space-y-4">
            {mockPredictiveAlerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${
                alert.probability >= 70 ? 'border-red-200 bg-red-50/30' :
                alert.probability >= 50 ? 'border-orange-200 bg-orange-50/30' :
                'border-yellow-200 bg-yellow-50/30'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{alert.title}</h4>
                      <Badge variant="outline" className={getProbabilityColor(alert.probability)}>
                        {alert.probability}% вероятность
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timeframe}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Клиенты</span>
                        </div>
                        <p className="font-bold text-foreground">{alert.impact.customers.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">Потери</span>
                        </div>
                        <p className="font-bold text-foreground">{alert.impact.revenue}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Model Confidence</span>
                        <span className="text-sm text-muted-foreground">{alert.confidence}%</span>
                      </div>
                      <Progress value={alert.confidence} className="h-2" />
                    </div>
                  </div>

                  <Button 
                    variant={alert.probability >= 70 ? 'default' : 'outline'} 
                    size="sm"
                    className="ml-4"
                  >
                    Создать план
                  </Button>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Превентивные действия:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {alert.preventionActions.map((action, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-background/50">
                        <p className="text-sm font-medium mb-2">{action.action}</p>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${getEffortColor(action.effort)}`}>
                            {action.effort} effort
                          </Badge>
                          <Badge className={`text-xs ${getImpactColor(action.impact)}`}>
                            {action.impact} impact
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{action.timeline}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Последнее обновление: {alert.lastUpdated}</span>
                  <span className="flex items-center gap-1">
                    Тренд: <Badge variant="outline" className="text-xs">{alert.trend}</Badge>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Model Performance */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Predictive Model Performance</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Gradient Boosting + Time Series Analysis (Facebook Prophet)</p>
              <p>• Обучение на 2 года исторических данных (480К+ взаимодействий)</p>
              <p>• Accuracy за последние 90 дней: 76.3% (churn), 82.1% (sentiment)</p>
              <p>• Переобучение: каждую неделю с новыми данными</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}