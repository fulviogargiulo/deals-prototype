import React from "react";
import { Deal, DealStatus, DealType, DealMarket, BusinessUnit, Country, InvoiceStatus, PayableStatus, AgentEntry, ExternalPartnerEntry } from "@/data/types";
import { DealStatusBadge } from "./DealBadges";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageSquare, ArrowUp, ArrowDown, ArrowUpDown, Circle, Receipt, FileText } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { recalculateDeal } from "@/lib/dealCalculations";
import { EditableCell } from "./PnLEditableCell";
import { ColumnVisibilityManager, loadSavedVisibility } from "./ColumnVisibilityManager";
import { ColumnFilterIcon, ActiveFilterChips, type ActiveFilter, type ColumnFilterConfig, type FilterType } from "./PnLColumnFilters";

/* ═══════════════════════════════════════════════════════ */
/* Column Configuration                                    */
/* ═══════════════════════════════════════════════════════ */

interface ColDef {
  key: string;
  label: string;
  group: string;
  subGroup?: string;    // sub-heading within a group (e.g. "Revenue", "COGS")
  width: string;        // min-width tailwind or px
  align: "left" | "right";
  filterType?: FilterType;
  filterOptions?: string[];
  sortable?: boolean;
  render: (deal: Deal, fmt: (n: number) => string) => React.ReactNode;
  editable?: boolean;
  editRender?: (deal: Deal, originalDeal: Deal, helpers: EditHelpers) => React.ReactNode;
}

interface EditHelpers {
  updateField: (dealId: string, orig: Deal, field: keyof Deal, value: string | number) => void;
  updateAgent: (dealId: string, orig: Deal, idx: number, field: keyof AgentEntry, value: string | number) => void;
  updatePartner: (dealId: string, orig: Deal, idx: number, field: keyof ExternalPartnerEntry, value: string | number) => void;
  updatePayable: (dealId: string, orig: Deal, idx: number, field: string, value: string | number) => void;
  updateReceivable: (dealId: string, orig: Deal, idx: number, field: string, value: string | number) => void;
  fmt: (n: number) => string;
}

const ALL_STATUSES: DealStatus[] = ["Reported", "Pending Details", "Under Review", "Ready For Invoicing", "Pending Receivables", "Pending Payment", "Paid"];
const ALL_BUS: BusinessUnit[] = ["REBU", "Mortgage"];
const ALL_MARKETS: DealMarket[] = ["Primary", "Secondary", "Leasing"];
const ALL_COUNTRIES: Country[] = ["UAE", "Spain", "KSA"];
const ALL_TYPES: DealType[] = ["Buy", "Sell", "Rent", "Lease", "Buy+Sell", "Mortgage", "Rent+Lease"];
const ALL_INVOICE_STATUSES: InvoiceStatus[] = ["Created", "Sent", "Overdue", "Paid", "Paid Partial", "Cancelled"];
const ALL_PAYABLE_STATUSES: PayableStatus[] = ["Pending", "Approved", "Paid", "Rejected"];

