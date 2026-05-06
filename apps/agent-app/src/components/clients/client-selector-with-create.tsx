import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ClientSelector, ClientSelectorDevScenario } from "./client-selector";
import { NewClientForm } from "./new-client-form";

export type { ClientSelectorDevScenario };

interface ClientSelectorWithCreateProps {
  selectedClientId?: string;
  currentClientId?: string;
  /** Pre-selected client to show even if not in the client list */
  preSelectedClient?: { id: string; name: string; phone: string };
  onSelectClient: (clientId: string, clientName: string, clientPhone: string) => void;
  onDeselectClient?: () => void;
  onViewChange?: (view: 'select' | 'create') => void;
  onBackCallback?: (callback: (() => void) | null) => void;
  onContentHeightChange?: (height: number | null) => void;
  /** Show opportunity type icons next to each client */
  showOpportunityIcons?: boolean;
  size?: 'default' | 'compact';
  className?: string;
  maxHeight?: string;
  devScenario?: ClientSelectorDevScenario;
  hideFormHeader?: boolean;
}

// Parse search query into first name and last name
function parseSearchName(searchQuery: string): { firstName: string; lastName: string } {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    // No space - just first name
    return { firstName: trimmed, lastName: '' };
  }
  
  // Has space - first word is first name, rest is last name
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim()
  };
}

export function ClientSelectorWithCreate({
  selectedClientId,
  currentClientId,
  preSelectedClient,
  onSelectClient,
  onDeselectClient,
  onViewChange,
  onBackCallback,
  onContentHeightChange,
  showOpportunityIcons = false,
  size = 'default',
  className,
  maxHeight = '400px',
  devScenario = 'default',
  hideFormHeader = false
}: ClientSelectorWithCreateProps) {
  const [view, setView] = useState<'select' | 'create'>('select');
  const [prefillName, setPrefillName] = useState({ firstName: '', lastName: '' });
  const createViewRef = useRef<HTMLDivElement>(null);

  const handleViewChange = useCallback((newView: 'select' | 'create') => {
    setView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  const handleAddNewClient = useCallback((searchQuery: string) => {
    const parsed = parseSearchName(searchQuery);
    setPrefillName(parsed);
    handleViewChange('create');
  }, [handleViewChange]);

  const handleClientCreated = (clientId: string, clientName: string, clientPhone: string) => {
    onSelectClient(clientId, clientName, clientPhone);
    handleViewChange('select');
    setPrefillName({ firstName: '', lastName: '' });
  };

  const handleCancel = useCallback(() => {
    handleViewChange('select');
    setPrefillName({ firstName: '', lastName: '' });
  }, [handleViewChange]);

  // Expose the back/cancel callback to parent
  useEffect(() => {
    if (onBackCallback) {
      onBackCallback(view === 'create' ? handleCancel : null);
    }
  }, [view, handleCancel, onBackCallback]);

  // Report content height changes
  useEffect(() => {
    if (onContentHeightChange) {
      if (view === 'create') {
        // Measure the create form content after a short delay for rendering
        const timer = setTimeout(() => {
          if (createViewRef.current) {
            const height = createViewRef.current.scrollHeight;
            onContentHeightChange(height);
          }
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Select view uses fixed height
        onContentHeightChange(null);
      }
    }
  }, [view, onContentHeightChange]);

  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-smooth",
        view === 'select' ? "h-full flex flex-col" : "",
        className
      )} 
      style={{ minHeight: 0 }}
    >
      {/* Select View */}
      <div 
        className={cn(
          "transition-all duration-500 ease-out",
          view === 'select' 
            ? "opacity-100 translate-x-0 h-full flex flex-col" 
            : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
        )}
        style={{ minHeight: view === 'select' ? 0 : undefined }}
      >
        <ClientSelector
          selectedClientId={selectedClientId}
          currentClientId={currentClientId}
          preSelectedClient={preSelectedClient}
          onSelectClient={onSelectClient}
          onDeselectClient={onDeselectClient}
          onAddNewClient={handleAddNewClient}
          showOpportunityIcons={showOpportunityIcons}
          size={size}
          maxHeight={maxHeight}
          className={cn("h-full", view === 'select' ? '' : 'invisible')}
          devScenario={devScenario}
        />
      </div>

      {/* Create View */}
      <div 
        ref={createViewRef}
        className={cn(
          "transition-all duration-500 ease-out",
          view === 'create' 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-full absolute inset-0 pointer-events-none h-0 overflow-hidden"
        )}
      >
        <NewClientForm
          onSuccess={handleClientCreated}
          onCancel={hideFormHeader ? undefined : handleCancel}
          showCancelButton={!hideFormHeader}
          showDevTools={!hideFormHeader}
          showHeader={!hideFormHeader}
          initialFirstName={prefillName.firstName}
          initialLastName={prefillName.lastName}
        />
      </div>
    </div>
  );
}
