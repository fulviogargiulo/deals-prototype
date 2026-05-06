import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({ 
  children, 
  className, 
  hover = false, 
  interactive = false,
  gradient = false,
  onClick 
}: EnhancedCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-300 ease-out border-border/50 bg-surface-1",
        hover && "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        interactive && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        "animate-fade-in",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

EnhancedCard.Header = CardHeader;
EnhancedCard.Content = CardContent;