function buildColumns(maxAgents: number, maxPartners: number, maxReceivables: number, maxPayables: number): ColDef[] {
  const cols: ColDef[] = [];
  const dash = "—";

  // ═══ PINNED ═══
  cols.push({
    key: "reportDate", label: "Report Date", group: "pinned", width: "min-w-[100px]", align: "left",
    filterType: "text", sortable: true,
    render: (d) => formatDate(d.reportDate),
    editable: true,
    editRender: (d, o, h) => <EditableCell type="date" value={d.reportDate} onChange={(v) => h.updateField(d.id, o, "reportDate", v)} />,
  });

  // ═══ DEAL INFO ═══
  cols.push({
    key: "businessUnit", label: "BU", group: "dealInfo", width: "min-w-[70px]", align: "left",
    filterType: "multiselect", filterOptions: [...ALL_BUS],
    render: (d) => <BUBadge bu={d.businessUnit} />,
  });
  cols.push({
    key: "country", label: "Country", group: "dealInfo", width: "min-w-[75px]", align: "left",
    filterType: "multiselect", filterOptions: [...ALL_COUNTRIES],
    render: (d) => d.country,
  });
  cols.push({
    key: "channel", label: "Channel", group: "dealInfo", width: "min-w-[90px]", align: "left",
    filterType: "text",
    render: (d) => d.channel || dash,
    editable: true,
    editRender: (d, o, h) => <EditableCell value={d.channel || ""} onChange={(v) => h.updateField(d.id, o, "channel", v)} />,
  });
  cols.push({
    key: "ofCaseNumber", label: "OF/Case #", group: "dealInfo", width: "min-w-[100px]", align: "left",
    filterType: "text",
    render: (d) => d.ofCaseNumber ? (
      <a href="/" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{d.ofCaseNumber}</a>
    ) : dash,
  });
  cols.push({
    key: "type", label: "Type", group: "dealInfo", width: "min-w-[90px]", align: "left",
    filterType: "multiselect", filterOptions: [...ALL_TYPES],
    render: (d) => <TypeBadge type={d.type} />,
  });
  cols.push({
    key: "market", label: "Market", group: "dealInfo", width: "min-w-[90px]", align: "left",
    filterType: "multiselect", filterOptions: [...ALL_MARKETS],
    render: (d) => d.market,
  });
  cols.push({
    key: "opportunityName", label: "Opportunity", group: "dealInfo", width: "min-w-[130px]", align: "left",
    filterType: "text",
    render: (d) => d.opportunityName || dash,
  });
  cols.push({
    key: "clientName", label: "Client", group: "dealInfo", width: "min-w-[120px]", align: "left",
    filterType: "text",
    render: (d) => d.clientName ? (
      <a href="/clients" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{d.clientName}</a>
    ) : dash,
  });

  // ═══ PROPERTY TRANSACTION — Property Details ═══
  cols.push({
    key: "buildingName", label: "Building", group: "propertyTx", subGroup: "Details", width: "min-w-[120px]", align: "left",
    filterType: "text",
    render: (d) => d.buildingName ? (
      <a href="/properties" onClick={(e) => e.stopPropagation()} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{d.buildingName}</a>
    ) : dash,
  });
  cols.push({
    key: "unitNumber", label: "Unit #", group: "propertyTx", subGroup: "Details", width: "min-w-[70px]", align: "left",
    render: (d) => d.unitNumber || dash,
  });
  cols.push({
    key: "community", label: "Community", group: "propertyTx", subGroup: "Details", width: "min-w-[120px]", align: "left",
    filterType: "text",
    render: (d) => d.community || dash,
  });

  // ═══ PROPERTY TRANSACTION — Revenue ═══
  cols.push({
    key: "dealPrice", label: "Deal Price", group: "propertyTx", subGroup: "Revenue", width: "min-w-[110px]", align: "right",
    filterType: "number", sortable: true,
    render: (d, fmt) => fmt(d.dealPrice),
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.dealPrice} onChange={(v) => h.updateField(d.id, o, "dealPrice", v)} align="right" missing={!d.dealPrice} />,
  });
  cols.push({
    key: "takeRate", label: "Take Rate %", group: "propertyTx", subGroup: "Revenue", width: "min-w-[90px]", align: "right",
    filterType: "number", sortable: true,
    render: (d) => `${d.takeRate.toFixed(2)}%`,
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.takeRate} onChange={(v) => h.updateField(d.id, o, "takeRate", v)} align="right" critical={d.status === "Pending Details" && !d.takeRate} />,
  });
  cols.push({
    key: "huspyRevenue", label: "Huspy Revenue", group: "propertyTx", subGroup: "Revenue", width: "min-w-[120px]", align: "right",
    sortable: true,
    render: (d, fmt) => fmt(d.huspyRevenue),
    editable: true,
    editRender: (d, _o, h) => <EditableCell computed value={d.huspyRevenue} align="right" onChange={() => {}} formatter={h.fmt} />,
  });

  // ═══ PROPERTY TRANSACTION — COGS: External Partners (dynamic) ═══
  for (let i = 0; i < maxPartners; i++) {
    const n = maxPartners > 1 ? ` ${i + 1}` : "";
    cols.push({
      key: `extPartner${i}Name`, label: `Ext. Partner${n}`, group: "propertyTx", subGroup: "COGS", width: "min-w-[130px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => d.externalPartners?.[i]?.partnerName || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.externalPartners?.[i]?.partnerName || ""} onChange={(v) => h.updatePartner(d.id, o, i, "partnerName", v)} />,
    });
    cols.push({
      key: `extPartner${i}Share`, label: `Partner${n} %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[85px]", align: "right",
      render: (d) => `${(d.externalPartners?.[i]?.partnerShare || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.externalPartners?.[i]?.partnerShare || 0} onChange={(v) => h.updatePartner(d.id, o, i, "partnerShare", v)} align="right" />,
    });
    cols.push({
      key: `extPartner${i}Amount`, label: `Partner${n} Amt`, group: "propertyTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
      render: (d, fmt) => fmt(d.externalPartners?.[i]?.partnerAmount || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.externalPartners?.[i]?.partnerAmount || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });
    cols.push({
      key: `extPartner${i}Bank`, label: `Partner${n} Bank`, group: "propertyTx", subGroup: "COGS", width: "min-w-[120px]", align: "left",
      render: (d) => d.externalPartners?.[i]?.partnerBank || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.externalPartners?.[i]?.partnerBank || ""} onChange={(v) => h.updatePartner(d.id, o, i, "partnerBank", v)} critical={d.status === "Pending Details" && !d.externalPartners?.[i]?.partnerBank} />,
    });
    cols.push({
      key: `extPartner${i}BankAcct`, label: `Partner${n} Acct`, group: "propertyTx", subGroup: "COGS", width: "min-w-[160px]", align: "left",
      render: (d) => d.externalPartners?.[i]?.partnerBankAccount || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.externalPartners?.[i]?.partnerBankAccount || ""} onChange={(v) => h.updatePartner(d.id, o, i, "partnerBankAccount", v)} />,
    });
  }

  // ═══ PROPERTY TRANSACTION — COGS: Rebates ═══
  cols.push({
    key: "rebatePercentage", label: "Rebate %", group: "propertyTx", subGroup: "COGS", width: "min-w-[85px]", align: "right",
    render: (d) => d.market === "Primary" ? `${d.rebatePercentage.toFixed(1)}%` : dash,
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.rebatePercentage} onChange={(v) => h.updateField(d.id, o, "rebatePercentage", v)} align="right" />,
  });
  cols.push({
    key: "rebateAmount", label: "Rebate Amt", group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
    render: (d, fmt) => d.market === "Primary" ? fmt(d.rebateAmount) : dash,
    editable: true,
    editRender: (d, _o, h) => <EditableCell computed value={d.rebateAmount} align="right" onChange={() => {}} formatter={h.fmt} />,
  });

  // ═══ PROPERTY TRANSACTION — COGS: Subsidy ═══
  cols.push({
    key: "subsidyAmount", label: "Subsidy", group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
    render: (d, fmt) => d.market === "Secondary" ? fmt(d.subsidyAmount) : dash,
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.subsidyAmount} onChange={(v) => h.updateField(d.id, o, "subsidyAmount", v)} align="right" />,
  });

  // ═══ PROPERTY TRANSACTION — COGS: Agent Commission (dynamic per agent) ═══
  for (let i = 0; i < maxAgents; i++) {
    const n = maxAgents > 1 ? `${i + 1} ` : "";
    const nEnd = maxAgents > 1 ? ` ${i + 1}` : "";

    cols.push({
      key: `agent${i}Name`, label: `Agent${nEnd} Name`, group: "propertyTx", subGroup: "COGS", width: "min-w-[140px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => d.agents[i]?.agentName || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.agents[i]?.agentName || ""} onChange={(v) => h.updateAgent(d.id, o, i, "agentName", v)} critical={d.status === "Pending Details" && !d.agents[i]?.agentName} />,
    });
    cols.push({
      key: `agent${i}Share`, label: `Agent${nEnd} Share %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      render: (d) => `${(d.agents[i]?.agentShare || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.agentShare || 0} onChange={(v) => h.updateAgent(d.id, o, i, "agentShare", v)} align="right" />,
    });
    cols.push({
      key: `agent${i}CommRate`, label: `Agent${nEnd} Comm %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      filterType: i === 0 ? "number" : undefined,
      render: (d) => `${(d.agents[i]?.agentCommissionRate || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.agentCommissionRate || 0} onChange={(v) => h.updateAgent(d.id, o, i, "agentCommissionRate", v)} align="right" critical={d.status === "Pending Details" && !d.agents[i]?.agentCommissionRate} />,
    });
    cols.push({
      key: `agent${i}Payout`, label: `Agent${nEnd} Payout`, group: "propertyTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
      sortable: i === 0,
      render: (d, fmt) => fmt(d.agents[i]?.agentCommissionPayout || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.agents[i]?.agentCommissionPayout || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });
    cols.push({
      key: `agent${i}Incentive`, label: `Agent${nEnd} Incentive`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.agentIncentive || 0),
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.agentIncentive || 0} onChange={(v) => h.updateAgent(d.id, o, i, "agentIncentive", v)} align="right" />,
    });
    cols.push({
      key: `agent${i}Deductions`, label: `Agent${nEnd} Deductions`, group: "propertyTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.agentDeductions || 0),
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.agentDeductions || 0} onChange={(v) => h.updateAgent(d.id, o, i, "agentDeductions", v)} align="right" />,
    });
    cols.push({
      key: `agent${i}Total`, label: `Agent${nEnd} Total`, group: "propertyTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
      sortable: i === 0,
      render: (d, fmt) => fmt(d.agents[i]?.agentTotalAmount || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.agents[i]?.agentTotalAmount || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });

    // Team Lead per agent
    cols.push({
      key: `agent${i}TLName`, label: `TL${nEnd} Name`, group: "propertyTx", subGroup: "COGS", width: "min-w-[120px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => d.agents[i]?.teamLeadName || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.agents[i]?.teamLeadName || ""} onChange={(v) => h.updateAgent(d.id, o, i, "teamLeadName", v)} critical={d.status === "Pending Details" && !d.agents[i]?.teamLeadName} />,
    });
    cols.push({
      key: `agent${i}TLRate`, label: `TL${nEnd} Rate %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[85px]", align: "right",
      render: (d) => `${(d.agents[i]?.teamLeadRate || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.teamLeadRate || 0} onChange={(v) => h.updateAgent(d.id, o, i, "teamLeadRate", v)} align="right" />,
    });
    cols.push({
      key: `agent${i}TLShare`, label: `TL${nEnd} Share`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.teamLeadShare || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.agents[i]?.teamLeadShare || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });

    // Manager per agent
    cols.push({
      key: `agent${i}MgrName`, label: `Mgr${nEnd} Name`, group: "propertyTx", subGroup: "COGS", width: "min-w-[120px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => d.agents[i]?.managerName || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.agents[i]?.managerName || ""} onChange={(v) => h.updateAgent(d.id, o, i, "managerName", v)} />,
    });
    cols.push({
      key: `agent${i}MgrRate`, label: `Mgr${nEnd} Rate %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[90px]", align: "right",
      render: (d) => `${(d.agents[i]?.managerOverrideRate || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.managerOverrideRate || 0} onChange={(v) => h.updateAgent(d.id, o, i, "managerOverrideRate", v)} align="right" critical={d.status === "Pending Details" && !d.agents[i]?.managerOverrideRate} />,
    });
    cols.push({
      key: `agent${i}MgrOverride`, label: `Mgr${nEnd} Override`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.managerOverride || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.agents[i]?.managerOverride || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });

    // Client Kickback per agent
    cols.push({
      key: `agent${i}Kickback`, label: `Agent${nEnd} Kickback`, group: "propertyTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.clientKickback || 0),
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.clientKickback || 0} onChange={(v) => h.updateAgent(d.id, o, i, "clientKickback", v)} align="right" />,
    });

    // Referral per agent
    cols.push({
      key: `agent${i}Referrer`, label: `Referrer${nEnd}`, group: "propertyTx", subGroup: "COGS", width: "min-w-[120px]", align: "left",
      render: (d) => d.agents[i]?.referrerName || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell value={d.agents[i]?.referrerName || ""} onChange={(v) => h.updateAgent(d.id, o, i, "referrerName", v)} />,
    });
    const REFERRAL_TYPES = ["MBU referral", "Huspy Employee referral", "Huspy Agent Referral", "Huspy Employee purchase"];
    cols.push({
      key: `agent${i}RefType`, label: `Referral${nEnd} Type`, group: "propertyTx", subGroup: "COGS", width: "min-w-[150px]", align: "left",
      filterType: "multiselect", filterOptions: [...REFERRAL_TYPES],
      render: (d) => d.agents[i]?.referralType || dash,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="select" options={REFERRAL_TYPES} value={d.agents[i]?.referralType || REFERRAL_TYPES[0]} onChange={(v) => h.updateAgent(d.id, o, i, "referralType", v)} />,
    });
    cols.push({
      key: `agent${i}RefPct`, label: `Referral${nEnd} %`, group: "propertyTx", subGroup: "COGS", width: "min-w-[85px]", align: "right",
      render: (d) => `${(d.agents[i]?.referralPercentage || 0).toFixed(1)}%`,
      editable: true,
      editRender: (d, o, h) => <EditableCell type="number" value={d.agents[i]?.referralPercentage || 0} onChange={(v) => h.updateAgent(d.id, o, i, "referralPercentage", v)} align="right" />,
    });
    cols.push({
      key: `agent${i}RefAmt`, label: `Referral${nEnd} Amt`, group: "propertyTx", subGroup: "COGS", width: "min-w-[100px]", align: "right",
      render: (d, fmt) => fmt(d.agents[i]?.referralAmount || 0),
      editable: true,
      editRender: (d, _o, h) => <EditableCell computed value={d.agents[i]?.referralAmount || 0} align="right" onChange={() => {}} formatter={h.fmt} />,
    });
  }

  // ═══ CONVEYANCE TRANSACTION — Revenue ═══
  cols.push({
    key: "conveyanceRevenue", label: "Conv. Revenue", group: "conveyanceTx", subGroup: "Revenue", width: "min-w-[110px]", align: "right",
    sortable: true,
    render: (d, fmt) => fmt(d.conveyanceRevenue),
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.conveyanceRevenue} onChange={(v) => h.updateField(d.id, o, "conveyanceRevenue", v)} align="right" />,
  });

  // ═══ CONVEYANCE TRANSACTION — COGS ═══
  cols.push({
    key: "convAgentName", label: "Conv. Agent", group: "conveyanceTx", subGroup: "COGS", width: "min-w-[120px]", align: "left",
    filterType: "text",
    render: (d) => d.conveyanceAgentName || dash,
    editable: true,
    editRender: (d, o, h) => <EditableCell value={d.conveyanceAgentName || ""} onChange={(v) => h.updateField(d.id, o, "conveyanceAgentName", v)} />,
  });
  cols.push({
    key: "convAgentRate", label: "Conv. Rate %", group: "conveyanceTx", subGroup: "COGS", width: "min-w-[95px]", align: "right",
    render: (d) => `${d.conveyanceAgentRate.toFixed(1)}%`,
    editable: true,
    editRender: (d, o, h) => <EditableCell type="number" value={d.conveyanceAgentRate} onChange={(v) => h.updateField(d.id, o, "conveyanceAgentRate", v)} align="right" />,
  });
  cols.push({
    key: "convAgentPayout", label: "Conv. Payout", group: "conveyanceTx", subGroup: "COGS", width: "min-w-[110px]", align: "right",
    render: (d, fmt) => fmt(d.conveyanceAgentPayout),
    editable: true,
    editRender: (d, _o, h) => <EditableCell computed value={d.conveyanceAgentPayout} align="right" onChange={() => {}} formatter={h.fmt} />,
  });
  cols.push({
    key: "huspyConvShare", label: "Huspy Conv. Share", group: "conveyanceTx", subGroup: "COGS", width: "min-w-[130px]", align: "right",
    render: (d, fmt) => fmt(d.huspyConveyanceShare),
    editable: true,
    editRender: (d, _o, h) => <EditableCell computed value={d.huspyConveyanceShare} align="right" onChange={() => {}} formatter={h.fmt} />,
  });

  const PRE_INVOICE_STATUSES = new Set(["Reported", "Pending Details", "Under Review"]);

  // ═══ RECEIVABLES (dynamic per receivable entry) ═══
  for (let i = 0; i < maxReceivables; i++) {
    const n = maxReceivables > 1 ? ` ${i + 1}` : "";
    cols.push({
      key: `recv${i}Entity`, label: `Entity${n}`, group: "receivables", width: "min-w-[130px]", align: "left",
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : (d.receivables?.[i]?.entityName || dash),
    });
    cols.push({
      key: `recv${i}Type`, label: `Type${n}`, group: "receivables", width: "min-w-[90px]", align: "left",
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : (d.receivables?.[i]?.entityType || dash),
    });
    cols.push({
      key: `recv${i}Amount`, label: `Amount${n}`, group: "receivables", width: "min-w-[100px]", align: "right",
      sortable: i === 0,
      render: (d, fmt) => PRE_INVOICE_STATUSES.has(d.status) ? dash : fmt(d.receivables?.[i]?.amount || 0),
    });
    cols.push({
      key: `recv${i}InvNum`, label: `Invoice${n}`, group: "receivables", width: "min-w-[140px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : <InvoiceChip invoiceNumber={d.receivables?.[i]?.invoiceNumber} />,
    });
    cols.push({
      key: `recv${i}Status`, label: `Inv. Status${n}`, group: "receivables", width: "min-w-[110px]", align: "left",
      filterType: i === 0 ? "multiselect" : undefined,
      filterOptions: i === 0 ? [...ALL_INVOICE_STATUSES] : undefined,
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : <InvoiceStatusChip status={d.receivables?.[i]?.invoiceStatus} />,
    });
    cols.push({
      key: `recv${i}Date`, label: `Inv. Date${n}`, group: "receivables", width: "min-w-[100px]", align: "left",
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : (d.receivables?.[i]?.invoiceDate ? formatDate(d.receivables[i].invoiceDate!) : dash),
    });
  }

  // ═══ PAYABLES (dynamic per payable entry) ═══
  for (let i = 0; i < maxPayables; i++) {
    const n = maxPayables > 1 ? ` ${i + 1}` : "";
    cols.push({
      key: `pay${i}Entity`, label: `Pay. Entity${n}`, group: "payables", width: "min-w-[140px]", align: "left",
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : (d.payables?.[i]?.entityLabel || dash),
    });
    cols.push({
      key: `pay${i}Ref`, label: `Pay. Ref${n}`, group: "payables", width: "min-w-[130px]", align: "left",
      filterType: i === 0 ? "text" : undefined,
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : <PayRefChip refNumber={d.payables?.[i]?.refNumber} />,
    });
    cols.push({
      key: `pay${i}Status`, label: `Pay. Status${n}`, group: "payables", width: "min-w-[110px]", align: "left",
      filterType: i === 0 ? "multiselect" : undefined,
      filterOptions: i === 0 ? [...ALL_PAYABLE_STATUSES] : undefined,
      render: (d) => PRE_INVOICE_STATUSES.has(d.status) ? dash : <PayableStatusChip status={d.payables?.[i]?.status} />,
    });
    cols.push({
      key: `pay${i}Expected`, label: `Pay. Expected${n}`, group: "payables", width: "min-w-[110px]", align: "right",
      render: (d, fmt) => PRE_INVOICE_STATUSES.has(d.status) ? dash : fmt(d.payables?.[i]?.expectedAmount || 0),
    });
    cols.push({
      key: `pay${i}Paid`, label: `Pay. Paid${n}`, group: "payables", width: "min-w-[100px]", align: "right",
      render: (d, fmt) => PRE_INVOICE_STATUSES.has(d.status) ? dash : fmt(d.payables?.[i]?.paidAmount || 0),
    });
  }

  // ═══ NOTES ═══
  cols.push({
    key: "disputeNote", label: "Dispute", group: "notes", width: "min-w-[180px]", align: "left",
    render: (d) => d.isDisputed && d.disputeNote ? (
      <span className="flex items-center gap-1.5 truncate text-destructive">
        <span className="truncate text-[12px]">{d.disputeNote}</span>
      </span>
    ) : "—",
  });
  cols.push({
    key: "latestNote", label: "Comment", group: "notes", width: "min-w-[200px]", align: "left",
    render: (d) => d.latestNote ? (
      <span className="flex items-center gap-1.5 truncate">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate text-muted-foreground">{d.latestNote}</span>
      </span>
    ) : "—",
    editable: true,
    editRender: (d, o, h) => <EditableCell value={d.latestNote || ""} onChange={(v) => h.updateField(d.id, o, "latestNote", v)} />,
  });

  // Remove sub-group headings from Property and Conveyance groups
  cols.forEach(c => {
    if (c.group === "propertyTx" || c.group === "conveyanceTx") {
      delete c.subGroup;
    }
  });

  return cols;
}

