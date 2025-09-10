import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Actions() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Трекер действий</h1>
          <p className="text-muted-foreground mt-1">Мониторинг и управление задачами, созданными на основе аналитических инсайтов</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Управление задачами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Интерфейс отслеживания действий и управления задачами скоро появится...
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}