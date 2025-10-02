import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight, Target, Star, Zap } from "lucide-react";
import { MockDataWarning } from "@/components/common/MockDataWarning";

const productsMatrix = [
  { 
    id: "mobile-banking", 
    name: "Мобильный банкинг", 
    satisfaction: 68, 
    feedbackVolume: 2847, 
    growth: "+12%",
    category: "digital",
    criticalFeatures: ["Вход в приложение", "Переводы", "Платежи"],
    position: { x: 68, y: 2847 }
  },
  { 
    id: "cards", 
    name: "Банковские карты", 
    satisfaction: 82, 
    feedbackVolume: 1634, 
    growth: "+8%",
    category: "traditional",
    criticalFeatures: ["Доставка карт", "Cashback", "Лимиты"],
    position: { x: 82, y: 1634 }
  },
  { 
    id: "deposits", 
    name: "Депозиты", 
    satisfaction: 89, 
    feedbackVolume: 892, 
    growth: "+2%",
    category: "traditional",
    criticalFeatures: ["Проценты", "Срок", "Пополнение"],
    position: { x: 89, y: 892 }
  },
  { 
    id: "loans", 
    name: "Кредиты", 
    satisfaction: 45, 
    feedbackVolume: 2156, 
    growth: "-5%",
    category: "traditional", 
    criticalFeatures: ["Время рассмотрения", "Ставка", "Требования"],
    position: { x: 45, y: 2156 }
  },
  { 
    id: "insurance", 
    name: "Страхование", 
    satisfaction: 71, 
    feedbackVolume: 467, 
    growth: "+15%",
    category: "digital",
    criticalFeatures: ["Оформление", "Выплаты", "Понятность условий"],
    position: { x: 71, y: 467 }
  },
  { 
    id: "investments", 
    name: "Инвестиции", 
    satisfaction: 76, 
    feedbackVolume: 589, 
    growth: "+28%",
    category: "digital", 
    criticalFeatures: ["Интерфейс", "Комиссии", "Аналитика"],
    position: { x: 76, y: 589 }
  }
];

const aspectPriorities = [
  { 
    aspect: "Время обработки", 
    importance: 95, 
    satisfaction: 42, 
    gap: -53,
    products: ["Кредиты", "Мобильный банкинг"],
    actionable: true
  },
  { 
    aspect: "Удобство интерфейса", 
    importance: 88, 
    satisfaction: 71, 
    gap: -17,
    products: ["Мобильный банкинг", "Инвестиции"],
    actionable: true
  },
  { 
    aspect: "Прозрачность условий", 
    importance: 92, 
    satisfaction: 68, 
    gap: -24,
    products: ["Кредиты", "Страхование"],
    actionable: true
  },
  { 
    aspect: "Надежность системы", 
    importance: 97, 
    satisfaction: 84, 
    gap: -13,
    products: ["Мобильный банкинг", "Депозиты"],
    actionable: false
  }
];

