import { useState } from "react";
import { Search, Building2, Home, Map, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
}

const propertySources = [
  {
    id: "portals",
    title: "Portals",
    description: "Properties from Idealista, Fotocasa, etc.",
    icon: Building2,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: "my-properties",
    title: "Property Hub\nMy properties",
    description: "Your own property listings",
    icon: Home,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "other-properties",
    title: "Property Hub\nOther properties",
    description: "Search from property database",
    icon: Map,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "matches",
    title: "Matches",
    description: "AI-recommended properties",
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export function AddPropertyDialog({
  open,
  onOpenChange,
  opportunityId,
}: AddPropertyDialogProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSourceSelect = (sourceId: string) => {
    setSelectedSource(sourceId);
    // In real app, this would navigate to the source or open a sub-dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Property to Opportunity</DialogTitle>
          <DialogDescription>
            Choose where you want to add a property from
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {propertySources.map((source) => (
              <Card
                key={source.id}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                  selectedSource === source.id && "border-primary shadow-md"
                )}
                onClick={() => handleSourceSelect(source.id)}
              >
                <div className="space-y-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", source.bgColor)}>
                    <source.icon className={cn("w-6 h-6", source.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base whitespace-pre-line mb-1">
                      {source.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {selectedSource && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Continue to browse {propertySources.find(s => s.id === selectedSource)?.title.split('\n').join(' ').toLowerCase()}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Navigate to the selected source
                  onOpenChange(false);
                }}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
