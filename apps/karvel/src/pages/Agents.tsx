import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutGrid, Table2, Plus, MessageSquare, ArrowUpRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { sharedAgents, sharedParties } from "@huspy/shared-domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBucket = "all" | "onboarding" | "active" | "churned";

const agentsWithParty = sharedAgents.map((a) => ({
  ...a,
  party: sharedParties.find((p) => p.id === a.partyId),
}));

function deriveRegion(agent: typeof agentsWithParty[number]) {
  if ((agent.workingZones ?? []).length > 0) {
    const zone = (agent.workingZones ?? [])[0];
    const match = zone.match(/\(([^)]+)\)/);
    return match ? match[1] : zone;
  }
  return "—";
}

function bucket(status = "active"): StatusBucket {
  if (status === "active") return "active";
  if (status === "inactive") return "churned";
  return "onboarding";
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "active" ? "Active" : status === "inactive" ? "Churned" : "Onboarding";
  return (
    <Badge
      className={cn(
        "rounded-full font-semibold capitalize",
        status === "active" && "bg-green-500 text-white hover:bg-green-500",
        status === "inactive" && "bg-gray-400 text-white hover:bg-gray-400",
        (!status || status === "pending") && "bg-amber-500 text-white hover:bg-amber-500",
      )}
    >
      {label}
    </Badge>
  );
}

const Agents = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusBucket>("all");

  const counts = {
    all: agentsWithParty.length,
    onboarding: agentsWithParty.filter((a) => bucket(a.employmentStatus) === "onboarding").length,
    active: agentsWithParty.filter((a) => bucket(a.employmentStatus) === "active").length,
    churned: agentsWithParty.filter((a) => bucket(a.employmentStatus) === "churned").length,
  };

  const visible = agentsWithParty.filter((a) => {
    if (activeFilter !== "all" && bucket(a.employmentStatus) !== activeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.party?.displayName ?? "").toLowerCase().includes(q) ||
      (a.party?.email ?? "").toLowerCase().includes(q) ||
      (a.party?.phone ?? "").includes(q)
    );
  });

  const thClass = "text-left px-4 py-3 text-[13px] font-medium text-muted-foreground whitespace-nowrap";
  const tdClass = "px-4 py-3 text-[14px] text-foreground whitespace-nowrap";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background overflow-auto">
      <div className="px-6 py-6">
        {/* Title row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold text-foreground">Agent Management</h1>
            <div className="flex rounded-lg overflow-hidden bg-muted p-0.5 gap-0.5">
              <button className="p-1.5 rounded-md bg-card shadow-sm transition-colors">
                <Table2 className="h-4 w-4 text-foreground" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Button className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" />
            Create agent
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full border border-border text-[13px] bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring w-[260px]"
              />
            </div>
            <span className="text-[13px] text-muted-foreground">
              Filters: {search ? `"${search}"` : "No filters applied"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              className="rounded-full gap-1.5"
              onClick={() => setActiveFilter("all")}
            >
              All <span className="opacity-70">{counts.all}</span>
            </Button>
            <Button
              variant={activeFilter === "onboarding" ? "default" : "outline"}
              className="rounded-full gap-1.5"
              onClick={() => setActiveFilter("onboarding")}
            >
              Onboarding <span className="opacity-70">{counts.onboarding}</span>
            </Button>
            <Button
              variant={activeFilter === "active" ? "default" : "outline"}
              className="rounded-full gap-1.5"
              onClick={() => setActiveFilter("active")}
            >
              Active <span className="opacity-70">{counts.active}</span>
            </Button>
            <Button
              variant={activeFilter === "churned" ? "default" : "outline"}
              className="rounded-full gap-1.5"
              onClick={() => setActiveFilter("churned")}
            >
              Churned <span className="opacity-70">{counts.churned}</span>
            </Button>
            <Button variant="outline" className="rounded-full gap-1">
              Region <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className={thClass}>ID · {counts.all}</th>
                  <th className={thClass}>Full Name</th>
                  <th className={thClass}>Region</th>
                  <th className={thClass}>Phone number</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Updated Date</th>
                  <th className={thClass}>Created Date</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer last:border-0"
                  >
                    <td className={`${tdClass} text-muted-foreground tabular-nums`}>
                      {agent.uid ?? agent.id}
                    </td>
                    <td className={`${tdClass} font-semibold`}>
                      {agent.party?.displayName ?? agent.id}
                    </td>
                    <td className={tdClass}>{deriveRegion(agent)}</td>
                    <td className={tdClass}>{agent.party?.phone ?? "—"}</td>
                    <td className={`${tdClass} text-muted-foreground max-w-[200px] truncate`}>
                      {agent.party?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={agent.employmentStatus ?? "active"} />
                    </td>
                    <td className={`${tdClass} text-muted-foreground`}>—</td>
                    <td className={`${tdClass} text-muted-foreground`}>—</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => { e.stopPropagation(); navigate(`/agents/${agent.id}`); }}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-[14px]">
                      No agents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-1.5 py-5">
          {["«", "‹"].map((c) => (
            <button key={c} disabled className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-card disabled:opacity-30 text-[13px]">{c}</button>
          ))}
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-background text-[13px] font-medium">1</button>
          <span className="text-[13px] text-muted-foreground px-1">of 1</span>
          {["›", "»"].map((c) => (
            <button key={c} disabled className="w-8 h-8 flex items-center justify-center rounded-full border border-border bg-card disabled:opacity-30 text-[13px]">{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Agents;
