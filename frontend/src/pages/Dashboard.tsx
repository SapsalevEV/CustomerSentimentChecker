import { MetricCard } from "@/components/dashboard/MetricCard";
import { SentimentIndicator } from "@/components/dashboard/SentimentIndicator";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, Users, ArrowRight } from "lucide-react";

// Mock data for the dashboard
const sentimentTrendData = [
  { date: "Mon", value: 68 },
  { date: "Tue", value: 71 },
  { date: "Wed", value: 69 },
  { date: "Thu", value: 73 },
  { date: "Fri", value: 76 },
  { date: "Sat", value: 74 },
  { date: "Sun", value: 73 },
];

const criticalAlerts = [
  {
    id: "INC-2024-001",
    title: "Сбой мобильного банкинга",
    description: "Сервис аутентификации испытывает высокую задержку, влияющую на вход в мобильное приложение",
    severity: "critical" as const,
    affectedUsers: 12470,
    timeAgo: "2 часа назад"
  },
  {
    id: "INC-2024-002", 
    title: "Задержки обработки платежей по картам",
    description: "Увеличенное время обработки карточных транзакций в часы пик",
    severity: "warning" as const,
    affectedUsers: 3241,
    timeAgo: "4 часа назад"
  }
];

const risingTopics = [
  { topic: "Сбои мобильного приложения", change: "+34%" },
  { topic: "Очереди в банкоматах", change: "+28%" },
  { topic: "Ожидание клиентской службы", change: "+19%" }
];

const fallingTopics = [
  { topic: "Скорость обработки кредитов", change: "-12%" },
  { topic: "Производительность сайта", change: "-8%" },
  { topic: "Качество обслуживания в отделениях", change: "-5%" }
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Пульс Банка</h1>
          <p className="text-muted-foreground mt-1">Анализ настроений клиентов и операционные инсайты в реальном времени</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Последнее обновление</p>
          <p className="font-medium">2 минуты назад</p>
        </div>
      </div>

      {/* Sentiment Index - Hero Section */}
      <Card className="bg-gradient-primary text-white border-0">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-lg font-medium mb-2 opacity-90">Общий индекс настроений</h2>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-mono font-bold">73</span>
                <div className="flex items-center gap-2 text-green-200">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-xl font-medium">+5</span>
                  <span className="text-sm opacity-75">к вчерашнему дню</span>
                </div>
              </div>
              <p className="mt-3 opacity-90">Настроения клиентов имеют положительный тренд по всем точкам взаимодействия</p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <SentimentIndicator score={73} size="lg" showLabel={false} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Требует немедленного внимания</h2>
          <Button variant="outline" size="sm">
            Посмотреть все инциденты
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="space-y-3">
          {criticalAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              {...alert}
              onViewDetails={() => console.log("View details for", alert.id)}
            />
          ))}
        </div>
      </div>

      {/* Today's Summary Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Сводка за сегодня</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Отзывов сегодня"
            value="2,847"
            trend={{
              value: 12,
              label: "к вчерашнему дню",
              direction: "up"
            }}
            subtitle="68% Положительных • 24% Нейтральных • 8% Негативных"
            variant="positive"
          />
          <MetricCard
            title="Очередь обработки"
            value="94%"
            trend={{
              value: -3,
              label: "к прошлому часу",
              direction: "down"
            }}
            subtitle="Осталось 164 отзыва"
            variant="warning"
          />
          <MetricCard
            title="Среднее время ответа"
            value="2.4ч"
            trend={{
              value: 8,
              label: "к целевым 2.0ч",
              direction: "up"
            }}
            subtitle="Цель: 2.0ч"
            variant="negative"
          />
        </div>
      </div>

      {/* Charts and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Dynamics Chart */}
        <TrendChart
          title="Динамика настроений за 7 дней"
          data={sentimentTrendData}
          color="hsl(var(--primary))"
          height={250}
        />

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Недельные тренды</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-sentiment-negative" />
                  <span className="font-medium text-sentiment-negative">РАСТЕТ</span>
                </div>
                <div className="space-y-2">
                  {risingTopics.map((item) => (
                    <div key={item.topic} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.topic}</span>
                      <Badge variant="outline" className="text-sentiment-negative">
                        {item.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4 text-sentiment-positive" />
                  <span className="font-medium text-sentiment-positive">ПАДАЕТ</span>
                </div>
                <div className="space-y-2">
                  {fallingTopics.map((item) => (
                    <div key={item.topic} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.topic}</span>
                      <Badge variant="outline" className="text-sentiment-positive">
                        {item.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}