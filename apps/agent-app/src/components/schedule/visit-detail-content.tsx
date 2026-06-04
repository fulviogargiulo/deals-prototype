import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, MapPin, ChevronDown, ChevronRight, Plus, Copy, Check, FileText, ClipboardList, Download, Calendar, CalendarX2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { ScheduleActivity } from "@/types";
import { cn } from "@/lib/utils";
import { VisitConfirmationPrompt } from "./visit-confirmation-prompt";
import { VisitOutcomeModal } from "./visit-outcome-modal";
import { VisitCancelledModal } from "./visit-cancelled-modal";
import { VisitDateTimePills } from "./visit-date-time-pills";
import { RescheduleVisitModal } from "./reschedule-visit-modal";
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { addToCalendar } from "@/lib/add-to-calendar";
import { useSchedule } from "@/contexts/schedule-context";
import { ShareVisitModal } from "./share-visit-modal";
 
 interface VisitDetailContentProps {
   activity: ScheduleActivity | null;
   showBackButton?: boolean;
   onBack?: () => void;
   onClose?: () => void;
 }
 
 export function VisitDetailContent({ activity: activityProp, showBackButton = true, onBack, onClose }: VisitDetailContentProps) {
  const { getActivityById } = useSchedule();
  // Always read the live activity from context so mutations are reflected
  const activity = activityProp ? (getActivityById(activityProp.id) ?? activityProp) : null;
  
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [cancelledModalOpen, setCancelledModalOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
 
   // Track scroll position with hysteresis to prevent flickering
   useEffect(() => {
     const container = scrollContainerRef.current;
     if (!container) return;
     
     const handleScroll = () => {
       const scrollY = container.scrollTop;
       // Use hysteresis: different thresholds for scrolling down vs up
       if (scrollY > 15) {
         setIsScrolled(true);
       } else if (scrollY < 5) {
         setIsScrolled(false);
       }
       // Between 5-15px, maintain current state (hysteresis zone)
     };
     
     container.addEventListener("scroll", handleScroll, { passive: true });
     return () => container.removeEventListener("scroll", handleScroll);
   }, []);
 
   if (!activity) return null;

   const isViewing = activity.type === "viewing";
   const isCompleted = activity.status === "completed";
   const isNoShow = activity.status === "no-show";
   const isCancelled = activity.status === "cancelled";
   const isFinished = isCompleted || isNoShow || isCancelled;

   // Check if visit time has passed (for showing confirmation prompt)
   const isVisitTimePassed = (): boolean => {
     const visitDateTime = new Date(`${activity.date}T${activity.time}`);
     return new Date() > visitDateTime;
   };

   // Determine visit state
   const isUpcoming = isViewing && activity.status === "scheduled" && !isVisitTimePassed();
   const isOverdue = isViewing && (activity.status === "overdue" || (activity.status === "scheduled" && isVisitTimePassed()));

   const showConfirmation = isOverdue;

   const handleConfirmYes = () => {
     setOutcomeModalOpen(true);
   };

   const handleConfirmNo = () => {
     setCancelledModalOpen(true);
   };

   const handleCopyAddress = async () => {
     if (activity.propertyAddress) {
       const fullAddress = `${activity.propertyAddress.street}, ${activity.propertyAddress.postalCode} ${activity.propertyAddress.city}`;
       await navigator.clipboard.writeText(fullAddress);
       setAddressCopied(true);
       setTimeout(() => setAddressCopied(false), 2000);
       toast({
         title: "Address copied",
         description: "The address has been copied to your clipboard.",
       });
     }
   };

    const handleAddToCalendar = () => {
      const visitDate = parse(activity.date, "yyyy-MM-dd", new Date());
      const [hours, minutes] = activity.time.split(":").map(Number);
      visitDate.setHours(hours, minutes);

      // Parse duration
      let durationInMinutes = 60;
      if (activity.duration) {
        const durationMatch = activity.duration.match(/(\d+)h?\s*(\d+)?m?/);
        if (durationMatch) {
          const durationHours = parseInt(durationMatch[1]) || 0;
          const durationMins = parseInt(durationMatch[2]) || 0;
          durationInMinutes = durationHours * 60 + durationMins;
        }
      }

      const description = [
        `Client: ${activity.clientName || "N/A"}`,
        `Property: ${activity.propertyName || "N/A"}`,
        activity.propertyLocation ? `Location: ${activity.propertyLocation}` : "",
        activity.meetingPointLabel ? `Meeting point: ${activity.meetingPointLabel}` : "",
      ].filter(Boolean).join("\n");

      const location = activity.propertyAddress
        ? `${activity.propertyAddress.street}, ${activity.propertyAddress.postalCode} ${activity.propertyAddress.city}`
        : "";

      addToCalendar({
        title: `Visit at ${activity.propertyName || activity.title}`,
        startDate: visitDate,
        durationInMinutes,
        description,
        location,
      });
    };

    return (
      <>
        <div ref={scrollContainerRef} className="flex flex-col h-full overflow-y-auto bg-surface-page relative">
          {/* Sticky Header - appears on scroll */}
          <div 
            className={cn(
              "sticky top-0 z-20 pt-4 pb-2 px-4 flex items-center justify-between transition-all duration-500",
              isScrolled 
                ? "bg-white/60 dark:bg-background/60 backdrop-blur-xl" 
                : "bg-transparent pointer-events-none"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={showBackButton ? onBack : onClose}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-500 pointer-events-auto",
                isScrolled 
                  ? "bg-transparent hover:bg-muted/60" 
                  : "bg-white shadow-sm hover:bg-white/90"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex gap-2 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShareModalOpen(true)}
                className={cn(
                  "h-10 w-10 rounded-full transition-all duration-500",
                  isScrolled 
                    ? "bg-transparent hover:bg-muted/60" 
                    : "bg-white shadow-sm hover:bg-white/90"
                )}
              >
                <Upload className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Hero Image Header - offset by sticky header height */}
          <div className="relative shrink-0 -mt-16">
            {activity.propertyImage ? (
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src={activity.propertyImage}
                  alt={activity.propertyName || "Property"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] w-full bg-muted flex items-center justify-center">
                <MapPin className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content Area - pulled up so pills center aligns with hero bottom edge */}
          {/* Pills are ~36px tall + 16px card padding = pull up by 34px to center pills on edge */}
          <div className="px-4 pb-20 space-y-4 -mt-[34px] relative z-10">
            {/* Visit Title Card */}
            <div className="bg-card rounded-2xl p-4 space-y-4">
              {/* Date/Time Pills */}
              <VisitDateTimePills
                date={activity.date} 
                time={activity.time} 
                duration={activity.duration} 
              />

              {/* Title */}
              <h2 className="text-2xl font-semibold leading-heading text-foreground">
                Visit at {activity.propertyName || activity.title}
              </h2>

              {/* Client Info */}
              {activity.clientName && activity.clientId && (
                <Link 
                  to={`/clients/${activity.clientId}`}
                  className="flex items-center gap-2 mt-4 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.clientAvatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                      {activity.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base font-semibold leading-heading text-muted-foreground underline-offset-2 hover:underline">
                    Client: {activity.clientName}
                  </span>
                </Link>
              )}
              {activity.clientName && !activity.clientId && (
                <div className="flex items-center gap-2 mt-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={activity.clientAvatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                      {activity.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base font-semibold leading-heading text-muted-foreground">
                    Client: {activity.clientName}
                  </span>
                </div>
              )}

              {/* See property details button */}
              {activity.propertyId && (
                <Link to={`/properties/${activity.propertyId}`} className="block mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full h-12 bg-white border-border text-base font-semibold leading-heading text-foreground"
                  >
                    See property details
                  </Button>
                </Link>
              )}
            </div>
 
           {/* Confirmation Prompt — fades out when finished */}
           <div className={cn(
             "transition-all duration-500 ease-out overflow-hidden",
             showConfirmation ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0"
           )}>
             <VisitConfirmationPrompt
               onYes={handleConfirmYes}
               onNo={handleConfirmNo}
             />
           </div>
 
           {/* Visit Feedback section — fades in when finished */}
           <div className={cn(
             "transition-all duration-500 ease-out overflow-hidden",
             isFinished ? "opacity-100 max-h-[400px]" : "opacity-0 max-h-0"
           )}>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold leading-heading text-foreground">Visit feedback</h3>
                <div className="bg-card rounded-2xl p-4 space-y-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isCompleted
                        ? (activity?.feedback?.clientLiked ? 'rgba(16, 177, 137, 0.15)' : 'rgba(246, 68, 92, 0.15)')
                        : 'hsl(var(--muted))'
                    }}
                  >
                    {isCompleted && activity?.feedback?.clientLiked && <ThumbsUp className="h-5 w-5 text-tier-success" />}
                    {isCompleted && activity?.feedback?.clientLiked === false && <ThumbsDown className="h-5 w-5 text-tier-danger" />}
                    {(isCancelled || isNoShow) && <CalendarX2 className="h-5 w-5 text-foreground" />}
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-heading text-foreground">
                      {isCompleted && activity?.feedback?.clientLiked && "Client liked it"}
                      {isCompleted && activity?.feedback?.clientLiked === false && "Client didn't like it"}
                      {isNoShow && "No-show"}
                      {isCancelled && "Cancelled"}
                    </p>
                    {activity?.feedback?.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.feedback.notes}</p>
                    )}
                    {activity?.feedback?.reason && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.feedback.reason}</p>
                    )}
                  </div>
                </div>
              </div>
           </div>
 
           {/* Address Section */}
           {activity.propertyAddress && (
             <div className="space-y-4">
               <h3 className="text-xl font-semibold leading-heading text-foreground">Address</h3>
               
               <div className="bg-card rounded-2xl p-4 space-y-3">
                 {/* Map Preview */}
                 <div className="rounded-xl overflow-hidden h-40">
                   <LeafletMap
                     lat={activity.propertyAddress.lat}
                     lng={activity.propertyAddress.lng}
                     className="w-full h-full"
                   />
                 </div>
 
                 {/* Address with copy button */}
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-normal leading-heading text-muted-foreground flex-1 min-w-0">
                      {activity.propertyAddress.street}, {activity.propertyAddress.postalCode}
                    </p>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={handleCopyAddress}
                     className="h-10 w-10 rounded-full shrink-0"
                   >
                     {addressCopied ? (
                       <Check className="h-5 w-5 text-tier-success" />
                     ) : (
                       <Copy className="h-5 w-5" />
                     )}
                   </Button>
                 </div>
               </div>
             </div>
           )}
 
           {/* Meeting Point Section */}
           {activity.meetingPointLabel && (
             <div className="space-y-4">
               <h3 className="text-xl font-semibold leading-heading text-foreground">Meeting point</h3>
               
               <div className="bg-card rounded-2xl p-4">
                 <p className="text-sm font-normal leading-heading text-muted-foreground">
                   {activity.meetingPointLabel}
                 </p>
               </div>
             </div>
           )}

           {/* Legacy Meeting Point Section (for backwards compatibility) */}
           {activity.meetingPoint && !activity.meetingPointLabel && (
             <div className="space-y-4">
               <h3 className="text-xl font-semibold leading-heading text-foreground">Meeting point</h3>
               
               <div className="bg-card rounded-2xl p-4 space-y-3">
                 <div className="bg-muted rounded-xl p-3">
                   <p className="text-sm">{activity.meetingPoint.message}</p>
                 </div>

                 <p className="text-sm text-muted-foreground">
                   Sent to {activity.meetingPoint.sentTo} via {activity.meetingPoint.sentVia}
                 </p>
               </div>
             </div>
           )}

           {/* Resources Section */}
           <div className="space-y-4">
             <h3 className="text-xl font-semibold leading-heading text-foreground">Resources</h3>
             
             <div className="bg-card rounded-2xl overflow-hidden">
               {/* Pre-visit checklist accordion */}
               <Collapsible>
                 <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border">
                   <div className="flex items-center gap-3">
                     <ClipboardList className="h-5 w-5" />
                     <span className="text-base font-medium">Pre-visit checklist</span>
                   </div>
                   <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                 </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-3 bg-surface-raised">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-base">
                          <span className="text-muted-foreground">•</span>
                          <span>Ensure property is clean and ready</span>
                        </li>
                        <li className="flex items-start gap-2 text-base">
                          <span className="text-muted-foreground">•</span>
                          <span>Review client preferences</span>
                        </li>
                        <li className="flex items-start gap-2 text-base">
                          <span className="text-muted-foreground">•</span>
                          <span>Confirm showing route</span>
                        </li>
                        <li className="flex items-start gap-2 text-base">
                          <span className="text-muted-foreground">•</span>
                          <span>Prepare brochures</span>
                        </li>
                        <li className="flex items-start gap-2 text-base">
                          <span className="text-muted-foreground">•</span>
                          <span>Arrive early to check access</span>
                        </li>
                      </ul>
                    </div>
                  </CollapsibleContent>
               </Collapsible>

               {/* Download visit documents accordion */}
               <Collapsible>
                 <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-3">
                     <FileText className="h-5 w-5" />
                     <span className="text-base font-medium">Download visit documents</span>
                   </div>
                   <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                 </CollapsibleTrigger>
                 <CollapsibleContent>
                    <div className="p-4 pt-3 bg-surface-raised space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Access the key documents you may need during visits. NOTE: Hoja de visita can also be signed digitally once the visit starts
                      </p>

                      {/* Document cards */}
                     <div className="space-y-2">
                       <DocumentDownloadCard
                         title="Hoja de visita"
                         description="Standard visit record — use for most visits"
                       />
                       <DocumentDownloadCard
                         title="Reconocimiento de honorarios por visita"
                         description="For non-exclusive properties — secures commission if this client makes an offer"
                       />
                       <DocumentDownloadCard
                         title="Acuredo marco de colaboracion individual"
                         description="For properties/leads shared with another agency — records collaboration and visit"
                       />
                     </div>
                   </div>
                 </CollapsibleContent>
               </Collapsible>
             </div>
           </div>

         </div>

        {/* Footer CTAs - only show for upcoming visits */}
        {isUpcoming && (
          <div className="sticky bottom-0 z-30 bg-card px-4 py-4 border-t shrink-0 space-y-2">
            <Button className="w-full h-12 rounded-full" onClick={handleAddToCalendar}>
              <Calendar className="h-5 w-5 mr-2" />
              Add to calendar
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-full bg-white border-border"
              onClick={() => setRescheduleModalOpen(true)}
            >
              Reschedule
            </Button>
          </div>
        )}

        {/* Visit Feedback placeholder - for completed/no-show/cancelled */}
        {isFinished && (
          <div className="sticky bottom-0 z-30 bg-card px-4 py-4 border-t shrink-0">
            {/* Visit feedback component will be added here */}
          </div>
        )}
      </div>

      {/* Outcome Modal (Yes flow) */}
      <VisitOutcomeModal
        open={outcomeModalOpen}
        onOpenChange={setOutcomeModalOpen}
        activity={activity}
        outcomeType="yes"
      />

      {/* Cancelled Modal (No flow) */}
      <VisitCancelledModal
        open={cancelledModalOpen}
        onOpenChange={setCancelledModalOpen}
        activity={activity}
      />

      {/* Reschedule Modal */}
      <RescheduleVisitModal
        open={rescheduleModalOpen}
        onOpenChange={setRescheduleModalOpen}
        activity={activity}
      />

      {/* Share Visit Modal */}
      <ShareVisitModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        activity={activity}
      />
    </>
  );
 }
 
 interface ResourceRowProps {
   icon: React.ReactNode;
   label: string;
   onClick: () => void;
 }
 
 function ResourceRow({ icon, label, onClick }: ResourceRowProps) {
   return (
     <button
       onClick={onClick}
       className="w-full flex items-center justify-between gap-3 py-3 hover:bg-muted/50 rounded-xl transition-colors -mx-2 px-2"
     >
       <div className="flex items-center gap-3">
         {icon}
         <span className="text-base font-medium">{label}</span>
       </div>
       <ChevronRight className="h-5 w-5 text-muted-foreground" />
     </button>
   );
}

interface DocumentDownloadCardProps {
  title: string;
  description: string;
}

function DocumentDownloadCard({ title, description }: DocumentDownloadCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 bg-surface-page rounded-xl">
      <div className="flex-1 min-w-0">
        <h5 className="text-base font-semibold leading-heading text-foreground">{title}</h5>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors">
        <Download className="h-5 w-5" />
      </button>
    </div>
  );
}