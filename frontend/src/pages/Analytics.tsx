import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { SmartClustering } from "@/components/intelligence/SmartClustering";
import { AnomalyDetection } from "@/components/intelligence/AnomalyDetection";
import { EmergingIssues } from "@/components/intelligence/EmergingIssues";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Filter, Calendar, ArrowRight, Brain } from "lucide-react";
import { MockDataWarning } from "@/components/common/MockDataWarning";

const heatmapData = {
  products: ["Мобильный банкинг", "Карты", "Кредиты", "Депозиты", "Страхование"],
  aspects: ["Удобство", "Скорость", "Надежность", "Поддержка", "Цена/Условия", "Безопасность"],
  data: [
    // Мобильный банкинг
    [68, 45, 82, 71, 76, 89],
    // Карты  
    [82, 78, 88, 74, 68, 85],
    // Кредиты
    [45, 32, 67, 58, 41, 72],
    // Депозиты
    [89, 85, 92, 81, 84, 88],
    // Страхование
    [71, 68, 76, 65, 59, 73]
  ]
};

const timeSeriesData = [
  { date: "2024-01", sentiment: 65, events: ["Запуск нового приложения"] },
  { date: "2024-02", sentiment: 68, events: [] },
  { date: "2024-03", sentiment: 72, events: ["Улучшение поддержки"] },
  { date: "2024-04", sentiment: 70, events: [] },
  { date: "2024-05", sentiment: 75, events: ["Акция по картам", "Снижение ставок"] },
  { date: "2024-06", sentiment: 73, events: [] },
  { date: "2024-07", sentiment: 78, events: ["Новый депозитный продукт"] },
  { date: "2024-08", sentiment: 76, events: [] },
  { date: "2024-09", sentiment: 72, events: ["Технические проблемы"] }
];

const customerClusters = [
  {
    name: "Цифровые оптимисты",
    size: 2847,
    percentage: 34,
    sentiment: 82,
    characteristics: ["Молодые пользователи", "Активно используют мобильный банк", "Высокий уровень дохода"],
    mainIssues: ["Скорость загрузки", "Новые функции"],
    color: "bg-green-500"
  },
  {
    name: "Традиционалисты",
    size: 1923,
    percentage: 23,
    sentiment: 65,
    characteristics: ["Старше 45 лет", "Предпочитают офисы", "Консервативны в финансах"],
    mainIssues: ["Сложность интерфейса", "Время обслуживания"],
    color: "bg-blue-500"
  },
  {
    name: "Прагматичные скептики", 
    size: 1635,
    percentage: 20,
    sentiment: 48,
    characteristics: ["Средний возраст", "Ориентированы на выгоду", "Критичны к условиям"],
    mainIssues: ["Комиссии", "Условия кредитования", "Скрытые платежи"],
    color: "bg-orange-500"
  },
  {
    name: "Проблемные клиенты",
    size: 892,
    percentage: 11,
    sentiment: 28,
    characteristics: ["Множественные негативные опыты", "Активно оставляют отзывы", "Рассматривают смену банка"],
    mainIssues: ["Качество поддержки", "Решение инцидентов", "Компенсации"],
    color: "bg-red-500"
  },
  {
    name: "Новички",
    size: 1034,
    percentage: 12,
    sentiment: 71,
    characteristics: ["Недавние клиенты", "Изучают продукты", "Открыты к изменениям"],
    mainIssues: ["Понятность продуктов", "Обучение", "Первое впечатление"],
    color: "bg-purple-500"
  }
];

const correlationData = [
  { aspectA: "Скорость", aspectB: "Удовлетворенность", correlation: 0.78, significance: "high" },
  { aspectA: "Поддержка", aspectB: "Лояльность", correlation: 0.65, significance: "high" },
  
  { aspectA: "Безопасность", aspectB: "Доверие", correlation: 0.89, significance: "high" },
  { aspectA: "Удобство", aspectB: "Частота использования", correlation: 0.56, significance: "medium" }
];

