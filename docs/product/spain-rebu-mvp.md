<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2445410312/Spain+REBU+MVP -->

**High level process flow** [**here**](https://www.figma.com/board/14IzOPtzeDJFLjmRaFeAL6/Payments---Deals-workflow?node-id=103-968&t=HS7ZpSQVjmsTyLiT-0)

## 1. Scope

| **Area** | **App** | **In scope** | **Future phases** |
| --- | --- | --- | --- |
| Deal lifecycle | Agent + Karvel | Full state machine offer submission flow deal creation csv upload | single deal creation UI |
| Deal details page - Stakeholder & P&L | Karvel | Full P&L waterfall, all stakeholder types, rebu-engine only | Connected agent (TL/Manager) overhead UI? |
| Deal details page - Document requirements | Karvel | Per-deal checklist, approve/waive, upload | Deal configuration template editing (hardcoded in mvp) |
| Invoice lifecycle | Karvel | Full state machine Invoice autocreation on deal.state = invoicing bulk status upload (which fields should be provided?) | Automatic comms to clients when invoice.state = issued [Xero integration](https://huspy.atlassian.net/wiki/spaces/corp/pages/2445574152) |
| Deal lifecycle - Agent confirmation | Agent | Pending-details + pending-agent-approval flows automatic comms at deal.status update | - |
| Agent invoice | Agent | Factura upload IVA/IRPF selection Postinglines picker | Salaried agents payroll calculation OCR for document validation |
| Accounting | Karvel | Automated postings manual correction postings | Ledgers creation (hardcoded at the beginning) |
| Karvel UI | Karvel | Deals tab Invoices tab Ledger tab | Deal Configuration tab (can seed data directly) Agent configuration tab (agent financials hardcoded in mvp) |
| Agent app UI | Agent | Deals tab Earnings tab | - |

## 2. Open questions

| **Process step** | **Question** | **Answer** |
| --- | --- | --- |
| General | What are the teams/people handling each step of the process? | Andreas Salazar, (or key account managers). She should be the one moving the deal to invoicing. Gabriel's team afterwards. |
| Deal creation | How is the deal created? either offer submission or csv upload. Is the template ok? | Check with Andreas. Multiple deals get created if there are multiple 'tranches'. I.e. 1 deal per arras and 1 deal per escritura if we collect revenues separately. |
| Documents requirements | What are the documents required per DEAL REBU Spain? dependent on channel/market? | Check with Andreas. Confirm penalties in case of absence of escritura |
| P&L calculation | Do we have connected agents cuts in REBU Spain? | TL will leave soon. But we have KAM bonuses paid (most likely outside product) |
| P&L approval | Do we need P&L approval flow with different ops users? | KAM can change P&L on Karvel and then Andreas team or finance can approve. |
| Fund flow | 10% reservation payment? How does it work? | separate bank account. Double check with Andreas. Complexity lives in Offer domain. Think about when the buyer is also who is paying the commission (netting) |
| Receiving invoices | How are invoices (non agent, e.g. external co-agency) sent to us? Do we need to store them in Karvel? How do we reconcile them with the deal? | manual via email. Think about Xero upload connectivity. |
| Creating invoices draft | Can you please provide templates? | Invoice created via Xero API. Template lives there |

## 3. Implications for Phase 1 scope

The updated §2 answers reshape several Phase 1 build epics. Material implications:

- **Outbound invoicing simplifies.** *"Invoice created via Xero API; template lives there."* Our scope shrinks from "generate invoices" to "trigger Xero + track state locally + reconcile back." See [jira-backlog-draft.md §2.9](jira-backlog-draft.md).
- **Connected agents deferred from Spain MVP.** *"TL will leave soon; KAM bonuses paid most likely outside product."* The connected-agent overlay capability stays in the foundation ([jira-backlog-draft.md §2.1](jira-backlog-draft.md)) but is **not exercised** in Spain MVP. Removes the most common P&L edge case from the first launch.
- **Multi-tranche deals confirmed.** *"1 deal per arras + 1 per escritura when revenues collected separately."* The domain model already supports it (deals are independent entities); call it out explicitly as a tested case during §2.1 build.
- **KAM-driven P&L flow with finance approval.** KAMs edit deal data and P&L on Karvel; Andreas's team or finance approves before deal transitions to invoicing. Andreas is the named owner of the deal-to-invoicing transition. See [jira-backlog-draft.md §2.7](jira-backlog-draft.md).
- **Inbound non-agent invoices manual in MVP.** *"Manual via email"*; Xero upload connectivity is future. Reduces §2.2 inbound scope to "receive file, store reference, link to deal, manually reconcile."
- **Notary 10% has a netting case.** When the buyer also pays the commission, the 10% reservation nets against the commission. Complexity primarily lives in the Offer domain (upstream); Finance product handles the held-funds posting and the netted payout. See [jira-backlog-draft.md §2.10](jira-backlog-draft.md).
- **Several items confirmed off-product.** KAM bonuses, salaried agent payroll, the dedicated 10% bank account — all stay outside the Finance product and are tracked / handled elsewhere.
