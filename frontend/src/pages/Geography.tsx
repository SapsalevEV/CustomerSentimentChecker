import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, TrendingDown } from "lucide-react";

const topProblematicBranches = [
  {
    name: "Центральный филиал №42",
    score: 52,
    reviews: 324,
    issues: ["Длинные очереди (67%)", "Нехватка персонала (23%)", "Проблемы с банкоматами (18%)"]
  },
  {
    name: "Торговый центр №18",
    score: 58,
    reviews: 189,
    issues: ["Проблемы с парковкой (45%)", "Время ожидания (38%)", "Ограниченные часы работы (22%)"]
  },
  {
    name: "Пригородный филиал №71",
    score: 61,
    reviews: 156,
    issues: ["Системные сбои (52%)", "Медленное обслуживание (31%)", "Чистота (12%)"]
  }
];

export default function Geography() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Географический анализ</h1>
          <p className="text-muted-foreground mt-1">Региональные паттерны настроений и аналитика производительности филиалов</p>
        </div>

        {/* Interactive Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Региональная карта настроений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gradient-to-br from-gpb-light-blue/20 to-gpb-blue/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold mb-2">Интерактивная карта настроений</h3>
                <p className="text-muted-foreground">Наведите на регион, чтобы увидеть оценки настроений и количество отзывов</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Problematic Branches */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Топ 5 проблемных филиалов</h2>
          <div className="space-y-4">
            {topProblematicBranches.map((branch, index) => (
              <Card key={index} className="border-l-4 border-l-sentiment-negative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold">{branch.name}</h3>
                        <Badge variant="outline" className="text-sentiment-negative">
                          {branch.score}/100
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{branch.reviews} отзывов</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {branch.issues.map((issue, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Детали филиала
                      </Button>
                      <Button variant="outline" size="sm">
                        План улучшений
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}