export default function Analytics() {
  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'bg-sentiment-positive';
    if (score >= 50) return 'bg-gpb-orange'; 
    return 'bg-sentiment-negative';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mock Data Warning */}
        <MockDataWarning
          component="Analytics Dashboard"
          missingEndpoints={[
            'POST /api/analytics/heatmap',
            'POST /api/analytics/time-series',
            'POST /api/intelligence/smart-clusters',
            'POST /api/intelligence/emerging-issues',
            'POST /api/intelligence/anomalies',
            'POST /api/analytics/correlations'
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytical View</h1>
            <p className="text-muted-foreground mt-1">Интерактивная аналитика паттернов, корреляций и кластеризация клиентов</p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="quarter">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Последний месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </Button>
          </div>
        </div>

        <Tabs defaultValue="heatmap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="heatmap">Тепловая карта</TabsTrigger>
            <TabsTrigger value="timeline">Временные ряды</TabsTrigger>
            <TabsTrigger value="clusters">Кластеры клиентов</TabsTrigger>
            <TabsTrigger value="correlations">Корреляции</TabsTrigger>
            <TabsTrigger value="intelligence">
              <Brain className="w-4 h-4 mr-1" />
              AI Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="space-y-6">
            {/* Interactive Heatmap */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Продукты × Аспекты × Sentiment
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-sentiment-negative rounded"></div>
                      <span>0-49%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gpb-orange rounded"></div>
                      <span>50-69%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-sentiment-positive rounded"></div>
                      <span>70-100%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    {/* Aspect headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      <div></div>
                      {heatmapData.aspects.map((aspect) => (
                        <div key={aspect} className="text-xs font-medium text-center p-2 bg-muted/50 rounded">
                          {aspect}
                        </div>
                      ))}
                    </div>
                    
                    {/* Heatmap rows */}
                    {heatmapData.products.map((product, productIndex) => (
                      <div key={product} className="grid grid-cols-7 gap-2 mb-2">
                        <div className="text-xs font-medium p-2 bg-muted/50 rounded flex items-center">
                          {product}
                        </div>
                        {heatmapData.data[productIndex].map((score, aspectIndex) => (
                          <div
                            key={aspectIndex}
                            className={`h-12 rounded flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-105 transition-transform ${getSentimentColor(score)}`}
                            title={`${product} - ${heatmapData.aspects[aspectIndex]}: ${score}%`}
                          >
                            {score}%
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            {/* Time Series with Business Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Временные ряды с бизнес-событиями
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 relative">
                  <TrendChart
                    title=""
                    data={timeSeriesData.map(item => ({ date: item.date, value: item.sentiment }))}
                    color="hsl(var(--primary))"
                    height={300}
                  />
                  
                  {/* Event markers */}
                  <div className="absolute top-4 left-0 right-0 flex justify-between px-12">
                    {timeSeriesData.map((item, index) => (
                      item.events.length > 0 && (
                        <div key={index} className="relative">
                          <div className="w-2 h-2 bg-gpb-orange rounded-full"></div>
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48">
                            {item.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs mb-1 block">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anomaly Detection */}
            <Card>
              <CardHeader>
                <CardTitle>Детекция аномалий</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                    <div>
                      <h4 className="font-semibold text-red-900">Резкое падение sentiment</h4>
                      <p className="text-sm text-red-700">Сентябрь 2024: падение на 4 пункта за неделю</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Исследовать
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
                    <div>
                      <h4 className="font-semibold text-orange-900">Необычный пик активности</h4>
                      <p className="text-sm text-orange-700">Май 2024: +45% отзывов по картам</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Исследовать
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clusters" className="space-y-6">
            {/* Customer Clustering */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Кластеризация клиентов по паттернам недовольства
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {customerClusters.map((cluster, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 ${cluster.color} rounded-full`}></div>
                          <div>
                            <h3 className="text-lg font-semibold">{cluster.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{cluster.size.toLocaleString()} клиентов ({cluster.percentage}%)</span>
                              <span className={`font-medium ${
                                cluster.sentiment > 70 ? 'text-sentiment-positive' : 
                                cluster.sentiment > 50 ? 'text-gpb-orange' : 'text-sentiment-negative'
                              }`}>
                                Sentiment: {cluster.sentiment}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Детали
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Характеристики:</h4>
                          <div className="flex flex-wrap gap-2">
                            {cluster.characteristics.map((char) => (
                              <Badge key={char} variant="secondary" className="text-xs">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Основные проблемы:</h4>
                          <div className="flex flex-wrap gap-2">
                            {cluster.mainIssues.map((issue) => (
                              <Badge key={issue} variant="outline" className="text-xs border-red-200 text-red-700">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-6">
            {/* Correlation Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Корреляционный анализ аспектов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {correlationData.map((corr, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{corr.aspectA}</span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-medium">{corr.aspectB}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            Math.abs(corr.correlation) > 0.7 ? 'text-sentiment-positive' :
                            Math.abs(corr.correlation) > 0.4 ? 'text-gpb-orange' : 'text-muted-foreground'
                          }`}>
                            {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                          </div>
                          <Badge variant={
                            corr.significance === 'high' ? 'default' : 'secondary'
                          } className="text-xs">
                            {corr.significance === 'high' ? 'Сильная' : 'Умеренная'}
                          </Badge>
                        </div>
                        
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              Math.abs(corr.correlation) > 0.7 ? 'bg-sentiment-positive' :
                              Math.abs(corr.correlation) > 0.4 ? 'bg-gpb-orange' : 'bg-muted-foreground'
                            }`}
                            style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            {/* Smart Clustering */}
            <SmartClustering />
            
            {/* Anomaly Detection */}
            <AnomalyDetection />
            
            {/* Emerging Issues */}
            <EmergingIssues />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}