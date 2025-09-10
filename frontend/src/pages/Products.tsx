import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const productData = {
  mortgage: {
    name: "Mortgage Products",
    satisfaction: 78,
    reviewVolume: 1247,
    shareOfVoice: 34,
    conversionRate: 12.4
  }
};

const keyIssues = [
  {
    title: "Время обработки кредита",
    mentions: 342,
    sentiment: "negative",
    example: "\"Одобрение ипотеки заняло 6 недель вместо обещанных 3 недель...\"",
    data: "Наше среднее время: 4.2 дня против рыночных 2.1 дня",
    actions: ["Создать задачу", "Анализировать процесс", "Сравнить с конкурентами"]
  },
  {
    title: "Требования к документам",
    mentions: 189,
    sentiment: "neutral", 
    example: "\"Пришлось подавать один и тот же документ несколько раз...\"",
    data: "В среднем 3.2 повторные подачи на заявку",
    actions: ["Создать задачу", "Упростить процесс"]
  }
];

const competitorData = [
  { bank: "Our Bank", score: 78, time: "4.2 days", rate: "12.4%", nps: 42 },
  { bank: "Bank Alpha", score: 82, time: "2.1 days", rate: "14.1%", nps: 51 },
  { bank: "Bank Beta", score: 76, time: "3.8 days", rate: "13.2%", nps: 38 },
  { bank: "Bank Gamma", score: 80, time: "2.9 days", rate: "12.8%", nps: 45 }
];

export default function Products() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Анализ продуктов</h1>
            <p className="text-muted-foreground mt-1">Детальная аналитика производительности продуктов и отзывов клиентов</p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="30days">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Последние 7 дней</SelectItem>
                <SelectItem value="30days">Последние 30 дней</SelectItem>
                <SelectItem value="quarter">Этот квартал</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Метрики ипотечных продуктов</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Оценка удовлетворенности"
              value="78/100"
              trend={{
                value: 5,
                label: "к прошлому месяцу",
                direction: "up"
              }}
              variant="positive"
            />
            <MetricCard
              title="Объем отзывов"
              value="1,247"
              trend={{
                value: 18,
                label: "рост к пр. мес.",
                direction: "up"
              }}
            />
            <MetricCard
              title="Доля голоса"
              value="34%"
              trend={{
                value: -2,
                label: "к конкурентам",
                direction: "down"
              }}
              variant="warning"
            />
            <MetricCard
              title="Конверсия"
              value="12.4%"
              trend={{
                value: 1.2,
                label: "к цели 13%",
                direction: "down"
              }}
              variant="negative"
            />
          </div>
        </div>

        {/* Key Issues */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Ключевые проблемы (анализ ИИ)</h2>
          <div className="space-y-4">
            {keyIssues.map((issue, index) => (
              <Card key={index} className="border-l-4 border-l-sentiment-negative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                        <Badge variant="outline" className="text-sentiment-negative">
                          {issue.mentions} упоминаний
                        </Badge>
                        <div className="text-2xl">😞</div>
                      </div>
                      
                      <blockquote className="text-muted-foreground italic mb-3 pl-4 border-l-2 border-muted">
                        {issue.example}
                      </blockquote>
                      
                      <div className="bg-muted/50 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium text-foreground">
                          📊 Объективные данные: {issue.data}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {issue.actions.map((action) => (
                      <Button key={action} variant="outline" size="sm">
                        {action}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Competitive Benchmark */}
        <Card>
          <CardHeader>
            <CardTitle>Сравнение с конкурентами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Банк</th>
                    <th className="text-left py-3 px-4">Оценка удовлетворенности</th>
                    <th className="text-left py-3 px-4">Среднее время обработки</th>
                    <th className="text-left py-3 px-4">Коэффициент конверсии</th>
                    <th className="text-left py-3 px-4">NPS</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorData.map((row, index) => (
                    <tr key={index} className={`border-b hover:bg-muted/50 ${index === 0 ? 'bg-primary/5 font-medium' : ''}`}>
                      <td className="py-3 px-4">{row.bank}</td>
                      <td className="py-3 px-4">{row.score}/100</td>
                      <td className="py-3 px-4">{row.time}</td>
                      <td className="py-3 px-4">{row.rate}</td>
                      <td className="py-3 px-4">{row.nps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}