/* ═══════════════════════════════════════════════════════ */
/* Badge Components                                        */
/* ═══════════════════════════════════════════════════════ */

/* ── Finance-view styled chips for Invoice & Payable fields ── */

const invoiceStatusColor = (s?: InvoiceStatus | string) => {
  switch (s) {
    case "Paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "Paid Partial": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Sent": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "Overdue": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Created": return "bg-muted text-muted-foreground";
    case "Cancelled": return "bg-muted text-muted-foreground line-through";
    default: return "bg-muted text-muted-foreground";
  }
};

const payableStatusColor = (s?: PayableStatus) => {
  switch (s) {
    case "Paid": return "bg-[hsl(var(--deal-paid)/0.1)] text-[hsl(var(--deal-paid))]";
    case "Approved": return "bg-[hsl(var(--deal-reported)/0.1)] text-[hsl(var(--deal-reported))]";
    case "Pending": return "bg-[hsl(var(--deal-pending-details)/0.1)] text-[hsl(var(--deal-pending-details))]";
    case "Rejected": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    case "Overdue": return "bg-[hsl(var(--deal-pending-payment)/0.1)] text-[hsl(var(--deal-pending-payment))]";
    default: return "bg-muted text-muted-foreground";
  }
};

function InvoiceChip({ invoiceNumber }: { invoiceNumber?: string }) {
  if (!invoiceNumber) return <span className="text-muted-foreground text-[11px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-primary/30 bg-primary/10 text-primary whitespace-nowrap">
      <Receipt className="h-3 w-3 shrink-0" /> {invoiceNumber}
    </span>
  );
}

