import { Badge } from "@/components/ui/badge";
import { Files } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReferenceCodeBadgeProps {
  code: string;
  className?: string;
}

export function ReferenceCodeBadge({ code, className }: ReferenceCodeBadgeProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Reference code copied!');
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-medium cursor-pointer hover:bg-muted transition-colors text-xs px-3 py-1.5 border-0 bg-white",
        className
      )}
      onClick={handleCopy}
    >
      <Files className="w-4 h-4" strokeWidth={2.5} />
      {code}
    </Badge>
  );
}
