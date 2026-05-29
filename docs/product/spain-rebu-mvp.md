<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2445410312/Spain+REBU+MVP -->
<!-- High-level process flow: https://www.figma.com/board/14IzOPtzeDJFLjmRaFeAL6/Payments---Deals-workflow?node-id=103-968 -->

# Spain REBU MVP

# 1. Scope

| Area | App | In scope | Future phases |
| --- | --- | --- | --- |
| Deal lifecycle | Agent + Karvel | Full state machine, offer submission flow, deal creation CSV upload | Single deal creation UI |
| Deal details page — Stakeholder & P&L | Karvel | Full P&L waterfall, all stakeholder types, **`rebu` engine only** | Connected agent (TL/Manager) overhead UI |
| Deal details page — Document requirements | Karvel | Per-deal checklist, approve/waive, upload | Deal configuration template editing (hardcoded in MVP) |
| Invoice lifecycle | Karvel | Full state machine, invoice auto-creation on `deal.state = invoicing`, bulk status upload (fields TBD) | Automatic comms to clients on `invoice.state = issued`; [Xero integration](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445574152) |
| Deal lifecycle — Agent confirmation | Agent | Pending-details + pending-agent-approval flows, automatic comms on deal status update | — |
| Agent invoice | Agent | Factura upload, IVA/IRPF selection, posting-lines picker | Salaried agents payroll calculation; OCR for document validation |
| Accounting | Karvel | Automated postings, manual correction postings | Ledger creation (hardcoded at the beginning) |
| Karvel UI | Karvel | Deals tab, Invoices tab, Ledger tab | Deal Configuration tab (seeded directly); Agent configuration tab (agent financials hardcoded in MVP) |
| Agent app UI | Agent | Deals tab, Earnings tab | — |

# 2. Open questions

| Process step | Question | Answer |
| --- | --- | --- |
| General | What are the teams/people handling each step of the process? | [TO BE DETERMINED] |
| Deal creation | How is the deal created — offer submission or CSV upload? Is the template OK? | [TO BE DETERMINED] |
| Document requirements | What documents are required per deal in REBU Spain? Channel/market dependent? | [TO BE DETERMINED] |
| P&L calculation | Do we have connected agent cuts in REBU Spain? | [TO BE DETERMINED] |
| P&L approval | Do we need a P&L approval flow with different ops users? | [TO BE DETERMINED] |
| Fund flow | 10% notary payment — how does it work? | [TO BE DETERMINED] |
| Receiving invoices | How are non-agent invoices (e.g. external co-agency) sent to us? Store in Karvel? How to reconcile with the deal? | [TO BE DETERMINED] |
| Creating invoice drafts | Invoice templates? | [TO BE DETERMINED] |
