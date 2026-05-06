import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ChevronRight, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BuyerUnderOfferCardProps {
  id: string;
  name: string;
  location?: string;
  budgetRange?: string;
  bedrooms?: string;
  size?: string;
  statusText: string;
  statusTime: string;
  onTrackProgress: () => void;
  onUpdateStatus: () => void;
}

export function BuyerUnderOfferCard({
  name,
  location,
  budgetRange,
  bedrooms,
  size,
  statusText,
  statusTime,
  onTrackProgress,
  onUpdateStatus,
}: BuyerUnderOfferCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <UserAvatar name={name} size="lg" className="w-16 h-16 flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1 truncate">{name}</h3>
                <div className="text-sm text-muted-foreground">
                  {location && <div>{location}</div>}
                  {(budgetRange || bedrooms || size) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {budgetRange && <span>{budgetRange}</span>}
                      {budgetRange && (bedrooms || size) && <span>·</span>}
                      {bedrooms && <span>{bedrooms}</span>}
                      {bedrooms && size && <span>·</span>}
                      {size && <span>{size}</span>}
                    </div>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View profile</DropdownMenuItem>
                  <DropdownMenuItem>Send message</DropdownMenuItem>
                  <DropdownMenuItem>Schedule call</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-foreground">{statusText}</span>
              <span className="text-sm text-muted-foreground">· {statusTime}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={onTrackProgress}
                variant="default"
                size="sm"
                className="flex-1"
              >
                Track progress
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                onClick={onUpdateStatus}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Update status
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
