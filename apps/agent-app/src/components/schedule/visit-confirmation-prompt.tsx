 import { Button } from "@/components/ui/button";
 
 interface VisitConfirmationPromptProps {
   onYes: () => void;
   onNo: () => void;
 }
 
export function VisitConfirmationPrompt({ onYes, onNo }: VisitConfirmationPromptProps) {
  return (
    <div className="bg-card rounded-2xl p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold leading-heading text-foreground">Did this visit happen?</h3>
        <p className="text-sm font-normal leading-body text-muted-foreground mt-1">
          Let us know how the viewing went
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onNo}
          className="flex-1 h-12 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base font-semibold leading-heading border-0"
        >
          No
        </Button>
        <Button
          variant="ghost"
          onClick={onYes}
          className="flex-1 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground text-base font-semibold leading-heading border-0"
        >
          Yes
        </Button>
      </div>
    </div>
  );
}