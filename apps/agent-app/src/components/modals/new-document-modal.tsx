import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { useToast } from "@/hooks/use-toast";
import { getAllClientsWithOpportunities, mockOpportunities } from "@/data/mockData";
import { DocumentType } from "@/types";
import { Upload, FileText, X } from "lucide-react";

interface NewDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDocumentModal({ open, onOpenChange }: NewDocumentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '' as DocumentType,
    clientId: '',
    opportunityId: '',
    file: null as File | null
  });

  const { toast } = useToast();
  const clients = getAllClientsWithOpportunities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally upload the document
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
    
    // Reset form
    setFormData({
      name: '',
      type: '' as DocumentType,
      clientId: '',
      opportunityId: '',
      file: null
    });
    
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file, name: file.name });
    }
  };

  // Filter opportunities by selected client
  const clientOpportunities = formData.clientId 
    ? mockOpportunities.filter(opp => opp.clientId === formData.clientId)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-lg p-0">
        <DialogHeader className="pl-6 pr-4 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Upload New Document</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file" className="cursor-pointer">
                {formData.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{formData.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, XLS, JPG, PNG (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <FloatingLabelInput
            label="Document Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <FloatingLabelSelect 
            label="Document Type"
            required
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value as DocumentType })}
            options={[
              { value: "id", label: "ID Document" },
              { value: "contract", label: "Contract" },
              { value: "financial", label: "Financial Document" },
              { value: "property", label: "Property Document" },
              { value: "legal", label: "Legal Document" },
              { value: "other", label: "Other" },
            ]}
          />

          <FloatingLabelSelect 
            label="Related Client"
            value={formData.clientId} 
            onValueChange={(value) => setFormData({ ...formData, clientId: value, opportunityId: '' })}
            options={[
              { value: "", label: "No client" },
              ...clients.map((client) => ({
                value: client.id,
                label: client.fullName,
              }))
            ]}
          />

          {formData.clientId && clientOpportunities.length > 0 && (
            <FloatingLabelSelect 
              label="Related Opportunity"
              value={formData.opportunityId} 
              onValueChange={(value) => setFormData({ ...formData, opportunityId: value })}
              options={[
                { value: "", label: "No opportunity" },
                ...clientOpportunities.map((opportunity) => ({
                  value: opportunity.id,
                  label: opportunity.title,
                }))
              ]}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.file}>
              Upload Document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
