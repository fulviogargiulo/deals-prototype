import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/data-context";

// Route label mapping
const routeLabels: Record<string, string> = {
  "": "Home",
  "dashboard": "Dashboard",
  "clients": "Clients",
  "opportunities": "Opportunities",
  "properties": "Properties",
  "my-properties": "My Properties",
  "tasks": "Tasks",
  "documents": "Documents",
  "settings": "Settings",
  "help": "Help",
};

interface HeaderBreadcrumbsProps {
  transparentHeader?: boolean;
  isScrolled?: boolean;
}

export function HeaderBreadcrumbs({ transparentHeader, isScrolled }: HeaderBreadcrumbsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clients, opportunities, getClientById, getOpportunityById } = useData();

  const isTransparentMode = transparentHeader && !isScrolled;

  // Build breadcrumb segments from pathname
  const segments = location.pathname.split("/").filter(Boolean);

  const breadcrumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/" },
  ];

  // Build path progressively
  let currentPath = "";
  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    // Check if it's a known route
    if (routeLabels[segment]) {
      breadcrumbs.push({ label: routeLabels[segment], path: currentPath });
    } else {
      // It's likely a dynamic ID — try to resolve a name
      const parentSegment = segments[segments.indexOf(segment) - 1];
      let label = segment;

      if (parentSegment === "clients") {
        const client = getClientById(segment);
        if (client) label = client.fullName;
      } else if (parentSegment === "opportunities") {
        const opp = getOpportunityById(segment);
        if (opp) label = opp.title || opp.type;
      }

      breadcrumbs.push({ label, path: currentPath });
    }
  });

  // Don't show breadcrumbs on home page
  if (segments.length === 0) return null;

  return (
    <div className="flex items-center gap-1 min-w-0">
      {/* Back / Forward arrows */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className={cn(
            "h-7 w-7 p-0 rounded-lg transition-all duration-500",
            isTransparentMode
              ? "hover:bg-white/15 text-white/70 hover:text-white"
              : "hover:bg-muted/60 text-fg-secondary hover:text-foreground"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(1)}
          className={cn(
            "h-7 w-7 p-0 rounded-lg transition-all duration-500",
            isTransparentMode
              ? "hover:bg-white/15 text-white/70 hover:text-white"
              : "hover:bg-muted/60 text-fg-secondary hover:text-foreground"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Breadcrumb trail */}
      <nav className="flex items-center gap-1 min-w-0 ml-1.5">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={crumb.path} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    "h-3 w-3 shrink-0 transition-colors duration-500",
                    isTransparentMode ? "text-white/40" : "text-fg-secondary/50"
                  )}
                />
              )}
              {isLast ? (
                <span
                  className={cn(
                    "text-sm font-semibold truncate transition-colors duration-500",
                    isTransparentMode ? "text-white" : "text-foreground"
                  )}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    "text-sm font-normal truncate transition-colors duration-500 hover:underline",
                    isTransparentMode
                      ? "text-white/60 hover:text-white/80"
                      : "text-fg-secondary hover:text-foreground"
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