function InvoiceStatusChip({ status }: { status?: InvoiceStatus }) {
  if (!status) return <span className="text-muted-foreground text-[11px]">No invoice</span>;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${invoiceStatusColor(status)}`}>{status}</span>;
}

function PayRefChip({ refNumber }: { refNumber?: string }) {
  if (!refNumber) return <span className="text-muted-foreground text-[11px]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-primary/30 bg-primary/10 text-primary whitespace-nowrap">
      <FileText className="h-3 w-3 shrink-0" /> {refNumber}
    </span>
  );
}

function PayableStatusChip({ status }: { status?: PayableStatus }) {
  if (!status) return <span className="text-muted-foreground text-[11px]">—</span>;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${payableStatusColor(status)}`}>{status}</span>;
}

function BUBadge({ bu }: { bu: string }) {
  const cls = bu === "REBU" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${cls}`}>{bu}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Buy: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    Sell: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Rent: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    Lease: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    "Buy+Sell": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
    Mortgage: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    "Rent+Lease": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  };
  const cls = colors[type] || "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold ${cls}`}>{type}</span>;
}

/* ═══════════════════════════════════════════════════════ */
/* Styles                                                  */
/* ═══════════════════════════════════════════════════════ */

const thBase = "px-2 py-2.5 font-semibold text-foreground text-[12px] whitespace-nowrap border-b border-border text-center";
const tdClass = "px-2 py-2 text-[12px] text-foreground font-medium whitespace-nowrap";
const groupHeaderClass = "px-3 py-2.5 text-[13px] font-bold uppercase tracking-widest border-b-2 text-center";

