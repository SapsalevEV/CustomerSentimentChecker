import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Отчеты</h1>
          <p className="text-muted-foreground mt-1">Создание и доступ к комплексным аналитическим отчетам</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Конструктор отчетов и репозиторий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Интерфейс конструктора отчетов и репозитория скоро появится...
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}