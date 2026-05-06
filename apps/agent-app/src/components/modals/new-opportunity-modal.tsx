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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAllClientsWithOpportunities } from "@/data/mockData";
import { OpportunityType } from "@/types";
import { X } from "lucide-react";

interface NewOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOpportunityModal({ open, onOpenChange }: NewOpportunityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: '' as OpportunityType,
    clientId: '',
    priceMin: '',
    priceMax: '',
    currency: '€',
    bedrooms: '',
    bathrooms: '',
    sizeMin: '',
    sizeMax: '',
    neighborhoods: '',
    description: ''
  });

  const { toast } = useToast();
  const clients = getAllClientsWithOpportunities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.clientId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally create the opportunity
    toast({
      title: "Success",
      description: "New opportunity created successfully",
    });
    
    // Reset form
    setFormData({
      title: '',
      type: '' as OpportunityType,
      clientId: '',
      priceMin: '',
      priceMax: '',
      currency: '€',
      bedrooms: '',
      bathrooms: '',
      sizeMin: '',
      sizeMax: '',
      neighborhoods: '',
      description: ''
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="pl-6 pr-4 pt-6 pb-2 sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Create New Opportunity</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FloatingLabelInput
                label="Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <FloatingLabelSelect
                label="Type"
                required
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as OpportunityType })}
                options={[
                  { value: 'buy', label: 'Buy' },
                  { value: 'rent', label: 'Rent' },
                  { value: 'sell', label: 'Sell' },
                  { value: 'lease', label: 'Lease' },
                ]}
                placeholder="Select type"
              />
            </div>

            <FloatingLabelSelect
              label="Client"
              required
              value={formData.clientId}
              onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              options={clients.map((client) => ({
                value: client.id,
                label: client.fullName,
              }))}
            />

            <FloatingLabelSelect
              label="Currency"
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
              options={[
                { value: "€", label: "€ Euro" },
                { value: "$", label: "$ Dollar" },
                { value: "£", label: "£ Pound" },
              ]}
            />

            <FloatingLabelInput
              label="Min Price"
              type="number"
              value={formData.priceMin}
              onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
            />

            <FloatingLabelInput
              label="Max Price"
              type="number"
              value={formData.priceMax}
              onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
            />

            <FloatingLabelInput
              label="Bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            />

            <FloatingLabelInput
              label="Bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            />

            <FloatingLabelInput
              label="Min Size (m²)"
              type="number"
              value={formData.sizeMin}
              onChange={(e) => setFormData({ ...formData, sizeMin: e.target.value })}
            />

            <FloatingLabelInput
              label="Max Size (m²)"
              type="number"
              value={formData.sizeMax}
              onChange={(e) => setFormData({ ...formData, sizeMax: e.target.value })}
            />

            <div className="md:col-span-2">
              <FloatingLabelInput
                label="Neighborhoods"
                value={formData.neighborhoods}
                onChange={(e) => setFormData({ ...formData, neighborhoods: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                placeholder="Additional details about the opportunity..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Opportunity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
