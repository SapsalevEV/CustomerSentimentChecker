import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, Target } from "lucide-react";
import { ComparisonMode } from "@/pages/ComparativeAnalysis";

interface ComparisonSelectorProps {
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
}

export function ComparisonSelector({ mode, onModeChange }: ComparisonSelectorProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={mode === 'products' ? 'default' : 'outline'}
            onClick={() => onModeChange('products')}
            className="flex items-center gap-2 h-12 px-8"
          >
            <GitCompare className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Сравнение продуктов</div>
              <div className="text-xs opacity-75">Выберите 2+ продукта для сравнения</div>
            </div>
          </Button>
          
          <div className="w-px h-12 bg-border"></div>
          
          <Button
            variant={mode === 'aspects' ? 'default' : 'outline'}
            onClick={() => onModeChange('aspects')}
            className="flex items-center gap-2 h-12 px-8"
          >
            <Target className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Анализ аспекта</div>
              <div className="text-xs opacity-75">Один аспект по всем продуктам</div>
            </div>
          </Button>
        </div>
        
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'products' 
            ? 'Сравните sentiment breakdown нескольких продуктов бок о бок' 
            : 'Найдите чемпионов и отстающих по конкретному аспекту'
          }
        </div>
      </CardContent>
    </Card>
  );
}