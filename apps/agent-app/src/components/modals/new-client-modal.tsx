import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { NewClientForm } from "@/components/clients/new-client-form";
import { DuplicateClientModal } from "@/components/modals/duplicate-client-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OpportunityType } from "@/types";

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  initialData?: {
    fullName: string;
    phone: string;
    email?: string;
  };
  onSave?: (data: { fullName: string; phone: string; email?: string }) => Promise<void>;
  onClientCreated?: (clientId: string, clientName: string, clientPhone: string, opportunityType: OpportunityType) => void;
}

type ErrorMode = 'none' | 'required' | 'invalid' | 'phone-exists' | 'email-exists' | 'both-exist';

export function NewClientModal({ 
  open, 
  onOpenChange, 
  mode = 'create', 
  initialData, 
  onSave, 
  onClientCreated 
}: NewClientModalProps) {
  const navigate = useNavigate();
  const [errorMode, setErrorMode] = useState<ErrorMode>('none');
  const [formState, setFormState] = useState({ isSaving: false, canSubmit: true });
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  const handleSuccess = (clientId: string, clientName: string, clientPhone: string, opportunityType: OpportunityType) => {
    if (onClientCreated) {
      onClientCreated(clientId, clientName, clientPhone, opportunityType);
    }
    onOpenChange(false);
  };

  const handleSubmitClick = () => {
    if (submitRef.current) {
      submitRef.current();
    }
  };

  const handleGoToExistingClient = () => {
    setShowDuplicateModal(false);
    onOpenChange(false);
    // Navigate to the existing client (using mock client ID for demo)
    navigate('/clients/1');
  };

  const handleEditClientDetails = () => {
    // Just close the duplicate modal, keep the new client modal open
    setShowDuplicateModal(false);
  };

  const devToolsDropdown = mode === 'create' ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Settings className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Error States (Dev Tool)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setErrorMode('none')}
          className={errorMode === 'none' ? 'bg-accent' : ''}
        >
          No Errors
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setErrorMode('required')}
          className={errorMode === 'required' ? 'bg-accent' : ''}
        >
          Required Field Errors
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setErrorMode('invalid')}
          className={errorMode === 'invalid' ? 'bg-accent' : ''}
        >
          Invalid Input Errors
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setErrorMode('phone-exists')}
          className={errorMode === 'phone-exists' ? 'bg-accent' : ''}
        >
          Phone Already Exists
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setErrorMode('email-exists')}
          className={errorMode === 'email-exists' ? 'bg-accent' : ''}
        >
          Email Already Exists
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setErrorMode('both-exist')}
          className={errorMode === 'both-exist' ? 'bg-accent' : ''}
        >
          Both Already Exist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other States</DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => setShowDuplicateModal(true)}
        >
          Show Duplicate Client Modal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  return (
    <>
      <StandardModal
        open={open}
        onOpenChange={onOpenChange}
        title={mode === 'edit' ? 'Edit client' : 'Add new client'}
        description={mode === 'edit' ? 'Update the client details below.' : "Enter the client's contact information."}
        size="md"
        headerActions={devToolsDropdown}
        preventClose={formState.isSaving}
        footer={
          <StandardModalFooter
            label={mode === 'edit' ? 'Save changes' : 'Create client'}
            loadingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
            onClick={handleSubmitClick}
            isLoading={formState.isSaving}
          />
        }
      >
        <NewClientForm
          mode={mode}
          initialData={initialData}
          onSave={onSave}
          onSuccess={handleSuccess}
          showCancelButton={false}
          showDevTools={false}
          showHeader={false}
          hideSubmitButton={true}
          submitRef={submitRef}
          onFormStateChange={setFormState}
          devErrorMode={errorMode}
        />
      </StandardModal>

      <DuplicateClientModal
        open={showDuplicateModal}
        onOpenChange={setShowDuplicateModal}
        onGoToExisting={handleGoToExistingClient}
        onEditDetails={handleEditClientDetails}
      />
    </>
  );
}