export default function Products() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mock Data Warning */}
        <MockDataWarning
          component="Products Performance Matrix"
          missingEndpoints={[
            'POST /api/products/performance',
            'POST /api/products/aspect-priorities'
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Performance Matrix</h1>
            <p className="text-muted-foreground mt-1">Позиционирование продуктов: Удовлетворенность × Объем обратной связи</p>
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
            <Button variant="outline">
              <Target className="w-4 h-4 mr-2" />
              Экспорт анализа
            </Button>
          </div>
        </div>

        {/* Product Performance Matrix */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Performance Matrix
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Размер круга = объем отзывов
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 bg-gradient-to-br from-muted/20 to-background border rounded-lg p-6">
              {/* Axis Labels */}
              <div className="absolute left-4 top-1/2 -rotate-90 text-sm font-medium text-muted-foreground">
                Объем отзывов
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
                Satisfaction Score
              </div>
              
              {/* Quadrant Lines */}
              <div className="absolute left-1/2 top-6 bottom-6 w-px bg-border"></div>
              <div className="absolute top-1/2 left-6 right-6 h-px bg-border"></div>
              
              {/* Quadrant Labels */}
              <div className="absolute top-8 right-8 text-xs text-muted-foreground font-medium">
                Звезды ⭐<br />
                <span className="text-sentiment-positive">Высокая удовлетворенность<br />Высокий объем</span>
              </div>
              <div className="absolute top-8 left-8 text-xs text-muted-foreground font-medium">
                Рост 📈<br />
                <span className="text-sentiment-neutral">Низкая удовлетворенность<br />Высокий объем</span>
              </div>
              <div className="absolute bottom-8 right-8 text-xs text-muted-foreground font-medium">
                Нишевые 🎯<br />
                <span className="text-sentiment-positive">Высокая удовлетворенность<br />Низкий объем</span>
              </div>
              <div className="absolute bottom-8 left-8 text-xs text-muted-foreground font-medium">
                Проблемы ⚠️<br />
                <span className="text-sentiment-negative">Низкая удовлетворенность<br />Низкий объем</span>
              </div>

              {/* Product Points */}
              {productsMatrix.map((product) => (
                <div
                  key={product.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${(product.satisfaction / 100) * 80 + 6}%`,
                    bottom: `${(product.feedbackVolume / 3000) * 80 + 6}%`,
                    transform: 'translate(-50%, 50%)'
                  }}
                >
                  <div 
                    className={`rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-110 ${
                      product.category === 'digital' ? 'bg-primary' : 'bg-gpb-orange'
                    }`}
                    style={{ 
                      width: `${Math.max(32, product.feedbackVolume / 50)}px`, 
                      height: `${Math.max(32, product.feedbackVolume / 50)}px` 
                    }}
                  >
                    {product.name.split(' ')[0].slice(0, 3).toUpperCase()}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border min-w-48">
                      <h4 className="font-semibold text-sm mb-2">{product.name}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Satisfaction:</span>
                          <span className="font-medium">{product.satisfaction}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Объем:</span>
                          <span className="font-medium">{product.feedbackVolume} отзывов</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Рост:</span>
                          <span className={`font-medium ${product.growth.startsWith('+') ? 'text-sentiment-positive' : 'text-sentiment-negative'}`}>
                            {product.growth}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
                <span>Digital продукты</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gpb-orange rounded-full"></div>
                <span>Традиционные продукты</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aspect Mining & Prioritization */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Матрица важность/удовлетворенность 
            <Badge variant="outline" className="ml-2">AI Insights</Badge>
          </h2>
          
          <div className="space-y-4">
            {aspectPriorities.map((aspect, index) => (
              <Card key={index} className={`border-l-4 ${
                aspect.actionable ? 'border-l-sentiment-negative' : 'border-l-sentiment-positive'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-foreground">{aspect.aspect}</h3>
                        <Badge variant={aspect.actionable ? "destructive" : "secondary"}>
                          {aspect.actionable ? "Действие требуется" : "Мониторинг"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 mb-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Важность для клиентов</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${aspect.importance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{aspect.importance}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">Удовлетворенность</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  aspect.satisfaction > 70 ? 'bg-sentiment-positive' : 
                                  aspect.satisfaction > 50 ? 'bg-gpb-orange' : 'bg-sentiment-negative'
                                }`}
                                style={{ width: `${aspect.satisfaction}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{aspect.satisfaction}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-muted-foreground">Gap to Excellence</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              aspect.gap < -30 ? 'text-sentiment-negative' :
                              aspect.gap < -15 ? 'text-gpb-orange' : 'text-sentiment-positive'
                            }`}>
                              {aspect.gap}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {aspect.products.map((product) => (
                          <Badge key={product} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {aspect.actionable ? (
                        <Button variant="default" size="sm">
                          <Target className="w-3 h-3 mr-1" />
                          Quick Win
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          Мониторинг
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Product Deep Dive Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Детализация по продуктам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Продукт</th>
                    <th className="text-left py-3 px-4">Satisfaction</th>
                    <th className="text-left py-3 px-4">Объем отзывов</th>
                    <th className="text-left py-3 px-4">Рост</th>
                    <th className="text-left py-3 px-4">Критические features</th>
                    <th className="text-left py-3 px-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {productsMatrix.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            product.category === 'digital' ? 'bg-primary' : 'bg-gpb-orange'
                          }`}></div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            product.satisfaction > 70 ? 'text-sentiment-positive' : 
                            product.satisfaction > 50 ? 'text-gpb-orange' : 'text-sentiment-negative'
                          }`}>
                            {product.satisfaction}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.feedbackVolume.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={product.growth.startsWith('+') ? "default" : "destructive"} className="text-xs">
                          {product.growth}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {product.criticalFeatures.slice(0, 2).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {product.criticalFeatures.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.criticalFeatures.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Drill-down
                        </Button>
                      </td>
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