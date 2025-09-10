import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users, Smartphone, Monitor, Tablet } from "lucide-react";

const incidentData = {
  id: "INC-2024-001",
  title: "Сбой аутентификации мобильного банкинга",
  status: "critical",
  timeOpened: "2 часа назад",
  affectedFunctions: { mobile: 85, web: 12, atm: 3 },
  geography: ["Москва", "Санкт-Петербург", "Екатеринбург"],
  devices: { mobile: 78, tablet: 15, desktop: 7 }
};

const timeline = [
  { time: "14:23", event: "Получены первые жалобы", type: "start" },
  { time: "14:45", event: "Пик активности - 50+ жалоб/мин", type: "peak" },
  { time: "15:12", event: "Уведомлена команда разработчиков", type: "action" },
  { time: "15:30", event: "Выявлена основная причина", type: "progress" },
  { time: "16:00", event: "Патч развернут в тестовой среде", type: "progress" },
];

const recommendedActions = [
  { action: "Отправить обновление статуса пострадавшим пользователям", completed: true, template: true },
  { action: "Эскалировать к старшим разработчикам", completed: true, template: false },
  { action: "Подготовить публичное заявление", completed: false, template: true },
  { action: "Запланировать встречу по разбору инцидента", completed: false, template: false },
  { action: "Создать тикет Jira для постоянного исправления", completed: false, template: false }
];

export default function Incidents() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Карточка критического инцидента</h1>
              <Badge className="bg-critical text-white">🔴 CRITICAL</Badge>
              <span className="text-muted-foreground">#{incidentData.id}</span>
            </div>
            <p className="text-muted-foreground">Открыт {incidentData.timeOpened}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">Назначить</Button>
            <Button variant="outline">Эскалировать</Button>
            <Button>Закрыть как решенный</Button>
          </div>
        </div>

        {/* Development Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Хронология развития событий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-mono text-muted-foreground">
                    {event.time}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="flex-1">
                    <span className="text-sm">{event.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Анализ проблемы (с помощью ИИ)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Затронутые функции</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Мобильное приложение</span>
                    </div>
                    <span className="font-mono">{incidentData.affectedFunctions.mobile}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      <span>Веб-портал</span>
                    </div>
                    <span className="font-mono">{incidentData.affectedFunctions.web}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Географическое воздействие</h4>
                <div className="flex flex-wrap gap-2">
                  {incidentData.geography.map((location) => (
                    <Badge key={location} variant="secondary">{location}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Типы устройств</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Мобильные</span>
                    <span className="font-mono">{incidentData.devices.mobile}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Планшеты</span>
                    <span className="font-mono">{incidentData.devices.tablet}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Десктопы</span>
                    <span className="font-mono">{incidentData.devices.desktop}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Рекомендуемые действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendedActions.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle 
                      className={`w-5 h-5 ${item.completed ? 'text-sentiment-positive' : 'text-muted-foreground'}`}
                    />
                    <div className="flex-1">
                      <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                        {item.action}
                      </span>
                    </div>
                    {!item.completed && (
                      <div className="flex gap-2">
                        {item.template && (
                          <Button size="sm" variant="outline">Использовать шаблон</Button>
                        )}
                        <Button size="sm">Выполнить</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}