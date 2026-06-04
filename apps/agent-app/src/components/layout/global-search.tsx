import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Target, Building, CheckSquare, FileText, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import { 
  mockClients, 
  mockOpportunities, 
  mockTasks, 
  mockDocuments, 
  getClientById, 
  getOpportunityById 
} from "@/data/mockData";
import { GlobalSearchResult } from "@/types";

interface GlobalSearchProps {
  className?: string;
}

function AnimatedPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const searchCategories = [
    'properties',
    'opportunities', 
    'clients',
    'tasks',
    'documents',
    'contacts'
  ];

  // Create array with duplicated first item for endless scroll
  const displayCategories = [...searchCategories, searchCategories[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex === searchCategories.length) {
          // We're showing the duplicate first item, prepare to loop
          setTimeout(() => {
            setIsTransitioning(false);
            setCurrentIndex(0);
            setTimeout(() => setIsTransitioning(true), 50);
          }, 500); // Wait for transition to complete
        }
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [searchCategories.length]);

  return (
    <div className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center text-muted-foreground">
      <span>Search for&nbsp;</span>
      <div className="overflow-hidden h-6">
        <div 
          className={`${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ 
            transform: `translateY(-${currentIndex * 24}px)`,
          }}
        >
          {displayCategories.map((category, index) => (
            <div key={`${category}-${index}`} className="h-6 flex items-center">
              {category}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDefaultState, setShowDefaultState] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const defaultSuggestions = [
    { 
      type: 'recent-searches', 
      title: 'Recent Searches', 
      items: [
        { id: 'search-1', title: 'Madrid properties', subtitle: 'Searched 2 hours ago', type: 'search' },
        { id: 'search-2', title: 'John Smith contact', subtitle: 'Searched yesterday', type: 'search' },
        { id: 'search-3', title: 'Rental contracts', subtitle: 'Searched 3 days ago', type: 'search' }
      ]
    },
    { 
      type: 'recently-opened', 
      title: 'Recently Opened', 
      items: [
        { id: '1', title: 'Michael Scott', subtitle: 'Client • Verified', type: 'client' },
        { id: '2', title: 'House in Scranton', subtitle: 'Opportunity • $250K-$300K', type: 'opportunity' },
        { id: '1', title: 'Call Creed Bratton for verification', subtitle: 'Task • Due Jan 25', type: 'task' }
      ]
    },
    { 
      type: 'trending', 
      title: 'Trending Properties', 
      items: [
        { id: '1', title: 'Apartment in La Latina', subtitle: 'Property • €450K-€650K • Hot', type: 'property' },
        { id: '3', title: 'Apartment Downtown', subtitle: 'Property • $1200-$1800 • New', type: 'property' },
        { id: '5', title: 'Villa with Pool in Suburbs', subtitle: 'Property • €800K-€950K • Popular', type: 'property' }
      ]
    }
  ];

  // Flatten all items for keyboard navigation
  const allItems = defaultSuggestions.flatMap(section => section.items);

  // Handle Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDefaultState(true);
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, GlobalSearchResult[]>);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      if (!showDefaultState) {
        setIsOpen(false);
      }
      return;
    }

    setShowDefaultState(false);

    const searchResults: GlobalSearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search clients
    mockClients.forEach(client => {
      if (
        client.fullName.toLowerCase().includes(searchTerm) ||
        client.phone?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm)
      ) {
        const opportunityCount = mockOpportunities.filter(o => o.clientId === client.id).length;
        searchResults.push({
          id: client.id,
          type: 'client',
          title: client.fullName,
          subtitle: client.email || client.phone || 'No contact info',
          metadata: `${client.verificationStatus} • ${opportunityCount} opportunities`,
        });
      }
    });

    // Search opportunities
    mockOpportunities.forEach(opportunity => {
      const client = getClientById(opportunity.clientId);
      if (
        opportunity.title.toLowerCase().includes(searchTerm) ||
        opportunity.neighborhoods.some(n => n.toLowerCase().includes(searchTerm)) ||
        client?.fullName.toLowerCase().includes(searchTerm)
      ) {
        const priceText = opportunity.priceRange 
          ? `${opportunity.priceRange.currency}${opportunity.priceRange.min.toLocaleString()} - ${opportunity.priceRange.currency}${opportunity.priceRange.max.toLocaleString()}`
          : '';
        
        searchResults.push({
          id: opportunity.id,
          type: 'opportunity',
          title: opportunity.title,
          subtitle: client?.fullName || 'Unknown client',
          metadata: `${opportunity.type} • ${priceText}`,
        });
      }
    });

    // Search tasks
    mockTasks.forEach(task => {
      const client = task.clientId ? getClientById(task.clientId) : null;
      const opportunity = task.opportunityId ? getOpportunityById(task.opportunityId) : null;
      
      if (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        client?.fullName.toLowerCase().includes(searchTerm) ||
        opportunity?.title.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: client?.fullName || opportunity?.title || 'No relation',
          metadata: `${task.status} • ${task.priority} priority`,
        });
      }
    });

    // Search documents
    mockDocuments.forEach(document => {
      const client = document.clientId ? getClientById(document.clientId) : null;
      const opportunity = document.opportunityId ? getOpportunityById(document.opportunityId) : null;
      
      if (
        document.name.toLowerCase().includes(searchTerm) ||
        client?.fullName.toLowerCase().includes(searchTerm) ||
        opportunity?.title.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          id: document.id,
          type: 'document',
          title: document.name,
          subtitle: client?.fullName || opportunity?.title || 'No relation',
          metadata: `${document.type} • ${(document.size / 1024 / 1024).toFixed(1)}MB`,
        });
      }
    });

    setResults(searchResults.slice(0, 12));
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(0);
  }, [query]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalItems = showDefaultState ? allItems.length : results.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
          case 'Enter':
            e.preventDefault();
            if (showDefaultState && allItems[selectedIndex]) {
              const item = allItems[selectedIndex];
              if (item.type === 'search') {
                setQuery(item.title);
              } else {
                // Navigate to specific item details
                handleResultClick({
                  id: item.id,
                  type: item.type as 'client' | 'opportunity' | 'property' | 'task' | 'document',
                  title: item.title,
                  subtitle: item.subtitle
                });
              }
            } else if (results[selectedIndex]) {
              handleResultClick(results[selectedIndex]);
            }
            break;
        case 'Escape':
          setIsOpen(false);
          setShowDefaultState(false);
          inputRef.current?.blur();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, showDefaultState, allItems, navigate]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="w-4 h-4" />;
      case 'opportunity':
        return <Target className="w-4 h-4" />;
      case 'property':
        return <Building className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'client':
        return 'Clients';
      case 'opportunity':
        return 'Opportunities';
      case 'property':
        return 'Properties';
      case 'task':
        return 'Tasks';
      case 'document':
        return 'Documents';
      default:
        return type;
    }
  };

  const handleResultClick = (result: GlobalSearchResult) => {
    switch (result.type) {
      case 'client':
        navigate(`/clients/${result.id}`);
        break;
      case 'opportunity':
        navigate(`/opportunities/${result.id}`);
        break;
      case 'property':
        navigate(`/properties/${result.id}`);
        break;
      case 'task':
        navigate(`/tasks/${result.id}`);
        break;
      case 'document':
        navigate('/documents');
        break;
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className={cn("relative rounded-xl border bg-background transition-all duration-200 hover:border-primary/50 focus-within:border-primary", isOpen && "rounded-b-none border-b-0")}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
        {!query && <AnimatedPlaceholder />}
        <Input
          ref={inputRef}
          placeholder=""
          className={cn(
            "pl-12 pr-16 h-11 text-base bg-transparent border-0",
            "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2) {
              setIsOpen(true);
            } else {
              setShowDefaultState(true);
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow clicks on dropdown items
            setTimeout(() => {
              setShowDefaultState(false);
            }, 150);
          }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-2 py-1 text-xs bg-muted rounded border">⌘K</kbd>
        </div>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 shadow-xl border rounded-t-none rounded-b-xl animate-fade-in overflow-hidden bg-card">
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {showDefaultState && query.length < 2 ? (
              // Default suggestions with intelligent content
              <div>
                {defaultSuggestions.map((section, sectionIndex) => (
                  <div key={section.type}>
                    <div className="px-3 py-2 bg-muted/20 border-b">
                      <h3 className="font-medium text-xs text-muted-foreground">
                        {section.title}
                      </h3>
                    </div>
                    <div className="divide-y divide-border/30">
                      {section.items.map((item, index) => {
                        const globalIndex = sectionIndex * 3 + index; // Assuming 3 items per section
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <div
                            key={item.id}
                            ref={isSelected ? selectedItemRef : null}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150",
                              "hover:bg-muted/40",
                              isSelected && "bg-primary/5 border-l-2 border-l-primary"
                            )}
                            onClick={() => {
                              if (section.type === 'recent-searches') {
                                setQuery(item.title);
                              } else {
                                // Navigate to specific item details
                                handleResultClick({
                                  id: item.id,
                                  type: item.type as 'client' | 'opportunity' | 'property' | 'task' | 'document',
                                  title: item.title,
                                  subtitle: item.subtitle
                                });
                              }
                              setIsOpen(false);
                              setShowDefaultState(false);
                            }}
                          >
                            <div className={cn(
                              "text-muted-foreground transition-colors duration-150",
                              isSelected && "text-primary"
                            )}>
                              {section.type === 'recent-searches' ? (
                                <Search className="w-4 h-4" />
                              ) : (
                                getResultIcon(item.type)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium truncate text-sm transition-colors duration-150",
                                  isSelected && "text-primary"
                                )}>
                                  {item.title}
                                </span>
                                {section.type === 'trending' && (
                                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                    🔥
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.keys(groupedResults).length > 0 ? (
              // Search results
              <>
                 {Object.entries(groupedResults).map(([type, typeResults]) => (
                   <div key={type} className="border-b last:border-b-0">
                     <div className="px-3 py-2 bg-muted/20 border-b">
                       <div className="flex items-center gap-2">
                         {getResultIcon(type)}
                         <h3 className="font-medium text-xs text-muted-foreground">
                           {getTypeTitle(type)} ({typeResults.length})
                         </h3>
                       </div>
                     </div>
                     
                     <div className="divide-y divide-border/30">
                       {typeResults.map((result, index) => {
                         const globalIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                         const isSelected = globalIndex === selectedIndex;
                         
                          return (
                            <div
                              key={`${result.type}-${result.id}`}
                              ref={isSelected ? selectedItemRef : null}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-150",
                                "hover:bg-muted/40",
                                isSelected && "bg-primary/5 border-l-2 border-l-primary"
                              )}
                              onClick={() => handleResultClick(result)}
                           >
                             <div className={cn(
                               "text-muted-foreground transition-colors duration-150",
                               isSelected && "text-primary"
                             )}>
                               {getResultIcon(result.type)}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <span className={cn(
                                   "font-medium truncate text-sm transition-colors duration-150",
                                   isSelected && "text-primary"
                                 )}>
                                   {result.title}
                                 </span>
                                 <StatusBadge variant="tag" className="text-xs capitalize shrink-0">
                                   {result.type}
                                 </StatusBadge>
                               </div>
                               <div className="text-xs text-muted-foreground truncate">
                                 {result.subtitle}
                               </div>
                               {result.metadata && (
                                 <div className="text-xs text-muted-foreground/80 truncate">
                                   {result.metadata}
                                 </div>
                               )}
                             </div>
                             {isSelected && (
                               <div className="text-primary">
                                 <Command className="w-4 h-4" />
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ))}
                 
                 {results.length >= 12 && (
                   <div className="px-3 py-2 text-center bg-muted/10 border-t">
                     <span className="text-xs text-muted-foreground">
                       Showing first 12 results. Try a more specific search.
                     </span>
                   </div>
                 )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}