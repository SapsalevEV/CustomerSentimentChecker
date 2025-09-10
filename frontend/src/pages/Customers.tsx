import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Customers() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Сегменты клиентов</h1>
          <p className="text-muted-foreground mt-1">Аналитика по демографии клиентов и паттернам поведения</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Анализ клиентских сегментов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Аналитика клиентских сегментов и инсайты скоро появятся...
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}