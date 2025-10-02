import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MockDataWarningProps {
  /**
   * Component or page name that's using mock data
   */
  component?: string;

  /**
   * Optional list of missing API endpoints
   */
  missingEndpoints?: string[];

  /**
   * Variant of the warning (warning = yellow, info = blue)
   */
  variant?: 'warning' | 'info';

  /**
   * Show detailed message about API implementation status
   */
  showDetails?: boolean;
}

/**
 * Warning component to indicate that mock/demo data is being used
 * Shows up on pages that are waiting for backend API implementation
 */
export function MockDataWarning({
  component = 'This page',
  missingEndpoints = [],
  variant = 'warning',
  showDetails = true
}: MockDataWarningProps) {
  const isWarning = variant === 'warning';

  return (
    <Alert variant={isWarning ? "default" : "default"} className={`border-l-4 ${isWarning ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'}`}>
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className={`text-base font-semibold ${isWarning ? 'text-yellow-900 dark:text-yellow-100' : 'text-blue-900 dark:text-blue-100'}`}>
            {isWarning ? 'Демонстрационные данные' : 'Информация'}
          </AlertTitle>
          <AlertDescription className={`mt-2 text-sm ${isWarning ? 'text-yellow-800 dark:text-yellow-200' : 'text-blue-800 dark:text-blue-200'}`}>
            <p className="mb-2">
              <strong>{component}</strong> использует демонстрационные (mock) данные.
              Реальные данные будут доступны после реализации соответствующих API endpoints на backend.
            </p>

            {showDetails && missingEndpoints.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-2">Требуемые API endpoints:</p>
                <div className="flex flex-wrap gap-2">
                  {missingEndpoints.map((endpoint) => (
                    <Badge
                      key={endpoint}
                      variant="outline"
                      className={`font-mono text-xs ${isWarning ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}
                    >
                      {endpoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {showDetails && (
              <p className="mt-3 text-xs opacity-80">
                См. <code className="px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded">API_INTEGRATION_STATUS.md</code> для полной информации о статусе интеграции.
              </p>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
