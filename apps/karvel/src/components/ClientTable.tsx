import { Client } from "@/data/clientTypes";
import { StatusBadge } from "./OpportunityBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";

interface Props {
  clients: Client[];
  onRowClick?: (client: Client) => void;
  selectedId?: string;
}

const totalCount = 10715;

export function ClientTable({ clients, onRowClick, selectedId }: Props) {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.ceil(totalCount / perPage);
  const paginated = clients.slice((page - 1) * perPage, page * perPage);

  const thClass = "text-left px-5 py-3 font-semibold text-foreground text-[13px] whitespace-nowrap";
  const tdClass = "px-5 py-3.5 text-[14px] text-foreground font-medium whitespace-nowrap";

  return (
    <div>
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className={thClass}>ID · {totalCount}</th>
                <th className={thClass}>Name</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Source</th>
                <th className={thClass}>Origin</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => onRowClick?.(client)}
                  className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${selectedId === client.id ? "bg-muted/50" : ""}`}
                >
                  <td className={tdClass}>{client.id.slice(0, 20)}...</td>
                  <td className={tdClass}>{client.fullName}</td>
                  <td className={tdClass}>{client.email}</td>
                  <td className={tdClass}>{client.phone}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className={tdClass}>{client.source ?? "-"}</td>
                  <td className={tdClass}>{client.origin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 py-5">
        <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsLeft className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2 text-[14px] mx-1">
          <input
            type="number"
            value={page}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (v >= 1 && v <= totalPages) setPage(v);
            }}
            className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">of {totalCount}</span>
        </div>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 flex items-center justify-center rounded border border-border bg-card disabled:opacity-30 hover:bg-muted transition-colors">
          <ChevronsRight className="h-4 w-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
