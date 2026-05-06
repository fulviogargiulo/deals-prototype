import { Copy, ChevronRight, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleActivity } from "@/types";
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";

interface ShareVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
}

function buildShareMessage(activity: ScheduleActivity): string {
  const clientName = activity.clientName || "Client";
  const propertyName = activity.propertyName || activity.title;

  const visitDate = parse(activity.date, "yyyy-MM-dd", new Date());
  const [hours, minutes] = activity.time.split(":").map(Number);
  visitDate.setHours(hours, minutes);
  const formattedDate = format(visitDate, "MMMM d, yyyy, HH:mm");

  const agentName = "Andreas Samman";
  const agentPhone = "+34674753869";

  const meetingPoint = activity.meetingPointLabel || "To be confirmed";

  const propertyLink = activity.propertyId
    ? `https://www.huspy.es/comprar/${activity.propertyId}`
    : "";

  const lines = [
    `Hi ${clientName},`,
    `Sharing the details for our visit to ${propertyName}:`,
    ``,
    `Agent details: ${agentName} ${agentPhone}`,
    `-----------------------------------`,
    `Visit time: ${formattedDate}`,
    `Meeting point: ${meetingPoint}`,
  ];

  if (propertyLink) {
    lines.push(`Property link: ${propertyLink}`);
  }

  return lines.join("\n");
}

export function ShareVisitModal({ open, onOpenChange, activity }: ShareVisitModalProps) {
  const message = buildShareMessage(activity);
  const clientName = activity.clientName || "Client";
  const clientFirstName = clientName.split(" ")[0];

  // Show email option only if client has an email
  const clientEmail = activity.clientEmail;

  const handleCopyInfo = async () => {
    await navigator.clipboard.writeText(message);
    toast({ title: "Copied", description: "Visit information copied to clipboard." });
    onOpenChange(false);
  };

  const handleWhatsApp = () => {
    const phone = activity.clientPhone?.replace(/\D/g, "") || "";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  const handleEmail = () => {
    if (!clientEmail) return;
    const subject = encodeURIComponent(`Visit details — ${activity.propertyName || activity.title}`);
    const body = encodeURIComponent(message);
    window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Share visit</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col px-6 pb-6 pt-4">
          <div className="space-y-1">
            {/* Copy information */}
            <button
              onClick={handleCopyInfo}
              className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Copy className="w-4 h-4 text-foreground" />
                </div>
                <span className="text-sm font-medium">Copy information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Send to {clientFirstName} via WhatsApp
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Email — only if client has email */}
            {clientEmail && (
              <button
                onClick={handleEmail}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">
                    Send to {clientFirstName} via email
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
