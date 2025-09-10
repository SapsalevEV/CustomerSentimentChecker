import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/dashboard/TrendChart";

const analyticsData = [
  { date: "Jan", value: 65 },
  { date: "Feb", value: 68 },
  { date: "Mar", value: 72 },
  { date: "Apr", value: 70 },
  { date: "May", value: 75 },
  { date: "Jun", value: 73 }
];

export default function Analytics() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Расширенная аналитика</h1>
          <p className="text-muted-foreground mt-1">Углубленные инструменты анализа трендов, корреляций и паттернов</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            title="Тренд настроений за 6 месяцев"
            data={analyticsData}
            color="hsl(var(--gpb-blue))"
            height={300}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Корреляционный анализ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                Расширенные корреляционные графики и инсайты скоро появятся...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}