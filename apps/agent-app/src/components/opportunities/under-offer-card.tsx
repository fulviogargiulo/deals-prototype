import { FileText, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnderOfferCardProps {
  id: string;
  image: string;
  title: string;
  price: string;
  bedrooms: number;
  size: number;
  sizeUnit: string;
  statusText: string;
  statusTime: string;
  onTrackProgress: () => void;
  onUpdateStatus: () => void;
  className?: string;
}

export function UnderOfferCard({
  image,
  title,
  price,
  bedrooms,
  size,
  sizeUnit,
  statusText,
  statusTime,
  onTrackProgress,
  onUpdateStatus,
  className,
}: UnderOfferCardProps) {
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow bg-surface-1", className)}>
      <div className="flex gap-4 p-4">
        {/* Property Image */}
        <div className="relative w-40 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Property Info */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-2 text-xs">
                My property
              </Badge>
              <h3 className="font-semibold text-base leading-tight mb-1">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{price}</span>
                <span>•</span>
                <span>{bedrooms} beds</span>
                <span>•</span>
                <span>{size} {sizeUnit}</span>
              </div>
            </div>
              
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit status</DropdownMenuItem>
                <DropdownMenuItem>Remove from opportunity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto mb-3">
            <Button
              onClick={onTrackProgress}
              className="flex-1"
              size="default"
            >
              Track progress
            </Button>
            <Button
              onClick={onUpdateStatus}
              variant="outline"
              className="flex-1"
              size="default"
            >
              Update status
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{statusText} {statusTime}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
