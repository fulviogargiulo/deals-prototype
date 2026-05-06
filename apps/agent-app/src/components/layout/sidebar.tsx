import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Home, Users, Building, HelpCircle, KeySquare, Wrench, Eye, EyeOff, Save, Loader2, Trash2, Search, Bell, Sun, Play, Grid3X3, Handshake, Type, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useDevTools } from "@/contexts/dev-tools-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import huspyIcon from "@/assets/huspy-icon.svg";
import huspyWordmark from "@/assets/huspy-wordmark.svg";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home, activeIcon: Home },
  { title: "Clients", url: "/clients", icon: Users, activeIcon: Users },
  { title: "Opportunities", url: "/opportunities", icon: Handshake, activeIcon: Handshake },
  { title: "Deals", url: "/deals", icon: CheckCircle2, activeIcon: CheckCircle2 },
  
  { title: "Search properties", url: "/properties", icon: Building, activeIcon: Building },
  { title: "My Properties", url: "/my-properties", icon: KeySquare, activeIcon: KeySquare },
];

const bottomNavItems = [
  { title: "Help", url: "/help", icon: HelpCircle, activeIcon: HelpCircle },
];

export function AppSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { loadingDelay, setLoadingDelay, showSubtitles, setShowSubtitles, skeletonTargets, toggleSkeletonTarget, headerVisibility, toggleHeaderVisibility, saveAsDefaults, showSplash, triggerSplash, showGridOverlay, toggleGridOverlay, headerTitleMode, setHeaderTitleMode } = useDevTools();
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(loadingDelay.toString());
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) => {
    return cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group relative",
      "outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      isActive(path)
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/70 hover:bg-muted hover:text-foreground"
    );
  };

  const getIconClasses = (path: string) => {
    return cn(
      "w-5 h-5 transition-all duration-200 flex-shrink-0",
      isActive(path) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
    );
  };

  const handleSetDelay = (delay: number) => {
    setLoadingDelay(delay);
    setInputValue(delay.toString());
  };

  const handleApplyCustomDelay = () => {
    const delay = parseInt(inputValue, 10);
    if (!isNaN(delay) && delay >= 0) {
      setLoadingDelay(delay);
    }
  };

  // Sidebar content - reused in both mobile Sheet and desktop fixed sidebar
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header with Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <img 
            src={huspyIcon} 
            alt="Huspy" 
            className="w-11 h-11"
          />
          <div className="flex items-center gap-2">
            <img 
              src={huspyWordmark} 
              alt="Huspy" 
              className="h-[18px] object-contain"
            />
            <span className="text-base font-medium text-foreground">
              Agents
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3">
        <nav className="space-y-1">
          {mainNavItems.map((item, index) => (
            <div
              key={item.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <NavLink 
                to={item.url} 
                className={getNavClasses(item.url)}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
              >
                {(() => {
                  const IconComponent = isActive(item.url) ? item.activeIcon : item.icon;
                  return <IconComponent className={getIconClasses(item.url)} />;
                })()}
                <span className="transition-all duration-200">
                  {item.title}
                </span>
              </NavLink>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className="p-3 mt-auto border-t border-border/50">
        <div className="space-y-1">
          {/* Dev Tools Button */}
          <Popover open={devToolsOpen} onOpenChange={setDevToolsOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group relative w-full",
                  "outline-none border-none focus:outline-none focus:border-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  devToolsOpen 
                    ? "bg-amber-500/10 text-amber-600" 
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <Wrench className={cn(
                  "w-5 h-5 transition-all duration-200 flex-shrink-0",
                  devToolsOpen ? "text-amber-600" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="transition-all duration-200">
                  Dev Tools
                </span>
                {(loadingDelay > 0 || !showSubtitles) && (
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full">
                    {loadingDelay > 0 ? `${loadingDelay}ms` : ''}
                    {loadingDelay > 0 && !showSubtitles ? ' · ' : ''}
                    {!showSubtitles ? 'No subs' : ''}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-72 max-h-[80vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Dev Tools
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Configure development settings
                  </p>
                </div>

                {/* Grid Overlay Toggle */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="show-grid" className="text-sm cursor-pointer">
                      Show grid overlay
                    </Label>
                  </div>
                  <Switch
                    id="show-grid"
                    checked={showGridOverlay}
                    onCheckedChange={toggleGridOverlay}
                  />
                </div>

                {/* Subtitles Toggle */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    {showSubtitles ? (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="show-subtitles" className="text-sm cursor-pointer">
                      Show subtitles
                    </Label>
                  </div>
                  <Switch
                    id="show-subtitles"
                    checked={showSubtitles}
                    onCheckedChange={setShowSubtitles}
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Loading Simulation</h4>
                  <p className="text-xs text-muted-foreground">
                    Set a delay to simulate loading states
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Quick presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 500, 1000, 2000, 3000].map((delay) => (
                      <Button
                        key={delay}
                        variant={loadingDelay === delay ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSetDelay(delay)}
                        className="text-xs"
                      >
                        {delay === 0 ? "Instant" : `${delay}ms`}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-delay" className="text-xs text-muted-foreground">
                    Custom delay (ms)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-delay"
                      type="number"
                      min="0"
                      step="100"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="e.g. 1500"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyCustomDelay();
                        }
                      }}
                    />
                    <Button onClick={handleApplyCustomDelay} size="sm">
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Skeleton Targets */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Skeleton Targets</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose which pages show loading skeletons
                  </p>
                  <div className="space-y-2 pt-1">
                    {[
                      { key: 'clients' as const, label: 'Clients' },
                      { key: 'clientDetails' as const, label: 'Client Details' },
                      { key: 'properties' as const, label: 'Properties' },
                      { key: 'propertyDetails' as const, label: 'Property Details' },
                      { key: 'myProperties' as const, label: 'My Properties' },
                      { key: 'myPropertyDetails' as const, label: 'My Property Details' },
                      { key: 'opportunities' as const, label: 'Opportunities' },
                      { key: 'opportunityDetails' as const, label: 'Opportunity Details' },
                      { key: 'schedule' as const, label: 'Schedule' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`skeleton-${key}`}
                          checked={skeletonTargets[key]}
                          onCheckedChange={() => toggleSkeletonTarget(key)}
                        />
                        <Label 
                          htmlFor={`skeleton-${key}`} 
                          className="text-xs cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Header Visibility */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Header Elements</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Toggle visibility of header elements
                  </p>
                  <div className="space-y-2 pt-1">
                    {[
                      { key: 'showSearch' as const, label: 'Search Bar', icon: Search },
                      { key: 'showNotifications' as const, label: 'Notifications', icon: Bell },
                      { key: 'showThemeToggle' as const, label: 'Theme Toggle', icon: Sun },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`header-${key}`}
                          checked={headerVisibility[key]}
                          onCheckedChange={() => toggleHeaderVisibility(key)}
                        />
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <Label htmlFor={`header-${key}`} className="text-xs cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Header Title Mode */}
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="header-title-mode" className="text-sm cursor-pointer">
                      Tracked titles
                    </Label>
                  </div>
                  <Switch
                    id="header-title-mode"
                    checked={headerTitleMode === 'tracked-title'}
                    onCheckedChange={(checked) => setHeaderTitleMode(checked ? 'tracked-title' : 'breadcrumbs')}
                  />
                </div>

                {/* Splash Screen Toggle */}
                <div className="flex items-center justify-between py-2 border-t">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="show-splash" className="text-sm cursor-pointer">
                      Show splash on load
                    </Label>
                  </div>
                  <Switch
                    id="show-splash"
                    checked={showSplash}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        triggerSplash();
                      }
                    }}
                  />
                </div>

                {loadingDelay > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-amber-600">
                      ⚡ Loading delay active: {loadingDelay}ms
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      saveAsDefaults();
                      toast.success("Dev tools defaults saved!");
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as defaults
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("dev-tools-defaults");
                      toast.success("Defaults cleared! Refresh to apply.");
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {bottomNavItems.map((item) => (
            <NavLink 
              key={item.title} 
              to={item.url} 
              className={getNavClasses(item.url)}
              onClick={() => {
                // Close sidebar on mobile when navigating
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              {(() => {
                const IconComponent = isActive(item.url) ? item.activeIcon : item.icon;
                return <IconComponent className={getIconClasses(item.url)} />;
              })()}
              <span className="transition-all duration-200">
                {item.title}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet - full page like profile menu, only open on mobile */}
      <Sheet open={isMobile && !isCollapsed} onOpenChange={(open) => {
        if (!open) toggleSidebar();
      }}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop fixed sidebar - use transform for smooth animation */}
      {!isMobile && (
        <div className={cn(
          "h-screen bg-white/80 dark:bg-background/80 backdrop-blur-xl flex-col fixed left-0 top-0 z-50 w-64 flex transition-transform duration-300 ease-in-out border-r border-border/50",
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        )}>
          {sidebarContent}
        </div>
      )}
    </>
  );
}
