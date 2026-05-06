import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PropertyTableRowProps {
  id: string;
  image: string;
  title: string;
  location?: string;
  price: string;
  bedrooms: number;
  bathrooms?: number;
  size: number;
  sizeUnit: string;
  source?: {
    type: 'portal' | 'my-property' | 'property-hub' | 'match';
    name: string;
  };
  labels?: string[];
  updateIndicator?: string;
  statusText?: string;
  statusTime?: string;
  actions: {
    primary: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'outline' | 'ghost';
    };
  };
  onTrackProgress?: () => void;
  onUpdateStatus?: () => void;
}

export function PropertyTableRow({
  image,
  title,
  location,
  price,
  bedrooms,
  size,
  sizeUnit,
  source,
  labels,
  updateIndicator,
  statusText,
  statusTime,
  actions,
  onTrackProgress,
  onUpdateStatus,
}: PropertyTableRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      {/* Image & Title */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-medium">{title}</div>
            {location && <div className="text-sm text-muted-foreground">{location}</div>}
          </div>
        </div>
      </TableCell>

      {/* Price */}
      <TableCell className="font-semibold">{price}</TableCell>

      {/* Specs */}
      <TableCell className="text-muted-foreground">
        {bedrooms} beds • {size} {sizeUnit}
      </TableCell>

      {/* Source/Status */}
      <TableCell>
        {labels && labels.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {labels[0]}
          </Badge>
        )}
        {source && (
          <div className="text-xs text-muted-foreground mt-1">
            {source.name}
          </div>
        )}
        {statusText && (
          <div className="text-xs text-muted-foreground">
            {statusText} {statusTime}
          </div>
        )}
      </TableCell>

      {/* Update */}
      <TableCell className="text-sm text-muted-foreground">
        {updateIndicator}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-2 justify-end">
          {onTrackProgress && (
            <Button
              onClick={onTrackProgress}
              size="sm"
              variant="outline"
            >
              Track progress
            </Button>
          )}
          {onUpdateStatus && (
            <Button
              onClick={onUpdateStatus}
              size="sm"
              variant="outline"
            >
              Update status
            </Button>
          )}
          {actions.primary && !onTrackProgress && (
            <Button
              onClick={actions.primary.onClick}
              size="sm"
            >
              {actions.primary.label}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Remove from opportunity</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface PropertyTableProps {
  properties: PropertyTableRowProps[];
}

export function PropertyTable({ properties }: PropertyTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <PropertyTableRow key={property.id} {...property} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
