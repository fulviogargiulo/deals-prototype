import { SidebarProvider } from "@/hooks/use-sidebar";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { useCommandShortcuts } from "@/hooks/use-command";
import { useSidebar } from "@/hooks/use-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { GridOverlay } from "@/components/dev-tools/grid-overlay";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  useCommandShortcuts();
  
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex w-full bg-background max-w-full overflow-x-clip">
        <AppSidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 min-w-0",
            // On mobile: no margin (sidebar is overlay)
            // On desktop: margin when sidebar is open
            isMobile ? "ml-0" : (isCollapsed ? "ml-0" : "ml-64")
          )}
        >
          <TopBar />
          <main className="flex-1 pt-16 animate-fade-in bg-background">
            {children}
          </main>
        </div>
        <GridOverlay />
      </div>
    );
}