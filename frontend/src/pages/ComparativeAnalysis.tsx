import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ComparisonSelector } from "@/components/comparative/ComparisonSelector";
import { ProductComparison } from "@/components/comparative/ProductComparison";
import { AspectAnalysis } from "@/components/comparative/AspectAnalysis";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { MockDataWarning } from "@/components/common/MockDataWarning";

export type ComparisonMode = 'products' | 'aspects';

export default function ComparativeAnalysis() {
  const [mode, setMode] = useState<ComparisonMode>('products');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Mock Data Warning */}
        <MockDataWarning
          component="Comparative Analysis"
          missingEndpoints={[
            'POST /api/comparative/products',
            'POST /api/comparative/aspects'
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Рычаги влияния</h1>
            <p className="text-muted-foreground mt-1">
              Сравнительный анализ продуктов и аспектов для выявления возможностей роста
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

        {/* Mode Selector */}
        <ComparisonSelector mode={mode} onModeChange={setMode} />

        {/* Content based on mode */}
        <div className="min-h-[600px]">
          {mode === 'products' ? (
            <ProductComparison />
          ) : (
            <AspectAnalysis />
          )}
        </div>
      </div>
    </AppLayout>
  );
}