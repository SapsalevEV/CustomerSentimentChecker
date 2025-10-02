import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  affectedUsers?: number;
  timeAgo: string;
  onViewDetails?: () => void;
  className?: string;
}

export function AlertCard({
  id,
  title,
  description,
  severity,
  affectedUsers,
  timeAgo,
  onViewDetails,
  className
}: AlertCardProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          badge: "🔴 CRITICAL",
          color: "border-critical/30 bg-critical/5",
          textColor: "text-critical"
        };
      case "warning":
        return {
          badge: "🟡 WARNING",
          color: "border-warning/30 bg-warning/5",
          textColor: "text-warning"
        };
      case "info":
        return {
          badge: "🔵 INFO",
          color: "border-info/30 bg-info/5",
          textColor: "text-info"
        };
      default:
        return {
          badge: "INFO",
          color: "",
          textColor: ""
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <Card className={cn("transition-all hover:shadow-md", config.color, className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs font-medium", config.textColor)}>
                {config.badge}
              </Badge>
              <span className="text-xs text-muted-foreground">#{id}</span>
            </div>
            
            <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
              {affectedUsers && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{affectedUsers.toLocaleString()} affected</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="shrink-0"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}