const GROUP_STYLES: Record<string, { bg: string; text: string; border: string; headerTint: string; cellTint: string }> = {
  dealInfo:      { bg: "bg-blue-50/80",    text: "text-blue-700/90",    border: "border-b-blue-400",    headerTint: "bg-blue-50/40",    cellTint: "" },
  propertyTx:    { bg: "bg-emerald-50/80", text: "text-emerald-700/90", border: "border-b-emerald-400", headerTint: "bg-emerald-50/30", cellTint: "" },
  conveyanceTx:  { bg: "bg-cyan-50/80",    text: "text-cyan-700/90",    border: "border-b-cyan-400",    headerTint: "bg-cyan-50/30",    cellTint: "" },
  receivables:   { bg: "bg-indigo-50/80",  text: "text-indigo-700/90",  border: "border-b-indigo-400",  headerTint: "bg-indigo-50/30",  cellTint: "" },
  payables:      { bg: "bg-amber-50/80",   text: "text-amber-700/90",   border: "border-b-amber-400",   headerTint: "bg-amber-50/30",   cellTint: "" },
  notes:         { bg: "bg-slate-50/80",   text: "text-slate-600/90",   border: "border-b-slate-400",   headerTint: "bg-slate-50/30",   cellTint: "" },
};

function getSubGroupColor(group: string, subGroup: string): string {
  const map: Record<string, Record<string, string>> = {
    propertyTx:   { Details: "bg-emerald-50/50 text-emerald-700", Revenue: "bg-emerald-100/60 text-emerald-800", COGS: "bg-emerald-50/30 text-emerald-600" },
    conveyanceTx: { "": "bg-cyan-50/30 text-cyan-600" },
    receivables:  { "": "bg-indigo-50/30 text-indigo-600" },
    payables:     { "": "bg-amber-50/30 text-amber-600" },
    notes:        { "": "bg-slate-50/30 text-slate-500" },
  };
  return map[group]?.[subGroup] || map[group]?.[""] || "bg-muted/20 text-muted-foreground/60";
}

function parseMinWidth(w: string): number {
  const match = w.match(/min-w-\[(\d+)px\]/);
  return match ? parseInt(match[1]) : 100;
}

const PINNED_WIDTH = 370; // 110 + 160 + 100

/* ═══════════════════════════════════════════════════════ */
/* Main Component                                          */
/* ═══════════════════════════════════════════════════════ */

interface Props {
  deals: Deal[];
  currency: string;
  onDealsUpdate?: (deals: Deal[]) => void;
}

type SortDir = "asc" | "desc" | null;

