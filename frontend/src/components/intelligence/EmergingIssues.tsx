import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, TrendingUp, Clock, Eye, AlertCircle, MessageSquare } from "lucide-react";

interface EmergingIssue {
  id: string;
  title: string;
  description: string;
  firstDetected: string;
  growthRate: number;
  currentMentions: number;
  projectedMentions: number;
  sentiment: number;
  confidence: number;
  keyTerms: string[];
  sampleReviews: string[];
  similarityToKnown: number;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  potentialCauses: string[];
  recommendedActions: string[];
}

const mockEmergingIssues: EmergingIssue[] = [
  {
    id: "emerging-1",
    title: "Проблемы с новым алгоритмом кэшбэка",
    description: "Обнаружено появление жалоб на некорректное начисление кэшбэка после внедрения нового алгоритма расчета.",
    firstDetected: "2 дня назад",
    growthRate: 234,
    currentMentions: 67,
    projectedMentions: 180,
    sentiment: 31,
    confidence: 87,
    keyTerms: ["кэшбэк", "не начислили", "пропал", "алгоритм", "расчет"],
    sampleReviews: [
      "Кэшбэк за покупки в супермаркете не начислился уже вторую неделю",
      "Новый расчет кэшбэка работает некорректно, потерял 500 рублей",
      "После обновления приложения кэшбэк начисляется не по всем категориям"
    ],
    similarityToKnown: 23,
    urgencyLevel: "high",
    potentialCauses: [
      "Ошибка в новом алгоритме расчета",
      "Проблемы интеграции с партнерами", 
      "Некорректная настройка категорий"
    ],
    recommendedActions: [
      "Срочный аудит алгоритма расчета кэшбэка",
      "Проверка интеграций с торговыми партнерами",
      "Компенсация пострадавшим клиентам",
      "Откат к предыдущей версии при необходимости"
    ]
  },
  {
    id: "emerging-2",
    title: "Медленная загрузка после iOS 17.1",
    description: "Кластер жалоб на медленную работу приложения среди пользователей iPhone после обновления до iOS 17.1.",
    firstDetected: "18 часов назад",
    growthRate: 156,
    currentMentions: 34,
    projectedMentions: 89,
    sentiment: 39,
    confidence: 74,
    keyTerms: ["iOS", "медленно", "зависает", "тормозит", "17.1"],
    sampleReviews: [
      "После обновления iPhone приложение банка страшно тормозит",
      "iOS 17.1 и банковское приложение не дружат, все медленно грузится",
      "Невозможно пользоваться, приложение зависает на каждом действии"
    ],
    similarityToKnown: 45,
    urgencyLevel: "medium", 
    potentialCauses: [
      "Несовместимость с новой версией iOS",
      "Изменения в API iOS",
      "Проблемы с оптимизацией для новых устройств"
    ],
    recommendedActions: [
      "Тестирование на iOS 17.1",
      "Обновление iOS SDK",
      "Оптимизация производительности",
      "Хотфикс для критических проблем"
    ]
  },
  {
    id: "emerging-3", 
    title: "Непонятные комиссии в выписке",
    description: "Новый тип жалоб на появление неясных комиссий в выписках, которых раньше не было.",
    firstDetected: "4 дня назад",
    growthRate: 89,
    currentMentions: 45,
    projectedMentions: 95,
    sentiment: 28,
    confidence: 92,
    keyTerms: ["комиссия", "выписка", "непонятно", "откуда", "списание"],
    sampleReviews: [
      "В выписке появились какие-то комиссии, которых раньше не было",
      "Не понимаю за что списали 50 рублей комиссии",
      "Комиссии в выписке не расшифрованы, что это за платежи?"
    ],
    similarityToKnown: 67,
    urgencyLevel: "medium",
    potentialCauses: [
      "Изменение тарифов без уведомления",
      "Ошибка в системе биллинга",
      "Недостаточно четкое описание в выписках"
    ],
    recommendedActions: [
      "Проверка корректности тарификации",
      "Улучшение описаний в выписках", 
      "Проактивное уведомление об изменениях",
      "FAQ по новым комиссиям"
    ]
  }
];

