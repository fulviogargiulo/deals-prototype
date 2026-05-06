import { useState, useEffect } from "react";
import { StandardModal, StandardModalFooter } from "@/components/ui/standard-modal";
import { Textarea } from "@/components/ui/textarea";

interface EditClientDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDescription: string;
  onSave: (description: string) => void;
}

const MAX_CHARACTERS = 2000;

export function EditClientDescriptionModal({ 
  open, 
  onOpenChange, 
  currentDescription,
  onSave 
}: EditClientDescriptionModalProps) {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current value when modal opens
  useEffect(() => {
    if (open) {
      setDescription(currentDescription || '');
    }
  }, [open, currentDescription]);

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARACTERS) {
      setDescription(text);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      onSave(description.trim());
      setIsSaving(false);
      onOpenChange(false);
    }, 1000);
  };

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSaving]);

  return (
    <StandardModal
      open={open}
      onOpenChange={handleClose}
      title="Client description"
      size="lg"
      preventClose={isSaving}
      footer={
        <StandardModalFooter
          label="Save"
          loadingLabel="Saving..."
          onClick={handleSave}
          isLoading={isSaving}
        />
      }
    >
      <div className="pt-1 space-y-2 pb-2">
        <Textarea
          value={description}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Add a description for this client..."
          className="min-h-[200px] resize-none rounded-xl text-base"
        />

        {/* Character counter */}
        <div className="flex items-center justify-end">
          <span className="text-sm text-muted-foreground">
            {description.length.toLocaleString()}/{MAX_CHARACTERS.toLocaleString()}
          </span>
        </div>
      </div>
    </StandardModal>
  );
}
