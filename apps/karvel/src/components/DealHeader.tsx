// Sticky navigation header — deal id, BU chip, asset name, overflow menu.
// All deal and tranche field details live below in the white panel.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, MoreHorizontal } from "lucide-react";

import type { Deal } from "@/data/types";
import { CancelDealDialog } from "@/components/CancelDealDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  deal: Deal;
  canCancel: boolean;
  onCancel: (reason: string) => void;
}

export function DealHeader({ deal, canCancel, onCancel }: Props) {
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between gap-4 px-6 h-12">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/deals")}
              className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors shrink-0"
              aria-label="Back to deals"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-mono text-[13px] font-semibold text-foreground shrink-0">{deal.id}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-muted text-muted-foreground shrink-0">
              {deal.businessUnit?.toUpperCase()}
            </span>
            {deal.title && (
              <span className="text-[13px] text-muted-foreground truncate">· {deal.title}</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted transition-colors shrink-0"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {canCancel ? (
                <DropdownMenuItem
                  onClick={() => setCancelOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Ban className="h-3.5 w-3.5 mr-2" />
                  Cancel deal…
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CancelDealDialog
        open={cancelOpen}
        deal={deal}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => { setCancelOpen(false); onCancel(reason); }}
      />
    </>
  );
}