export function PnLDealTable({ deals, currency, onDealsUpdate }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [dirtyDeals, setDirtyDeals] = useState<Map<string, Deal>>(new Map());
  const [activeFilters, setActiveFilters] = useState<Map<string, ActiveFilter>>(new Map());

  const fmt = useCallback((amount: number) => formatAmount(amount, currency), [currency]);

  // Compute max counts from deals
  const { maxAgents, maxPartners, maxReceivables, maxPayables } = useMemo(() => {
    let mA = 1, mP = 1, mR = 1, mPa = 1;
    deals.forEach((d) => {
      mA = Math.max(mA, d.agents?.length || 1);
      mP = Math.max(mP, d.externalPartners?.length || 1);
      mR = Math.max(mR, d.receivables?.length || 1);
      mPa = Math.max(mPa, d.payables?.length || 1);
    });
    return { maxAgents: mA, maxPartners: mP, maxReceivables: mR, maxPayables: mPa };
  }, [deals]);

  // Dynamic columns
  const allColumns = useMemo(() => buildColumns(maxAgents, maxPartners, maxReceivables, maxPayables), [maxAgents, maxPartners, maxReceivables, maxPayables]);
  const allColumnKeys = useMemo(() => allColumns.map((c) => c.key), [allColumns]);

  const defaultVisible = useMemo(() => {
    const keys = [
      "businessUnit", "market", "country", "ofCaseNumber", "type",
      "dealPrice", "takeRate", "huspyRevenue",
      "extPartner0Name", "extPartner0Share", "extPartner0Amount",
      "agent0Name", "agent0Share", "agent0CommRate", "agent0Payout", "agent0Total",
      "agent0TLName", "agent0TLRate", "agent0TLShare",
      "agent1Name", "agent1Share", "agent1CommRate", "agent1Payout", "agent1Total",
      "agent1TLName", "agent1TLRate", "agent1TLShare",
      "conveyanceRevenue", "convAgentName", "convAgentRate", "convAgentPayout", "huspyConvShare",
      "recv0Entity", "recv0Amount", "recv0InvNum", "recv0Status",
      "recv1Entity", "recv1Amount", "recv1InvNum", "recv1Status",
      "pay0Entity", "pay0Ref", "pay0Status", "pay0Expected",
      "pay1Entity", "pay1Ref", "pay1Status", "pay1Expected",
      "disputeNote", "latestNote",
    ];
    return keys;
  }, []);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => loadSavedVisibility(allColumnKeys, defaultVisible));

  const columnLabels = useMemo(() => {
    const map: Record<string, string> = {};
    allColumns.forEach((c) => { map[c.key] = c.label; });
    return map;
  }, [allColumns]);

  const columnGroups = useMemo(() => [
    { key: "dealInfo", label: "Deal Info", columns: allColumns.filter((c) => c.group === "dealInfo").map((c) => c.key) },
    { key: "propertyTx", label: "Property Transaction", columns: allColumns.filter((c) => c.group === "propertyTx").map((c) => c.key) },
    { key: "conveyanceTx", label: "Conveyance Transaction", columns: allColumns.filter((c) => c.group === "conveyanceTx").map((c) => c.key) },
    { key: "receivables", label: "Receivables", columns: allColumns.filter((c) => c.group === "receivables").map((c) => c.key) },
    { key: "payables", label: "Payables", columns: allColumns.filter((c) => c.group === "payables").map((c) => c.key) },
    { key: "notes", label: "Notes", columns: allColumns.filter((c) => c.group === "notes").map((c) => c.key) },
  ], [allColumns]);

  // Visible column definitions
  const visibleCols = useMemo(() => allColumns.filter((c) => c.group !== "pinned" && visibleColumns.has(c.key)), [allColumns, visibleColumns]);

  // Freeze: always freeze Deal Info columns after the 3 pinned columns
  const frozenColOffsets = useMemo(() => {
    const offsets = new Map<number, number>();
    let left = PINNED_WIDTH;
    for (let i = 0; i < visibleCols.length; i++) {
      const col = visibleCols[i];
      if (col.group === "dealInfo") {
        offsets.set(i, left);
        left += parseMinWidth(col.width);
      } else break; // dealInfo columns are contiguous and first
    }
    return offsets;
  }, [visibleCols]);

  // Group headers for visible columns
  const groupHeaders = useMemo(() => {
    const headers: { group: string; label: string; span: number }[] = [];
    let lastGroup = "";
    visibleCols.forEach((col) => {
      if (col.group !== lastGroup) {
        const groupDef = columnGroups.find((g) => g.key === col.group);
        headers.push({ group: col.group, label: groupDef?.label || col.group, span: 1 });
        lastGroup = col.group;
      } else {
        headers[headers.length - 1].span++;
      }
    });
    return headers;
  }, [visibleCols, columnGroups]);

  // Sub-group headers for visible columns
  const subGroupHeaders = useMemo(() => {
    const headers: { group: string; subGroup: string; span: number }[] = [];
    let lastKey = "";
    visibleCols.forEach((col) => {
      const sg = col.subGroup || "";
      const key = `${col.group}::${sg}`;
      if (key !== lastKey) {
        headers.push({ group: col.group, subGroup: sg, span: 1 });
        lastKey = key;
      } else {
        headers[headers.length - 1].span++;
      }
    });
    return headers;
  }, [visibleCols]);

  const hasSubGroups = useMemo(() => visibleCols.some((c) => c.subGroup), [visibleCols]);

  // Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  // Filter logic — generic approach using column render
  const getFieldValue = useCallback((deal: Deal, key: string): string | number | undefined => {
    // Static fields
    const map: Record<string, () => string | number | undefined> = {
      status: () => deal.status,
      reportDate: () => deal.reportDate,
      businessUnit: () => deal.businessUnit,
      market: () => deal.market,
      country: () => deal.country,
      channel: () => deal.channel,
      dealPrice: () => deal.dealPrice,
      takeRate: () => deal.takeRate,
      huspyRevenue: () => deal.huspyRevenue,
      clientName: () => deal.clientName,
      agentName: () => deal.agentName,
      ofCaseNumber: () => deal.ofCaseNumber,
      type: () => deal.type,
      opportunityName: () => deal.opportunityName,
      buildingName: () => deal.buildingName,
      community: () => deal.community,
      convAgentName: () => deal.conveyanceAgentName,
    };
    if (map[key]) return map[key]();

    // Dynamic agent fields
    const agentMatch = key.match(/^agent(\d+)(\w+)$/);
    if (agentMatch) {
      const idx = parseInt(agentMatch[1]);
      const field = agentMatch[2];
      const a = deal.agents[idx];
      if (!a) return undefined;
      const agentMap: Record<string, string | number | undefined> = {
        Name: a.agentName, CommRate: a.agentCommissionRate, Payout: a.agentCommissionPayout,
        Total: a.agentTotalAmount, TLName: a.teamLeadName, MgrName: a.managerName,
        RefType: a.referralType, RefName: a.referrerName,
      };
      return agentMap[field];
    }

    // Dynamic partner
    const partnerMatch = key.match(/^extPartner(\d+)Name$/);
    if (partnerMatch) return deal.externalPartners?.[parseInt(partnerMatch[1])]?.partnerName;

    // Dynamic receivable
    const recvMatch = key.match(/^recv(\d+)(\w+)$/);
    if (recvMatch) {
      const idx = parseInt(recvMatch[1]);
      const r = deal.receivables?.[idx];
      if (!r) return undefined;
      if (recvMatch[2] === "InvNum") return r.invoiceNumber;
      if (recvMatch[2] === "Status") return r.invoiceStatus;
      if (recvMatch[2] === "Amount") return r.amount;
      return undefined;
    }

    // Dynamic payable
    const payMatch = key.match(/^pay(\d+)(\w+)$/);
    if (payMatch) {
      const idx = parseInt(payMatch[1]);
      const p = deal.payables?.[idx];
      if (!p) return undefined;
      if (payMatch[2] === "Ref") return p.refNumber;
      if (payMatch[2] === "Status") return p.status;
      return undefined;
    }

    return undefined;
  }, []);

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return deals;
    return deals.filter((d) => {
      for (const [key, filter] of activeFilters) {
        const val = getFieldValue(d, key);
        if (filter.type === "text") {
          if (!val || !String(val).toLowerCase().includes(filter.textValue!.toLowerCase())) return false;
        } else if (filter.type === "multiselect") {
          if (!val || !filter.selectedValues!.has(String(val))) return false;
        } else if (filter.type === "number") {
          const num = typeof val === "number" ? val : parseFloat(String(val || "0"));
          if (filter.min != null && num < filter.min) return false;
          if (filter.max != null && num > filter.max) return false;
        }
      }
      return true;
    });
  }, [deals, activeFilters, getFieldValue]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const va = getFieldValue(a, sortKey);
      const vb = getFieldValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir, getFieldValue]);

  const perPage = 15;
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const getDeal = useCallback((deal: Deal): Deal => dirtyDeals.get(deal.id) || deal, [dirtyDeals]);

  // Edit helpers
  const updateField = useCallback((dealId: string, originalDeal: Deal, field: keyof Deal, value: string | number) => {
    setDirtyDeals((prev) => {
      const next = new Map(prev);
      const current = next.get(dealId) || { ...originalDeal };
      next.set(dealId, recalculateDeal({ ...current, [field]: value } as Deal));
      return next;
    });
  }, []);

  const updateAgent = useCallback((dealId: string, originalDeal: Deal, idx: number, field: keyof AgentEntry, value: string | number) => {
    setDirtyDeals((prev) => {
      const next = new Map(prev);
      const current = next.get(dealId) || { ...originalDeal };
      const agents = [...current.agents];
      agents[idx] = { ...agents[idx], [field]: value };
      next.set(dealId, recalculateDeal({ ...current, agents }));
      return next;
    });
  }, []);

  const updatePartner = useCallback((dealId: string, originalDeal: Deal, idx: number, field: keyof ExternalPartnerEntry, value: string | number) => {
    setDirtyDeals((prev) => {
      const next = new Map(prev);
      const current = next.get(dealId) || { ...originalDeal };
      const externalPartners = [...(current.externalPartners || [])];
      externalPartners[idx] = { ...externalPartners[idx], [field]: value };
      next.set(dealId, recalculateDeal({ ...current, externalPartners }));
      return next;
    });
  }, []);

  const updatePayable = useCallback((dealId: string, originalDeal: Deal, idx: number, field: string, value: string | number) => {
    setDirtyDeals((prev) => {
      const next = new Map(prev);
      const current = next.get(dealId) || { ...originalDeal };
      const payables = [...(current.payables || [])];
      payables[idx] = { ...payables[idx], [field]: value };
      next.set(dealId, { ...current, payables });
      return next;
    });
  }, []);

  const updateReceivable = useCallback((dealId: string, originalDeal: Deal, idx: number, field: string, value: string | number) => {
    setDirtyDeals((prev) => {
      const next = new Map(prev);
      const current = next.get(dealId) || { ...originalDeal };
      const receivables = [...(current.receivables || [])];
      receivables[idx] = { ...receivables[idx], [field]: value };
      next.set(dealId, { ...current, receivables });
      return next;
    });
  }, []);

  const editHelpers: EditHelpers = { updateField, updateAgent, updatePartner, updatePayable, updateReceivable, fmt };

  const handleSaveAll = () => {
    if (dirtyDeals.size === 0) return;
    onDealsUpdate?.(deals.map((d) => dirtyDeals.get(d.id) || d));
    setDirtyDeals(new Map());
  };

  const handleFilterApply = useCallback((key: string, filter: ActiveFilter | null) => {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      if (filter) next.set(key, filter);
      else next.delete(key);
      return next;
    });
    setPage(1);
  }, []);

  const filterConfigs = useMemo(() => {
    const map: Record<string, ColumnFilterConfig> = {};
    allColumns.forEach((c) => {
      if (c.filterType) {
        map[c.key] = { key: c.key, label: c.label, type: c.filterType, options: c.filterOptions };
      }
    });
    return map;
  }, [allColumns]);

  const activeFilterList = useMemo(() => [...activeFilters.values()], [activeFilters]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] text-muted-foreground font-medium">{totalCount} deal{totalCount !== 1 ? "s" : ""}</span>
        <ColumnVisibilityManager
          groups={columnGroups}
          columnLabels={columnLabels}
          visibleColumns={visibleColumns}
          onChange={setVisibleColumns}
        />
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={activeFilterList}
        onRemove={(key) => handleFilterApply(key, null)}
        onClearAll={() => { setActiveFilters(new Map()); setPage(1); }}
      />

      {/* Dirty deal bar */}
      {dirtyDeals.size > 0 && (
        <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-[13px] font-medium text-foreground">{dirtyDeals.size} deal{dirtyDeals.size > 1 ? "s" : ""} modified</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setDirtyDeals(new Map())} className="px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-md bg-card hover:bg-muted transition-colors">Discard</button>
            <button onClick={handleSaveAll} className="px-4 py-1.5 text-[12px] font-semibold text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity">Save All Changes</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl overflow-hidden border border-border min-w-0 w-full">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full" style={{ minWidth: `${PINNED_WIDTH + visibleCols.reduce((sum, col) => sum + parseMinWidth(col.width), 0)}px` }}>
            <thead>
              {/* Group header row + Sub-group header row */}
              {(() => {
                // Determine which groups have actual sub-groups
                const groupsWithSubs = new Set<string>();
                subGroupHeaders.forEach(sh => { if (sh.subGroup) groupsWithSubs.add(sh.group); });

                // Deal Info never has sub-groups in practice
                const dealInfoHeader = groupHeaders.find(gh => gh.group === "dealInfo");
                const dealInfoSpan = dealInfoHeader ? dealInfoHeader.span : 0;

                return (
                  <>
                    <tr>
                      <th
                        colSpan={3 + dealInfoSpan}
                        rowSpan={hasSubGroups ? 2 : 1}
                        className={`${groupHeaderClass} bg-blue-50 text-blue-700 border-b border-border border-r-2 border-r-border sticky left-0 z-10 min-w-[340px]`}
                      >
                        Deal Info
                      </th>
                      {groupHeaders.filter(gh => gh.group !== "dealInfo").map((gh, i) => {
                        const s = GROUP_STYLES[gh.group] || GROUP_STYLES.notes;
                        const hasSubs = groupsWithSubs.has(gh.group);
                        return (
                          <th
                            key={`${gh.group}-${i}`}
                            colSpan={gh.span}
                            rowSpan={hasSubGroups && !hasSubs ? 2 : 1}
                            className={`${groupHeaderClass} ${s.bg} ${s.text} ${hasSubs ? s.border : "border-b border-border"} border-r-2 border-r-border/60`}
                          >
                            {gh.label}
                          </th>
                        );
                      })}
                    </tr>
                    {hasSubGroups && (
                      <tr>
                        {(() => {
                          // Only render sub-header cells for groups that have sub-groups
                          const nonDealInfoSubs = subGroupHeaders.filter(sh => sh.group !== "dealInfo" && groupsWithSubs.has(sh.group));
                          return nonDealInfoSubs.map((sh, idx) => {
                            const sgColor = getSubGroupColor(sh.group, sh.subGroup);
                            const nextSub = nonDealInfoSubs[idx + 1];
                            const isGroupBoundary = nextSub && nextSub.group !== sh.group;
                            return (
                              <th
                                key={`sub-${sh.group}-${sh.subGroup}-${idx}`}
                                colSpan={sh.span}
                                className={`px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider ${sgColor} border-b border-border ${isGroupBoundary ? "border-r-2 border-r-border" : "border-r border-r-border/30"} text-center`}
                              >
                                {sh.subGroup}
                              </th>
                            );
                          });
                        })()}
                      </tr>
                    )}
                  </>
                );
              })()}
              {/* Column header row */}
              <tr>
                {/* Frozen: Deal ID */}
                <th className={`${thBase} sticky left-0 z-10 bg-blue-50`} style={{ minWidth: 110, width: 110, maxWidth: 110 }}>
                  <span className="flex items-center justify-center">Deal ID</span>
                </th>
                {/* Frozen: Status */}
                <th className={`${thBase} sticky left-[110px] z-10 bg-blue-50`} style={{ minWidth: 160, width: 160, maxWidth: 160 }}>
                  <div className="flex items-center gap-0.5 justify-center">
                    <span>Status</span>
                    <ColumnFilterIcon
                      config={{ key: "status", label: "Status", type: "multiselect" as FilterType, options: [...ALL_STATUSES] }}
                      activeFilter={activeFilters.get("status")}
                      onApply={(f) => handleFilterApply("status", f)}
                    />
                  </div>
                </th>
                {/* Frozen: Report Date */}
                <th className={`${thBase} sticky left-[270px] z-10 bg-blue-50 border-r-2 border-r-border`} style={{ minWidth: 100, width: 100, maxWidth: 100 }}>
                  <span className="flex items-center justify-center text-[11px]">Report Date</span>
                </th>
                {/* Dynamic columns */}
                {visibleCols.map((col, idx) => {
                  const sd = sortKey === col.key ? sortDir : null;
                  const fc = filterConfigs[col.key];
                  const nextCol = visibleCols[idx + 1];
                  const isGroupEnd = nextCol && nextCol.group !== col.group;
                  const groupStyle = GROUP_STYLES[col.group] || GROUP_STYLES.notes;
                  const isFrozen = frozenColOffsets.has(idx);
                  const frozenStyle = isFrozen ? `sticky z-[8] bg-blue-50` : groupStyle.headerTint;
                  const frozenWidth = isFrozen ? parseMinWidth(col.width) : undefined;
                  const frozenLeft = isFrozen
                    ? { left: `${frozenColOffsets.get(idx)}px`, ...(frozenWidth ? { minWidth: `${frozenWidth}px`, width: `${frozenWidth}px`, maxWidth: `${frozenWidth}px` } : {}) }
                    : undefined;
                  return (
                    <th
                      key={col.key}
                      className={`${thBase} ${col.width} ${isGroupEnd ? "border-r-2 border-r-border" : "border-r border-border/20"} ${frozenStyle}`}
                      style={frozenLeft}
                    >
                      <div className="flex items-center gap-0.5 justify-center">
                        {col.sortable ? (
                          <button onClick={() => handleSort(col.key)} className="flex items-center gap-0.5 hover:text-primary transition-colors">
                            <span className="text-[11px]">{col.label}</span>
                            {sd === "asc" ? <ArrowUp className="h-3 w-3" /> : sd === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40" />}
                          </button>
                        ) : (
                          <span className="text-[11px]">{col.label}</span>
                        )}
                        {fc && (
                          <ColumnFilterIcon
                            config={fc}
                            activeFilter={activeFilters.get(col.key)}
                            onApply={(f) => handleFilterApply(col.key, f)}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginated.map((originalDeal) => {
                const deal = getDeal(originalDeal);
                const isDirty = dirtyDeals.has(deal.id);
                const EDITABLE_STATUSES: Deal["status"][] = ["Reported", "Pending Details", "Under Review"];
                const isRowEditable = EDITABLE_STATUSES.includes(deal.status);

                return (
                  <tr
                    key={deal.id}
                    className={`border-b border-border transition-colors ${isDirty ? "bg-[hsl(var(--row-highlight))]" : "hover:bg-muted/30"}`}
                  >
                    {/* Frozen: Deal ID */}
                    <td className={`${tdClass} font-semibold sticky left-0 z-[5] ${isDirty ? "bg-[hsl(var(--row-highlight))]" : "bg-card"}`} style={{ minWidth: 110, width: 110, maxWidth: 110 }}>
                      <div className="flex items-center gap-1.5">
                        {isDirty && <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />}
                        <a
                          href={`/deals/${deal.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        >
                          {deal.id}
                        </a>
                      </div>
                    </td>
                    {/* Frozen: Status */}
                    <td className={`px-2 py-2 sticky left-[110px] z-[5] ${isDirty ? "bg-[hsl(var(--row-highlight))]" : "bg-card"}`} style={{ minWidth: 160, width: 160, maxWidth: 160 }}>
                      <DealStatusBadge status={deal.status} isDisputed={deal.isDisputed} />
                    </td>
                    {/* Frozen: Report Date */}
                    <td className={`${tdClass} sticky left-[270px] z-[5] border-r-2 border-r-border ${isDirty ? "bg-[hsl(var(--row-highlight))]" : "bg-card"}`} style={{ minWidth: 100, width: 100, maxWidth: 100 }}>
                      {isRowEditable ? (
                        <input
                          type="date"
                          value={deal.reportDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDirtyDeals((prev) => {
                              const next = new Map(prev);
                              const current = next.get(deal.id) || { ...originalDeal };
                              next.set(deal.id, { ...current, reportDate: val });
                              return next;
                            });
                          }}
                          className="w-full px-1.5 py-1 border border-border rounded text-[12px] bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      ) : (
                        formatDate(deal.reportDate)
                      )}
                    </td>
                    {/* Dynamic columns */}
                    {visibleCols.map((col, idx) => {
                      const nextCol = visibleCols[idx + 1];
                      const isGroupEnd = nextCol && nextCol.group !== col.group;
                      const borderCls = isGroupEnd ? "border-r-2 border-r-border" : "border-r border-border/10";
                      const isFrozen = frozenColOffsets.has(idx);
                      const frozenCls = isFrozen ? `sticky z-[4] ${isDirty ? "bg-[hsl(var(--row-highlight))]" : "bg-card"}` : "";
                      const frozenLeft = isFrozen ? { left: `${frozenColOffsets.get(idx)}px` } : undefined;

                      const cellWidthClass = col.width;
                      const frozenWidth = isFrozen ? parseMinWidth(col.width) : undefined;
                      const frozenFixedStyle = frozenLeft ? { ...frozenLeft, ...(frozenWidth ? { minWidth: `${frozenWidth}px`, width: `${frozenWidth}px`, maxWidth: `${frozenWidth}px` } : {}) } : undefined;

                      if ((isRowEditable || col.group === "notes") && col.editable && col.editRender) {
                        const el = col.editRender(deal, originalDeal, editHelpers);
                        if (React.isValidElement(el)) {
                          const existingStyle = (el.props as { style?: React.CSSProperties }).style;
                          return React.cloneElement(el as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
                            key: col.key,
                            className: `${(el.props as { className?: string }).className || ""} ${cellWidthClass} ${borderCls} ${frozenCls}`.trim(),
                            ...(frozenFixedStyle
                              ? { style: { ...existingStyle, ...frozenFixedStyle } }
                              : {}),
                          });
                        }
                        return <React.Fragment key={col.key}>{el}</React.Fragment>;
                      }
                      const content = col.render(deal, fmt);
                      const disputeHighlight = col.key === "disputeNote" && deal.isDisputed && deal.disputeNote
                        ? "outline outline-1 outline-destructive -outline-offset-1 bg-destructive/5"
                        : "";
                      return (
                        <td
                          key={col.key}
                          className={`${tdClass} ${cellWidthClass} ${col.align === "right" ? "text-right tabular-nums" : "text-left"} ${borderCls} ${frozenCls} ${disputeHighlight}`}
                          style={frozenFixedStyle}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length + 3} className="px-4 py-8 text-center text-muted-foreground text-[13px]">No deals match the selected filters</td>
                </tr>
              )}
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
          <input type="number" value={page} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }} className="w-12 h-8 text-center border border-border rounded px-1 text-[14px] bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
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

/* ═══ Helpers ═══ */

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

