import { useState, useRef } from "react";
import { ArrowLeft, Calendar, Clock, Upload, FileText, X, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { format, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScheduleActivity, VisitFeedback } from "@/types";
import { useSchedule } from "@/contexts/schedule-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VisitOutcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
  outcomeType: "yes" | "no";
}

type NoShowReason = "client_cancelled" | "client_no_show" | "i_cancelled" | "rescheduled";
type DocumentType = "hoja_de_visita" | "recognition_fees" | "framework_agreement";

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "hoja_de_visita", label: "Hoja de visita" },
  { value: "recognition_fees", label: "Recognition of visit fees" },
  { value: "framework_agreement", label: "Framework agreement for individual collaboration" },
];

export function VisitOutcomeModal({ open, onOpenChange, activity, outcomeType }: VisitOutcomeModalProps) {
  const { markVisitComplete, markVisitNoShow, rescheduleVisit } = useSchedule();
  const [step, setStep] = useState(1);

  // Yes flow — Step 1: Upload
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Yes flow — Step 2: Client feedback
  const [clientLiked, setClientLiked] = useState<boolean | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // No flow state
  const [noShowReason, setNoShowReason] = useState<NoShowReason | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleTime, setRescheduleTime] = useState<string>("");

  const handleReset = () => {
    setStep(1);
    setSelectedDocType(null);
    setUploadedFiles([]);
    setClientLiked(null);
    setFeedbackNotes("");
    setNoShowReason(null);
    setRescheduleDate("");
    setRescheduleTime("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(handleReset, 300);
  };

  // File handling
  const processFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum size is 10MB.", variant: "destructive" });
      return;
    }
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(f => processFile(f));
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => processFile(f));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Yes flow — Step 1 → Step 2
  const handleContinueToFeedback = () => {
    setStep(2);
  };

  // Yes flow — Step 2 → Submit
  const handleSubmitFeedback = async () => {
    if (clientLiked === null) return;
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const feedback: VisitFeedback = {
        outcome: "completed",
        clientLiked,
        notes: feedbackNotes || undefined,
      };
      markVisitComplete(activity.id, feedback);
      handleClose();
      toast({ title: "Visit completed", description: "Feedback has been saved." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNoShow = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (noShowReason === "rescheduled" && rescheduleDate && rescheduleTime) {
      rescheduleVisit(activity.id, rescheduleDate, rescheduleTime);
      handleClose();
      toast({
        title: "Visit rescheduled",
        description: `Moved to ${format(new Date(rescheduleDate), "EEE, d MMM")} at ${rescheduleTime}`,
      });
    } else if (noShowReason) {
      const reasonText = getReasonText(noShowReason);
      markVisitNoShow(activity.id, reasonText);
      handleClose();
      toast({ title: "Visit marked as not completed", description: reasonText });
    }
  };

  const getReasonText = (reason: NoShowReason): string => {
    switch (reason) {
      case "client_cancelled": return "Client cancelled";
      case "client_no_show": return "Client was a no-show";
      case "i_cancelled": return "Agent cancelled";
      case "rescheduled": return "Rescheduled";
      default: return "";
    }
  };

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i + 1);
    return {
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE d"),
      fullLabel: format(date, "EEEE, d MMM"),
    };
  });

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  // Yes flow title
  const yesTitle = step === 1 ? "Upload document" : "Did the client like the property?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(step - 1)}
                className="h-9 w-9 rounded-xl shrink-0 -ml-2 animate-fade-in"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-xl font-semibold">
              {outcomeType === "yes"
                ? yesTitle
                : step === 1
                  ? "What happened?"
                  : "Reschedule visit"
              }
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="relative overflow-hidden">
          {outcomeType === "yes" ? (
            <div className="relative">
              {/* Step 1: Upload document */}
              <div
                className={cn(
                  "px-6 pb-6 pt-4 space-y-6 transition-all duration-500 ease-out",
                  step === 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
                )}
              >
                {/* Document type */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold leading-heading text-foreground">Document type</h3>
                  <div className="space-y-2">
                    {DOCUMENT_TYPES.map((docType) => (
                      <button
                        key={docType.value}
                        onClick={() => setSelectedDocType(docType.value)}
                        className={cn(
                          "w-full text-left px-4 py-3.5 rounded-xl border-2 text-base font-medium transition-all",
                          selectedDocType === docType.value
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/30"
                        )}
                      >
                        {docType.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload method */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold leading-heading text-foreground">Upload method</h3>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {uploadedFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center gap-2.5 p-3 bg-surface-raised rounded-xl animate-fade-in">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    htmlFor="visit-doc-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                      isDragOver
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30",
                      uploadedFiles.length > 0
                        ? "flex items-center gap-3 px-4 py-3"
                        : "flex flex-col items-center justify-center gap-2 p-6"
                    )}
                  >
                    {uploadedFiles.length > 0 ? (
                      <>
                        <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground">Add more files</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Drop files here or tap to browse</p>
                          <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG (max 10MB)</p>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      id="visit-doc-upload"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                  </label>
                </div>

                <Button
                  onClick={handleContinueToFeedback}
                  disabled={!selectedDocType || uploadedFiles.length === 0}
                  className="w-full h-12 rounded-full"
                >
                  Continue
                </Button>
              </div>

              {/* Step 2: Client feedback */}
              <div
                className={cn(
                  "px-6 pb-6 pt-4 space-y-6 transition-all duration-500 ease-out",
                  step === 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
                )}
              >
                {/* Yes / No toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setClientLiked(false)}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-full text-base font-semibold transition-all border-2",
                      clientLiked === false
                        ? "border-foreground bg-foreground/5"
                        : "border-border bg-card hover:border-foreground/30"
                    )}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setClientLiked(true)}
                    className={cn(
                      "flex items-center justify-center gap-2 h-12 rounded-full text-base font-semibold transition-all border-2",
                      clientLiked === true
                        ? "border-foreground bg-foreground/5"
                        : "border-border bg-card hover:border-foreground/30"
                    )}
                  >
                    Yes
                  </button>
                </div>

                {/* Notes */}
                <Textarea
                  placeholder="Add more details"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="min-h-[120px] resize-none rounded-xl bg-card border-border"
                />

                {/* Submit */}
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={clientLiked === null || isSubmitting}
                  className="w-full h-12 rounded-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit feedback"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div
                className={cn(
                  "px-6 pb-6 pt-4 transition-all duration-500 ease-out",
                  step === 1 ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
                )}
              >
                <RadioGroup
                  value={noShowReason || ""}
                  onValueChange={(value) => setNoShowReason(value as NoShowReason)}
                  className="space-y-2"
                >
                  <ReasonOption value="client_cancelled" label="Client cancelled" />
                  <ReasonOption value="client_no_show" label="Client was a no-show" />
                  <ReasonOption value="i_cancelled" label="I cancelled" />
                  <ReasonOption value="rescheduled" label="Rescheduled" />
                </RadioGroup>

                <Button
                  onClick={() => noShowReason === "rescheduled" ? setStep(2) : handleSaveNoShow()}
                  disabled={!noShowReason}
                  className="w-full h-12 rounded-full mt-6"
                >
                  {noShowReason === "rescheduled" ? "Continue" : "Save"}
                </Button>
              </div>

              <div
                className={cn(
                  "px-6 pb-6 pt-4 transition-all duration-500 ease-out",
                  step === 2 ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
                )}
              >
                <div className="space-y-3 mb-4">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select new date
                  </Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {nextDays.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => setRescheduleDate(day.value)}
                        className={cn(
                          "flex flex-col items-center px-4 py-2 rounded-xl shrink-0 transition-colors",
                          rescheduleDate === day.value
                            ? "bg-foreground text-background"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        <span className="text-sm font-semibold">{day.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Select time
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setRescheduleTime(time)}
                        className={cn(
                          "px-2 py-2 rounded-xl text-sm font-medium transition-colors",
                          rescheduleTime === time
                            ? "bg-foreground text-background"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveNoShow}
                  disabled={!rescheduleDate || !rescheduleTime}
                  className="w-full h-12 rounded-full mt-6"
                >
                  Reschedule visit
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type NoShowReasonType = NoShowReason;

interface ReasonOptionProps {
  value: NoShowReasonType;
  label: string;
}

function ReasonOption({ value, label }: ReasonOptionProps) {
  return (
    <Label
      htmlFor={value}
      className="flex items-center gap-3 p-4 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
    >
      <RadioGroupItem value={value} id={value} />
      <span className="font-medium">{label}</span>
    </Label>
  );
}
