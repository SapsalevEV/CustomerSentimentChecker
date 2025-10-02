import { cn } from "@/lib/utils";

interface SentimentIndicatorProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function SentimentIndicator({ 
  score, 
  size = "md", 
  showLabel = true,
  className 
}: SentimentIndicatorProps) {
  const getSentimentColor = (score: number) => {
    if (score >= 70) return "sentiment-positive";
    if (score >= 40) return "sentiment-neutral"; 
    return "sentiment-negative";
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 70) return "Positive";
    if (score >= 40) return "Neutral";
    return "Negative";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-12 h-12 text-sm";
      case "lg":
        return "w-20 h-20 text-2xl";
      default:
        return "w-16 h-16 text-lg";
    }
  };

  const circumference = 2 * Math.PI * 20;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn("relative", getSizeClasses())}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx="50%"
            cy="50%"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className={cn("transition-all duration-1000", getSentimentColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-bold">{score}</span>
        </div>
      </div>
      
      {showLabel && (
        <span className={cn("text-sm font-medium", getSentimentColor(score))}>
          {getSentimentLabel(score)}
        </span>
      )}
    </div>
  );
}