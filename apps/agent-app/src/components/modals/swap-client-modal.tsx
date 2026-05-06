import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ClientSelectorWithCreate } from "@/components/clients/client-selector-with-create";
import { WizardModal, WizardStep } from "@/components/ui/standard-modal";

interface SwapClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentClientId: string;
  onSelectClient: (clientId: string, clientName: string, clientPhone: string) => void;
}

type DevScenario = 'default' | 'no-clients' | 'no-results' | 'few-clients' | 'many-clients' | 'loading';

// Fixed height for select view (scrollable list)
const SELECT_VIEW_HEIGHT = 600;

export function SwapClientModal({ 
  open, 
  onOpenChange, 
  currentClientId,
  onSelectClient,
}: SwapClientModalProps) {
  const [currentView, setCurrentView] = useState<'select' | 'create'>('select');
  const [devScenario, setDevScenario] = useState<DevScenario>('default');
  const [goBackToSelect, setGoBackToSelect] = useState<(() => void) | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(SELECT_VIEW_HEIGHT);

  // Map view to step number for wizard
  const currentStep = currentView === 'select' ? 1 : 2;

  // Handle content height changes from child component
  const handleContentHeightChange = useCallback((height: number | null) => {
    if (height === null) {
      // Select view - use fixed height
      setContentHeight(SELECT_VIEW_HEIGHT);
    } else {
      // Create view - use measured height + header (~90px) + progress bar + bottom padding + extra buffer
      setContentHeight(height + 160);
    }
  }, []);

  const handleSelectClient = (clientId: string, clientName: string, clientPhone: string) => {
    onSelectClient(clientId, clientName, clientPhone);
    onOpenChange(false);
  };

  // Reset view when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentView('select');
      setContentHeight(SELECT_VIEW_HEIGHT);
    }
    onOpenChange(isOpen);
  };

  const handleBack = () => {
    if (goBackToSelect) {
      goBackToSelect();
    }
  };

  // Dev tools dropdown for header actions (only show on select step)
  const headerActions = currentView === 'select' ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Dev Tool - Scenarios</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setDevScenario('default')}
          className={devScenario === 'default' ? 'bg-accent' : ''}
        >
          Default (all clients)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDevScenario('no-clients')}
          className={devScenario === 'no-clients' ? 'bg-accent' : ''}
        >
          No clients yet
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDevScenario('no-results')}
          className={devScenario === 'no-results' ? 'bg-accent' : ''}
        >
          No clients found (search)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDevScenario('few-clients')}
          className={devScenario === 'few-clients' ? 'bg-accent' : ''}
        >
          Few clients (3)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDevScenario('many-clients')}
          className={devScenario === 'many-clients' ? 'bg-accent' : ''}
        >
          Many clients (scrollable)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setDevScenario('loading')}
          className={devScenario === 'loading' ? 'bg-accent' : ''}
        >
          Loading state
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <WizardModal
      open={open}
      onOpenChange={handleOpenChange}
      currentStep={currentStep}
      totalSteps={2}
      stepTitles={['Select new client', 'Add new client']}
      stepDescriptions={[
        'Search or add a new client to assign.',
        "Enter the client's contact information."
      ]}
      size="md"
      onBack={handleBack}
      showProgressBar={false}
      fixedHeight={contentHeight}
      headerActions={headerActions}
      hideFooter
    >
      <div className="flex-1 flex flex-col min-h-0 pb-4">
        <ClientSelectorWithCreate
          currentClientId={currentClientId}
          onSelectClient={handleSelectClient}
          onViewChange={setCurrentView}
          onBackCallback={(cb) => setGoBackToSelect(() => cb)}
          onContentHeightChange={handleContentHeightChange}
          size="compact"
          maxHeight="100%"
          className="h-full"
          devScenario={devScenario}
          hideFormHeader
        />
      </div>
    </WizardModal>
  );
}
