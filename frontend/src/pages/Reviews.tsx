import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewsFilter } from "@/components/reviews/ReviewsFilter";
import { ReviewsFeed } from "@/components/reviews/ReviewsFeed";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter } from "lucide-react";
import { MockDataWarning } from "@/components/common/MockDataWarning";

export default function Reviews() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mock Data Warning */}
        <MockDataWarning
          component="Reviews Page"
          missingEndpoints={[
            'POST /api/reviews',
            'POST /api/reviews/statistics'
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Голос клиента</h1>
            <p className="text-muted-foreground mt-1">
              Подробный просмотр и анализ отзывов клиентов с возможностью фильтрации и тегирования
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter />
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего отзывов</p>
                  <p className="text-2xl font-bold">2,847</p>
                </div>
                <Badge variant="secondary">+12%</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Позитивные</p>
                  <p className="text-2xl font-bold text-green-600">1,936</p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">68%</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Нейтральные</p>
                  <p className="text-2xl font-bold text-yellow-600">683</p>
                </div>
                <Badge variant="secondary">24%</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Негативные</p>
                  <p className="text-2xl font-bold text-red-600">228</p>
                </div>
                <Badge variant="destructive">8%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <ReviewsFilter />

        {/* Reviews Feed */}
        <ReviewsFeed />
      </div>
    </AppLayout>
  );
}