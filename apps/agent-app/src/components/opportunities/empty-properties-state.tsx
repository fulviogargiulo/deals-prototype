import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyPropertiesStateProps {
  onAddProperty: () => void;
}

export function EmptyPropertiesState({ onAddProperty }: EmptyPropertiesStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No properties saved yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Start adding properties from portals, your listings, or matches to help your client find their perfect home
        </p>
        <Button onClick={onAddProperty}>
          <Plus className="w-4 h-4 mr-2" />
          Add first property
        </Button>
      </CardContent>
    </Card>
  );
}
