import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { AlertTriangle, TrendingDown, TrendingUp, Zap, Bell, Activity } from "lucide-react";

interface Anomaly {
  id: string;
  type: "sentiment_drop" | "volume_spike" | "new_issue" | "pattern_change";
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  detected: string;
  confidence: number;
  impact: string;
  affectedProducts: string[];
  suggestedActions: string[];
  chartData?: Array<{ date: string; value: number; anomaly?: boolean }>;
}

const mockAnomalies: Anomaly[] = [
  {
    id: "anom-1",
    type: "sentiment_drop",
    title: "Резкое падение sentiment по мобильному банкингу",
    description: "Обнаружено снижение sentiment на 18 пунктов за последние 3 дня. Статистически значимое отклонение от нормы.",
    severity: "critical", 
    detected: "15 минут назад",
    confidence: 94,
    impact: "~2,400 недовольных клиентов, прогноз оттока 8%",
    affectedProducts: ["Мобильное приложение", "Платежи"],
    suggestedActions: [
      "Проверить серверную инфраструктуру",
      "Анализ последних релизов",
      "Экстренное обращение к клиентам"
    ],
    chartData: [
      { date: "День-7", value: 72 },
      { date: "День-6", value: 71 },
      { date: "День-5", value: 73 },
      { date: "День-4", value: 74 },
      { date: "День-3", value: 69 },
      { date: "День-2", value: 58, anomaly: true },
      { date: "День-1", value: 54, anomaly: true },
      { date: "Сегодня", value: 56, anomaly: true }
    ]
  },
  {
    id: "anom-2",
    type: "volume_spike", 
    title: "Аномальный рост упоминаний 'QR-код'",
    description: "За последние 6 часов упоминания QR-кодов выросли в 340% по сравнению с обычным уровнем.",
    severity: "high",
    detected: "1 час назад", 
    confidence: 87,
    impact: "156 новых жалоб, тенденция к росту",
    affectedProducts: ["Мобильные платежи", "POS-терминалы"],
    suggestedActions: [
      "Проверить QR-сканер в приложении",
      "Связаться с партнерами по эквайрингу", 
      "Мониторить социальные сети"
    ]
  },
  {
    id: "anom-3",
    type: "new_issue",
    title: "Emerging issue: 'биометрия не работает'",
    description: "ML-модель обнаружила новый кластер жалоб на биометрическую аутентификацию. Ранее не наблюдалось.",
    severity: "medium",
    detected: "4 часа назад",
    confidence: 73,
    impact: "67 упоминаний, потенциально связано с iOS 17.1",
    affectedProducts: ["Мобильное приложение", "Биометрия"],
    suggestedActions: [
      "Тестирование на новых версиях iOS",
      "Обновление SDK биометрии",
      "FAQ для клиентов"
    ]
  },
  {
    id: "anom-4",
    type: "pattern_change",
    title: "Изменение паттерна жалоб по выходным",
    description: "Обычно в выходные количество жалоб снижается на 40%, но последние 2 недели снижение только на 15%.",
    severity: "low",
    detected: "2 дня назад",
    confidence: 82,
    impact: "Возможно изменение поведения клиентов или новые проблемы",
    affectedProducts: ["Все каналы"],
    suggestedActions: [
      "Анализ изменений в продуктах",
      "Исследование клиентского поведения",
      "Мониторинг трендов"
    ]
  }
];

export function AnomalyDetection() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'sentiment_drop': return <TrendingDown className="w-4 h-4" />;
      case 'volume_spike': return <TrendingUp className="w-4 h-4" />;
      case 'new_issue': return <Zap className="w-4 h-4" />;
      case 'pattern_change': return <Activity className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Anomaly Detection Engine
          <Badge variant="outline" className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700">
            Real-time AI
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <span className="font-semibold">Критическая аномалия обнаружена!</span> Требуется немедленное внимание к падению sentiment мобильного банкинга.
            </AlertDescription>
          </Alert>

          {/* Anomaly List */}
          <div className="space-y-4">
            {mockAnomalies.map((anomaly) => (
              <div key={anomaly.id} className={`border rounded-lg p-4 ${
                anomaly.severity === 'critical' ? 'border-red-300 bg-red-50/50' :
                anomaly.severity === 'high' ? 'border-orange-300 bg-orange-50/50' :
                'border-border bg-background'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      anomaly.severity === 'critical' ? 'bg-red-100 text-red-600' :
                      anomaly.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {getSeverityIcon(anomaly.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{anomaly.title}</h4>
                        <Badge variant={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{anomaly.detected}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{anomaly.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Confidence: </span>
                          <span className="font-medium">{anomaly.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact: </span>
                          <span className="font-medium">{anomaly.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant={anomaly.severity === 'critical' ? 'default' : 'outline'} 
                    size="sm"
                  >
                    Исследовать
                  </Button>
                </div>

                {/* Chart for sentiment drops */}
                {anomaly.chartData && (
                  <div className="mb-3">
                    <div className="h-32">
                      <TrendChart
                        title=""
                        data={anomaly.chartData}
                        color={anomaly.severity === 'critical' ? '#dc2626' : 'hsl(var(--primary))'}
                        height={120}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Затронутые продукты:</span>
                    <div className="flex flex-wrap gap-1">
                      {anomaly.affectedProducts.map((product) => (
                        <Badge key={product} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Рекомендуемые действия:</span>
                    <div className="space-y-1">
                      {anomaly.suggestedActions.slice(0, 2).map((action, index) => (
                        <div key={index} className="text-xs flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Algorithm Info */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Detection Algorithm</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Statistical Process Control (SPC) + Isolation Forest</p>
              <p>• Window: скользящее окно 7 дней, проверка каждые 15 минут</p>
              <p>• Threshold: 2.5 стандартных отклонения для критических аномалий</p>
              <p>• False Positive Rate: &lt;3% на исторических данных</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}