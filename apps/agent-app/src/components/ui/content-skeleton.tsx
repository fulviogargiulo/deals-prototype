import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ContentSkeletonProps {
  count?: number;
  variant?: "card" | "table-row" | "property-card" | "client-card" | "schedule-group";
}

export function ContentSkeleton({ count = 4, variant = "card" }: ContentSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "property-card") {
    return (
      <>
        {items.map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (variant === "client-card") {
    return (
      <>
        {items.map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (variant === "table-row") {
    return (
      <>
        {items.map((i) => (
          <tr key={i} className="border-b">
            <td className="p-4"><Skeleton className="h-4 w-32" /></td>
            <td className="p-4"><Skeleton className="h-4 w-24" /></td>
            <td className="p-4"><Skeleton className="h-4 w-40" /></td>
            <td className="p-4"><Skeleton className="h-4 w-20" /></td>
            <td className="p-4"><Skeleton className="h-4 w-24" /></td>
          </tr>
        ))}
      </>
    );
  }

  if (variant === "schedule-group") {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </>
    );
  }

  // Default card skeleton
  return (
    <>
      {items.map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      ))}
    </>
  );
}
