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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAllClientsWithOpportunities, mockOpportunities } from "@/data/mockData";
import { TaskPriority } from "@/types";
import { X } from "lucide-react";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTaskModal({ open, onOpenChange }: NewTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    clientId: '',
    opportunityId: '',
    dueDate: ''
  });

  const { toast } = useToast();
  const clients = getAllClientsWithOpportunities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.priority) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally create the task
    toast({
      title: "Success",
      description: "New task created successfully",
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      clientId: '',
      opportunityId: '',
      dueDate: ''
    });
    
    onOpenChange(false);
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
            <DialogTitle className="text-xl font-semibold">Create New Task</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <FloatingLabelInput
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Task details and instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <FloatingLabelSelect
            label="Priority"
            required
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          <FloatingLabelInput
            label="Due Date"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />

          <div className="relative">
            <div className="absolute left-4 top-2 text-xs z-10 pointer-events-none">
              <span className="text-muted-foreground">Related Client</span>
            </div>
            <Select 
              value={formData.clientId} 
              onValueChange={(value) => setFormData({ ...formData, clientId: value, opportunityId: '' })}
            >
              <SelectTrigger className="h-16 pt-6 pb-2 text-base font-medium rounded-xl">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.clientId && clientOpportunities.length > 0 && (
            <div className="relative">
              <div className="absolute left-4 top-2 text-xs z-10 pointer-events-none">
                <span className="text-muted-foreground">Related Opportunity</span>
              </div>
              <Select value={formData.opportunityId} onValueChange={(value) => setFormData({ ...formData, opportunityId: value })}>
                <SelectTrigger className="h-16 pt-6 pb-2 text-base font-medium rounded-xl">
                  <SelectValue placeholder="Select opportunity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No opportunity</SelectItem>
                  {clientOpportunities.map((opportunity) => (
                    <SelectItem key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
