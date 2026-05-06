import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyPropertiesState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-3">No properties found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          We couldn't find any properties matching your current filters. Try adjusting your search criteria or clearing some filters.
        </p>
      </CardContent>
    </Card>
  );
}
