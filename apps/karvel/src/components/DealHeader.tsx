// Sticky navigation header — deal id, BU chip, asset name.

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import type { Deal } from "@/data/types";

interface Props {
  deal: Deal;
}

export function DealHeader({ deal }: Props) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border">
      <div className="flex items-center gap-3 min-w-0 px-6 h-12">
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
    </header>
  );
}