const historicalTrends = [
  { issue: "Сбои Push-уведомлений", detected: "3 мес. назад", growth: "340%", resolved: "14 дней", action: "Обновление FCM" },
  { issue: "Проблемы с FaceID", detected: "5 мес. назад", growth: "200%", resolved: "21 день", action: "Патч iOS SDK" },
  { issue: "Медленные переводы СБП", detected: "7 мес. назад", growth: "156%", resolved: "5 дней", action: "Оптимизация API" },
  { issue: "Ошибки в кэшбэке за АЗС", detected: "9 мес. назад", growth: "445%", resolved: "28 дней", action: "Исправление правил" }
];

export function EmergingIssues() {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary'; 
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-sentiment-positive';
    if (score >= 50) return 'text-orange-600';
    return 'text-sentiment-negative';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Emerging Issues Detection
          <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-red-100 text-orange-700">
            Early Warning
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Текущие emerging issues</TabsTrigger>
            <TabsTrigger value="historical">Исторические тренды</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {mockEmergingIssues.map((issue) => (
              <div key={issue.id} className={`border rounded-lg p-4 ${
                issue.urgencyLevel === 'critical' ? 'border-red-300 bg-red-50/50' :
                issue.urgencyLevel === 'high' ? 'border-orange-300 bg-orange-50/50' :
                'border-yellow-200 bg-yellow-50/30'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{issue.title}</h4>
                      <Badge variant={getUrgencyColor(issue.urgencyLevel)}>
                        {issue.urgencyLevel} urgency
                      </Badge>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {issue.firstDetected}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Рост:</span>
                        <p className="font-bold text-sentiment-negative">+{issue.growthRate}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Сейчас:</span>
                        <p className="font-medium">{issue.currentMentions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Прогноз:</span>
                        <p className="font-medium">{issue.projectedMentions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sentiment:</span>
                        <p className={`font-medium ${getSentimentColor(issue.sentiment)}`}>
                          {issue.sentiment}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <Progress value={issue.confidence} className="h-2 mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-muted-foreground mb-1 block">Ключевые термины:</span>
                        <div className="flex flex-wrap gap-1">
                          {issue.keyTerms.map((term) => (
                            <Badge key={term} variant="outline" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-muted-foreground mb-1 block">Схожесть с известными проблемами:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={issue.similarityToKnown} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{issue.similarityToKnown}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground mb-2 block">Примеры отзывов:</span>
                      <div className="space-y-1">
                        {issue.sampleReviews.slice(0, 2).map((review, index) => (
                          <blockquote key={index} className="text-xs italic text-muted-foreground pl-3 border-l-2 border-muted">
                            "{review}"
                          </blockquote>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium mb-2 block flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Возможные причины:
                        </span>
                        <div className="space-y-1">
                          {issue.potentialCauses.map((cause, index) => (
                            <div key={index} className="text-xs flex items-start gap-2">
                              <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5"></div>
                              <span>{cause}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium mb-2 block flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          Рекомендуемые действия:
                        </span>
                        <div className="space-y-1">
                          {issue.recommendedActions.slice(0, 3).map((action, index) => (
                            <div key={index} className="text-xs flex items-start gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full mt-1.5"></div>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button variant={issue.urgencyLevel === 'critical' || issue.urgencyLevel === 'high' ? 'default' : 'outline'} size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      Исследовать
                    </Button>
                    <Button variant="outline" size="sm">
                      Создать задачу
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <div className="space-y-3">
              {historicalTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <h5 className="font-medium text-foreground">{trend.issue}</h5>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Обнаружено: {trend.detected}</span>
                      <span>Рост: <span className="text-sentiment-negative font-medium">{trend.growth}</span></span>
                      <span>Решено за: <span className="font-medium">{trend.resolved}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {trend.action}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Insights из исторических данных</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Среднее время от обнаружения до решения: 17 дней</p>
                <p>• 78% emerging issues связаны с техническими обновлениями</p>
                <p>• Раннее обнаружение сокращает время решения на 45%</p>
                <p>• Наиболее частые категории: мобильное приложение (42%), платежи (28%)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Algorithm Info */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Detection Algorithm</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Novelty Detection: Isolation Forest + DBSCAN кластеризация</p>
            <p>• Temporal Analysis: детекция резких изменений в топиках</p>
            <p>• Threshold: &gt;100% рост упоминаний + &lt;70% схожесть с известными</p>
            <p>• Update Frequency: каждые 2 часа, полный пересчет раз в день</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}