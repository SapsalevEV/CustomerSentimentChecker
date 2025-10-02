import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, AlertTriangle, Users, ArrowRight } from "lucide-react";

interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  sentiment: number;
  volume: number;
  growth: number;
  confidence: number;
  examples: string[];
  impact: "high" | "medium" | "low";
  actionable: boolean;
}

const mockClusters: TopicCluster[] = [
  {
    id: "cluster-1",
    name: "Проблемы авторизации",
    keywords: ["логин", "пароль", "вход", "заблокирован", "SMS", "код"],
    sentiment: 32,
    volume: 847,
    growth: 45,
    confidence: 92,
    examples: [
      "Не приходит СМС с кодом для входа",
      "Приложение заблокировало аккаунт без причины", 
      "Постоянно просит ввести пароль заново"
    ],
    impact: "high",
    actionable: true
  },
  {
    id: "cluster-2", 
    name: "Медленные переводы",
    keywords: ["перевод", "скорость", "долго", "ожидание", "обработка"],
    sentiment: 41,
    volume: 623,
    growth: 23,
    confidence: 87,
    examples: [
      "Перевод между картами идет очень долго",
      "Деньги зависли в системе на 2 дня",
      "Международный перевод обрабатывается неделю"
    ],
    impact: "medium",
    actionable: true
  },
  {
    id: "cluster-3",
    name: "UI/UX мобильного приложения",
    keywords: ["интерфейс", "дизайн", "неудобно", "сложно", "запутанно"],
    sentiment: 54,
    volume: 456,
    growth: 12,
    confidence: 78,
    examples: [
      "Новый дизайн приложения очень запутанный",
      "Не могу найти кнопку для оплаты услуг",
      "Слишком много кликов для простых операций"
    ],
    impact: "medium", 
    actionable: true
  },
  {
    id: "cluster-4",
    name: "Положительные отзывы о кэшбэке",
    keywords: ["кэшбэк", "возврат", "бонусы", "выгодно", "отлично"],
    sentiment: 84,
    volume: 312,
    growth: -8,
    confidence: 91,
    examples: [
      "Кэшбэк по карте работает отлично",
      "Получил хороший возврат за покупки",
      "Бонусная программа очень выгодная"
    ],
    impact: "low",
    actionable: false
  },
  {
    id: "cluster-5",
    name: "Emerging: Проблемы с QR-платежами",
    keywords: ["QR", "сканер", "оплата", "код", "не работает"],
    sentiment: 28,
    volume: 89,
    growth: 156,
    confidence: 65,
    examples: [
      "QR-код не считывается в магазинах",
      "Оплата через QR постоянно падает",
      "Сканер в приложении не работает"
    ],
    impact: "high",
    actionable: true
  }
];

export function SmartClustering() {
  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-sentiment-positive';
    if (score >= 50) return 'text-orange-600'; 
    return 'text-sentiment-negative';
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Smart Clustering (ML-based)
          <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockClusters.map((cluster) => (
            <div key={cluster.id} className={`border rounded-lg p-4 ${
              cluster.name.includes('Emerging') ? 'border-orange-300 bg-orange-50/50' : 
              cluster.actionable ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">
                      {cluster.name}
                      {cluster.name.includes('Emerging') && (
                        <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                          🚨 Новая проблема
                        </Badge>
                      )}
                    </h4>
                    <Badge variant={getImpactBadgeColor(cluster.impact)}>
                      {cluster.impact} impact
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sentiment:</span>
                      <p className={`font-medium ${getSentimentColor(cluster.sentiment)}`}>
                        {cluster.sentiment}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Объем:</span>
                      <p className="font-medium">{cluster.volume} отзывов</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Рост:</span>
                      <p className={`font-medium ${cluster.growth > 0 ? 'text-sentiment-negative' : 'text-sentiment-positive'}`}>
                        {cluster.growth > 0 ? '+' : ''}{cluster.growth}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cluster.confidence} className="flex-1 h-2" />
                        <span className="text-xs font-medium">{cluster.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-muted-foreground mb-1 block">Ключевые слова:</span>
                    <div className="flex flex-wrap gap-1">
                      {cluster.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Примеры отзывов:</span>
                    <div className="space-y-1">
                      {cluster.examples.slice(0, 2).map((example, index) => (
                        <blockquote key={index} className="text-xs italic text-muted-foreground pl-3 border-l-2 border-muted">
                          "{example}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {cluster.actionable && (
                    <Button variant="default" size="sm" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Создать задачу
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-xs">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Детали
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">ML Model Info</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Алгоритм: BERT + LDA тематическое моделирование</p>
            <p>• Последнее обучение: 2 часа назад на 15,847 отзывах</p>
            <p>• Accuracy: 87.3% • Precision: 92.1% • Recall: 84.6%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}