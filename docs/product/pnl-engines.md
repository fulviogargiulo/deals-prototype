<!-- Confluence: https://huspy.atlassian.net/wiki/spaces/corp/pages/2441248770 -->

# 1. The core idea

Every time a Tranche is saved or its status changes, the system runs a **P&L engine** in the background. The engine reads the Tranche's details: what Huspy earned (derived from `REVENUE_SOURCE` PnlEntry amounts), who the agents are, whether an external partner was involved, and produces a set of numbers: agent payouts, acquisition and operational costs, and Huspy's net margin.

The engine chosen depends on the `pnlEngine` **field** on the Tranche — set at Tranche creation (inherited from the Deal's business unit and channel) and visible on the deal/tranche detail page. `channel` is a separate reporting field on the Deal; it does not drive engine selection. This separation means new markets and channels can be onboarded without changing engine logic: ops picks the right engine at creation time, and the system knows exactly which calculation to run.

Each engine has its own rules for where the money comes from and how it is distributed.

# 2. Party ledger treatment

Every party on a Tranche is linked via a `PnlEntry` record with a specific `role`.

| Actor | Business Unit | Stakeholder role | GL account | Subledger per party |
| --- | --- | --- | --- | --- |
| Client / buyer | REBU | `REVENUE_SOURCE` | `AR_{CUR}` | N |
| Developer | REBU | `REVENUE_SOURCE` | `AR_{CUR}` | N |
| Lending bank | Mortgage (all channels) | `REVENUE_SOURCE` | `AR_{CUR}` | N |
| REBU agent (salaried or commission) | REBU | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| Team Lead | REBU | derived from AgentFinancials `connectedAgents` | `LIAB_AGENT_{CUR}` | Y |
| Manager | REBU | derived from AgentFinancials `connectedAgents` | `LIAB_AGENT_{CUR}` | Y |
| MA broker | Mortgage MA | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| BYOB broker | Mortgage BYOB | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| Huspy mortgage agent | Mortgage REA / DS / B2C | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| BBG Commercial RM | Mortgage BBG | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| BBG Team Lead | Mortgage BBG | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| BBG Internal DS/MA | Mortgage BBG | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| BBG External broker | Mortgage BBG | `AGENT_PAYOUT` | `LIAB_AGENT_{CUR}` | Y |
| Co-broker, Huspy-borne (external firm) | REBU | `ACQUISITION_DEDUCTION` | `EXT_PAYABLE_{CUR}` | N |
| Referral/co-broker, agent-borne (ext) | REBU | `ACQUISITION_DEDUCTION` + `chargedTo` in CSV | `EXT_PAYABLE_{CUR}` | N |
| Referral party - external firm | Mortgage REA / DS / B2C | `OPERATIONAL_DEDUCTION` | `EXT_PAYABLE_{CUR}` | N |
| Referral party - REBU agent or broker | Mortgage REA / DS / B2C | `OPERATIONAL_DEDUCTION` | `LIAB_AGENT_{CUR}` | Y |
| Notary / conveyance firm | REBU | `OPERATIONAL_DEDUCTION` | `EXT_PAYABLE_{CUR}` | N |
| Buyer / borrower | All | `DealParticipant` (DEMAND) | — | N — identity only, no P&L effect |
| Seller / developer / bank | All | `DealParticipant` (SUPPLY) | — | N — identity only, no P&L effect |

**The settlement rule**

Settlement path is driven by whether the **party** has a subledger registered in the ledger system, not by their stakeholder role alone:

* **Party has a subledger** → payout is settled via commission accrual posting to that subledger. No invoice is raised automatically by deal status change.
* **Party has no subledger** → payout flows through `EXT_PAYABLE` and is settled via an invoice.

`AGENT_PAYOUT` parties always have a subledger (this is guaranteed). `ACQUISITION_DEDUCTION` and `OPERATIONAL_DEDUCTION` parties typically do not, unless the party is a registered agent or broker from another deal type.

**Cross-BU case:** A REBU agent acting as referral source on an MBU REA / DS / B2C deal holds an `OPERATIONAL_DEDUCTION` stakeholder role (which triggers the externally-sourced rate). Because the agent already has an `AgentLiability_` subledger, their referral fee posts directly to that subledger at the commission accrual step. No invoice is raised for them. The MBU mortgage agent's commission is still calculated at the externally-sourced rate.

**Three invariants the system enforces:**

1. `AGENT_PAYOUT` always → subledger → commission accrual posting (no invoice ever)
2. Cost party (any role) with a subledger → commission accrual posting to that subledger (no invoice)
3. Cost party without a subledger → `EXT_PAYABLE` → inbound invoice

# 3. The engines

| **pnlEngine** | **Typical channels** | **Who closes the deal** | **Commission trigger** |
| --- | --- | --- | --- |
| `rebu` | Any REBU channel | Huspy's real-estate agents | Deal → Finalized |
| `mbu-ma-broker` | MA, BYOB | External mortgage broker | Deal → Invoicing |
| `mbu-direct` | REA, DS, B2C | Huspy mortgage agent | Deal → Invoicing |
| `manual` | BBG, or any deal with fixed declared payouts | Mixed or manually entered | Deal → Invoicing |

**Connected agents rule**

Every Huspy agent can have **Connected Agents** (i.e. team lead, manager…) configured in their Agent Financials **per engine**. When present, the system automatically calculates their payouts from the agent's net commission and adds them to Huspy's cost — they are **never** deducted from the agent's take-home. This applies to `rebu`, `mbu-ma-broker`, and `mbu-direct`.

Connected agents are per-AF record: an agent's team lead on a REBU deal may differ from their team lead on an MBU direct deal. Finance configures them separately in the agent's profile under each engine tab.

For `manual`, connected agent payouts are **not** auto-calculated. Declare them explicitly as additional `AGENT_PAYOUT` stakeholders with a fixed `Amount`.

**P&L waterfall - universal structure**

All engines share the same waterfall. What varies is what fills each bucket.

```
Gross Revenue              (client/bank commission)
  + other revenue sources  (e.g. conveyance)
  − Acquisition Costs      (Huspy-borne co-broker fees — reduce agent commission pool)
= Net Revenues / Commission Base
  − Agent Commission       (strategy/rate × split share, per agent)
    − Agent-borne costs    (if any, deducted from that agent's gross commission only)
    = Agent take-home
    + Team Lead            (% of agent take-home — additive Huspy cost)
    + Manager              (% of agent take-home — additive Huspy cost)
  − Operational Costs      (service fees, referral fees — Huspy-borne, paid after agents)
  ─────────────────────────────────────────────
  = Huspy Net Margin
```

Not every bucket is filled in every engine — see the per-engine sections below.

**Multi-Tranche deals**

Some deals involve multiple financial settlement events. These are modelled as `Tranche` records on the same `Deal` — not as separate deals.

* **Spain REBU:** deposit commission (Arras) + completion commission (Escritura). Each is a Tranche with its own `REVENUE_SOURCE` stakeholder amount, P&L confirmation, document checklist, and outbound invoice. The total `dealAmount` on the Deal is the sum of both payment events.
* **MBU off-plan mortgage disbursements:** a mortgage disbursed in stages generates one Tranche per disbursement. `disbursedAmount` is set on each MBU Tranche to record the actual amount disbursed. Broker GMV (MA channel) aggregates `disbursedAmount` across all Tranches for the broker in the same reporting month, so tier qualification works correctly across Tranches.
* **Referral fee (REA / DS / B2C only):** the 0.3% fee is a one-time origination cost. Only include the `OPERATIONAL_DEDUCTION` stakeholder on the **first** Tranche. Subsequent Tranches on the same deal are treated as self-sourced.

The engine runs independently per Tranche. Each Tranche generates its own commission posting at the Invoicing transition.

## 3.1 REBU

**Where the revenue comes from**

The **client or developer** pays Huspy a commission on the property transaction. This is declared as one or more **Revenue Lines** on the deal. The total is Huspy's gross revenue for the deal.

**How agent pay is calculated**

Each agent has a **commission strategy** on file (set by Finance via the Agent Financials upload):

* **Flat %** — agent earns a fixed percentage of the revenue attributed to them (e.g. 40%)
* **Slab** — the rate increases in steps as the deal value rises (e.g. 35% up to AED 5,000, then 45%)
* **Max/Cap** — a flat rate with a ceiling payout amount

When multiple agents share a deal, each agent's strategy applies only to their share of the revenue pool (their split %).

**What fills each bucket**

| Bucket | REBU source |
| --- | --- |
| Gross Revenue | Client / developer commission (one or more REVENUE_SOURCE lines) |
| Acquisition Costs | Huspy-borne co-broker fees (ACQUISITION_DEDUCTION without chargedTo) |
| Agent-borne costs | Referral fees the agent absorbs (ACQUISITION_DEDUCTION with chargedTo) |
| Operational Costs | Notary, legal, conveyance fees (OPERATIONAL_DEDUCTION) |

**CSV upload example**

**Scenario:** Off-plan apartment at Marina Tower. Two agents split the deal (60/40). A co-broker referred the listing to Agent 1 and charges Agent 1 AED 2,000 (agent-borne, via `chargedTo`). Huspy also pays a separate AED 5,000 co-broker fee for the buyer side (Huspy-borne). Agents also have Team Lead and a Manager on file. After closing, a notary fee of AED 1,200 is charged to Huspy.

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-REBU-001,Marina Tower 1604,primary,rebu,,ae,AED,2500000,2026-04-15,REVENUE_SOURCE,party-client-001,50000,2% client commission,,,
TEST-REBU-001,,,,,,,,,AGENT_PAYOUT,party-agent-001,,,,60,
TEST-REBU-001,,,,,,,,,AGENT_PAYOUT,party-agent-002,,,,40,
TEST-REBU-001,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-REBU-001,,,,,,,,,SUPPLY,party-developer-001,,,,,
TEST-REBU-001,,,,,,,,,ACQUISITION_DEDUCTION,party-cobroke-001,5000,Buyer-side co-broker (Huspy-borne),,,
TEST-REBU-001,,,,,,,,,ACQUISITION_DEDUCTION,party-cobroke-002,2000,Listing referral (borne by Agent 1),party-agent-001,,
TEST-REBU-001,,,,,,,,,OPERATIONAL_DEDUCTION,party-notary-001,1200,Notary fee,,,
```

**Expected P&L**:

| Line | Amount |
| --- | --- |
| Gross revenue | AED 50,000 |
| − Co-broker fee (Huspy-borne) | − AED 5,000 |
| = Commission base | AED 45,000 |
| Agent 1 pool (60% × 45,000) | AED 27,000 |
| Agent 1 gross commission (40%) | AED 10,800 |
| − Listing referral (agent-borne) | − AED 2,000 |
| = Agent 1 take-home | AED 8,800 |
| + Team Lead (10% × 8,800) | AED 880 |
| + Manager (5% × 8,800) | AED 440 |
| Agent 2 pool (40% × 45,000) | AED 18,000 |
| Agent 2 commission (45%) | AED 8,100 |
| + Team Lead (10% × 7,200) | AED 810 |
| + Manager (5% × 7,200) | AED 405 |
| Total agent payout (Huspy cost) | AED 21,435 |
| = Huspy gross share | AED 23,565 |
| − Notary | − AED 1,200 |
| **= Huspy net** | **AED 22,365** |

Team Lead and Manager do not appear in the CSV — they are read automatically from the agent's profile at calculation time.

## 3.2 MBU MA/Broker

**Where the revenue comes from**

The **bank** pays Huspy a commission on the disbursed mortgage amount. Huspy then pays a portion of that to the external broker.

**How broker pay is calculated**

Broker rates are not fixed. They are set monthly by BizOps and uploaded via the **Broker Rate Slabs** tab in Deal Configuration. The rate depends on:

1. **Which bank** the mortgage is placed with
2. **The broker's total disbursed volume across all banks** in that month — brokers with higher volume qualify for a higher tier

Example: A broker places AED 6,000,000 in April. The threshold for Tier 2 is AED 5,000,000, so they qualify for the higher rate. DIB in Tier 2 = 0.720%. If their allocated share on a AED 2,800,000 deal is 60%, their payout = 60% × 2,800,000 × 0.720% = AED 12,096.

**What fills each bucket**

| Bucket | MBU MA/Broker source |
| --- | --- |
| Gross Revenue | Bank commission on disbursed mortgage amount (REVENUE_SOURCE from bank) |
| Acquisition Costs | — normally not used — |
| Agent Commission | Broker payout resolved from monthly Broker Rate Slab (bank + broker GMV tier) |
| Operational Costs | — normally not used — |

**CSV upload example**

Broker payout `amount` left blank as it is resolved from Broker Rate Slabs at calculation time using `reportDate` month + bank (SUPPLY partyId) + broker GMV.

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-MA-001,Burj View Apt 2201,primary,mortgage,MA,ae,AED,3000000,2026-04-15,REVENUE_SOURCE,party-third-adib,36000,Bank commission 1.2% of 3000000,,,
TEST-MA-001,,,,,,,,,AGENT_PAYOUT,party-broker-omar-rahman,,,,70,
TEST-MA-001,,,,,,,,,AGENT_PAYOUT,party-broker-sara-mansoor,,,,30,
TEST-MA-001,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-MA-001,,,,,,,,,SUPPLY,party-third-adib,,,,,
```

**Expected P&L** (Tier 1 ADIB rate 0.663% of principal):

| Line | Amount |
| --- | --- |
| Gross revenue | AED 36,000 |
| − Broker 1 (70% × 3,000,000 × 0.663%) | − AED 13,923 |
| − Broker 2 (30% × 3,000,000 × 0.663%) | − AED 5,967 |
| **= Huspy net** | **AED 16,110** |

Broker tier is determined by their total disbursed volume across all deals in the same reporting month. If either broker exceeds the Tier 2 threshold, the rate and therefore Huspy net will differ.

## 3.3 MBU BYOB

**Where the revenue comes from**

Same as MA/Broker: the **bank** pays Huspy a commission on the disbursed mortgage amount.

**How broker pay is calculated**

BYOB uses the same Broker Rate Slab lookup as MA (bank + broker GMV tier → rate). The difference is a **per-broker service fee** configured in the broker's Agent Financials profile (`byobPenaltyRate`). This fixed rate (in percentage points, typically 0.10–0.50%) is subtracted from the slab rate before applying it to the disbursed amount:

```
netBrokerPayout = (slabRate − byobPenaltyRate) × disbursedAmount
```

The penalty is set by Finance and it varies per broker and does not change with the monthly slab upload.

**What fills each bucket**

| Bucket | MBU BYOB source |
| --- | --- |
| Gross Revenue | Bank commission on disbursed mortgage amount (REVENUE_SOURCE from bank) |
| Acquisition Costs | — normally not used — |
| Agent Commission | (slabRate − byobPenaltyRate) × disbursedAmount; penalty in pct points from broker's Agent Financials |
| Operational Costs | — normally not used — |

**CSV upload example**

**Scenario:** BYOB broker with a 0.10% service fee. Slab rate for ADIB Tier 1 = 0.663%. Net broker rate = 0.663% − 0.10% = 0.563%.

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-BYOB-001,Palm View Apt 1801,primary,mortgage,BYOB,ae,AED,2000000,2026-04-15,REVENUE_SOURCE,party-third-adib,24000,Bank commission 1.2% of 2000000,,,
TEST-BYOB-001,,,,,,,,,AGENT_PAYOUT,party-byob-broker-nadia-hassan,,,,100,
TEST-BYOB-001,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-BYOB-001,,,,,,,,,SUPPLY,party-third-adib,,,,,
```

**Expected P&L** (Tier 1 ADIB rate 0.663%, byobPenaltyRate 0.10%):

| Line | Amount |
| --- | --- |
| Gross revenue | AED 24,000 |
| − Broker payout (2,000,000 × 0.563%) | − AED 11,260 |
| **= Huspy net** | **AED 12,740** |

Without the penalty the broker would receive AED 13,260 (0.663%). Huspy keeps AED 2,000 as a service fee.

## 3.4 MBU REA / DS / B2C

These three channels share the same engine logic. The difference is which team of Huspy employees closes the deal:

* **REA** — the lead came from a Real Estate Agent partner (REBU or another agency)
* **DS** — the lead came via Direct Sales outreach
* **B2C** — the customer came directly to Huspy (online, walk-in, etc.)

**Where the revenue comes from**

The **bank** pays Huspy a commission on the disbursed mortgage amount. Unlike MA/Broker, the agent closing the deal is a Huspy employee, not an external broker.

**Self-sourced vs externally sourced**

| Situation | What it means | Effect on agent pay |
| --- | --- | --- |
| **Self-sourced** | No referral party on the deal | Agent gets the higher rate |
| **Externally sourced** | A referral party is listed as an Operational Deduction on the deal | Agent gets the lower rate; referral party gets 0.3% of the disbursed principal |

The system detects this automatically: if any Operational Deduction stakeholder is present on the deal, it is treated as externally sourced. The referral fee is paid out of Huspy's margin after agent commission, it does not reduce the agent's commission base.

The referral party's fee defaults to **0.3% of the disbursed mortgage amount (principal)** unless the ops team manually overrides the amount on the deal.

**How agent pay is calculated**

Agent rates are set monthly by BizOps and uploaded via the **MBU Direct Rates** tab in Deal Configuration. A rate is configured per channel (REA / DS / B2C) and applies to all agents working that channel in that month.

|  | Self-sourced rate | Externally sourced rate |
| --- | --- | --- |
| REA (example, Apr 2026) | 25% | 20% |
| DS (example, Apr 2026) | 30% | 25% |
| B2C (example, Apr 2026) | 28% | 23% |

Example: Disbursed principal AED 500,000 · bank commission AED 10,000 · B2C deal sourced via a referral partner → agent gets 23% of AED 10,000 = AED 2,300 · referral party gets 0.3% of AED 500,000 = AED 1,500 · Huspy keeps AED 6,200.

**What fills each bucket**

| Bucket | MBU REA / DS / B2C source |
| --- | --- |
| Gross Revenue | Bank commission on disbursed mortgage amount (REVENUE_SOURCE from bank) |
| Acquisition Costs | — normally not used — |
| Agent Commission | Monthly direct rate for channel × sourcing type (self or external) |
| Operational Costs | Referral party fee — 0.3% of principal by default (OPERATIONAL_DEDUCTION, externally sourced deals only) |

**CSV upload example**

Agent payout `amount` left blank — resolved from MBU Direct Rates using `reportDate` month + channel + sourcing type (detected from presence of OPERATIONAL_DEDUCTION).

**REA — externally sourced**

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-REA-001,Creek View Studio 801,primary,mortgage,REA,ae,AED,2000000,2026-04-15,REVENUE_SOURCE,party-third-fab,22000,Bank commission 1.1% of 2000000,,,
TEST-REA-001,,,,,,,,,AGENT_PAYOUT,party-agent-001,,,,100,
TEST-REA-001,,,,,,,,,DEMAND,party-client-001,,,,,
TEST-REA-001,,,,,,,,,SUPPLY,party-third-fab,,,,,
TEST-REA-001,,,,,,,,,OPERATIONAL_DEDUCTION,party-third-inmobiliaria-grupo-norte,0,Referral fee - engine defaults to 0.3% of principal,,,
```

**Expected P&L** (Apr 2026, externally sourced REA rate 20%):

| Line | Amount |
| --- | --- |
| Gross revenue | AED 22,000 |
| − Agent (20% × 22,000) | − AED 4,400 |
| = Huspy gross share | AED 17,600 |
| − Referral fee (0.3% × 2,000,000) | − AED 6,000 |
| **= Huspy net** | **AED 11,600** |

**REA - referral source is a REBU agent**

When the referral party is a Huspy REBU agent (rather than an external firm), the deal structure is identical — the agent still appears as `OPERATIONAL_DEDUCTION` with the 0.3% referral fee. The difference is entirely in settlement: because the REBU agent has an `AgentLiability_` subledger, the referral fee posts directly to their subledger at the commission accrual step. No invoice is raised for them. The MBU mortgage agent's commission is still calculated at the externally-sourced rate.

## 3.5 BBG / Commercial channel

The `manual` engine is for deals where all payouts are entered as fixed amounts, no rate lookup, no strategy resolution. The system sums the declared `Amount` values across all `AGENT_PAYOUT` stakeholders and computes Huspy's margin as the remainder.

Use it for:

* BBG / Commercial channel - the primary use case (see below)
* Any deal that does not fit an existing calculated engine (e.g. a new channel being onboarded, a one-off correction deal)

**BBG - Where the revenue comes from**

The **bank** pays Huspy a commission on the transaction amount.

**BBG - How payouts are calculated**

BBG has multiple sub-channels (Self-Generated, Real Estate Agent, Marketing, Direct Sales, Broker, TWC, Alma, BL/TWC, BYOB), each with a different split structure across up to four parties:

| Sub-channel | Commercial RM | Team Lead | Internal DS/MA | External |
| --- | --- | --- | --- | --- |
| Self-Generated | 60% | 5% | — | — |
| Real Estate Agent | 30% | 5% | — | 45% |
| Marketing | 50% | 5% | — | — |
| Direct Sales | 30% | 5% | 60% | — |
| Broker | 25% | 5% | 5% | 54% |
| TWC | 25% | 5% | 5% | 50% |
| Alma | 25% | 5% | — | 50% |
| BL / TWC | 60% | 5% | — | — |
| BYOB | 30% | 5% | 45% | — |

The deal creator applies the correct row from this table offline and enters each party's amount directly as a fixed payout on the deal stakeholder. The system does not enforce or derive the split, it sums the declared payouts and computes Huspy's margin as the remainder.

**What fills each bucket**

| Bucket | BBG source |
| --- | --- |
| Gross Revenue | Bank commission (REVENUE_SOURCE from bank) |
| Agent payouts | Each party entered with a fixed financialAmount on their AGENT_PAYOUT stakeholder |
| Acquisition / Operational Costs | — normally not used — |

**Deal stakeholder structure**

```
REVENUE_SOURCE  → bank (Amount = gross)
AGENT_PAYOUT    → Commercial RM   (Amount = gross × commercialPct%)
AGENT_PAYOUT    → Team Lead       (Amount = gross × 5%)
AGENT_PAYOUT    → Internal DS/MA  (Amount = gross × internalPct%, when applicable)
AGENT_PAYOUT    → External Broker (Amount = gross × externalPct%, when applicable)
DEMAND          → borrower / client
SUPPLY          → bank
```

**Why not configuring these slabs in the product instead of relying on upstream input?**

1. Connected agents payout mechanism inconsistent with other engines (i.e. fixed at 5%)
2. the distribution among the parties does not sum up to 100%, it is not a split between parties like in the case of REBU agents
3. We would need to introduce another level called sub-channel, adding extra complexity

**CSV upload example**

All payouts entered as fixed `financialAmount` — no rate lookup. Apply the sub-channel split table above offline, then enter each party's absolute amount.

**Broker sub-channel**

Gross revenue AED 50,000. Sub-channel: Broker (25% / 5% / 5% / 54%).

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-BBG-001,DIFC Gate Offices Unit 1204,primary,mortgage,BBG,ae,AED,5000000,2026-04-15,REVENUE_SOURCE,party-third-adib,50000,Bank commission 1.0% of 5000000,,,
TEST-BBG-001,,,,,,,,,AGENT_PAYOUT,party-bbg-rm-layla-nasser,,,,,12500
TEST-BBG-001,,,,,,,,,AGENT_PAYOUT,party-bbg-tl-omar-sheikh,,,,,2500
TEST-BBG-001,,,,,,,,,AGENT_PAYOUT,party-bbg-ds-rami-haddad,,,,,2500
TEST-BBG-001,,,,,,,,,AGENT_PAYOUT,party-bbg-ext-falcon-capital,,,,,27000
TEST-BBG-001,,,,,,,,,DEMAND,party-client-012,,,,,
TEST-BBG-001,,,,,,,,,SUPPLY,party-third-adib,,,,,
```

**Expected P&L:**

| Party | Role | Amount |
| --- | --- | --- |
| Commercial RM | AGENT_PAYOUT | AED 12,500 |
| Team Lead | AGENT_PAYOUT | AED 2,500 |
| Internal DS | AGENT_PAYOUT | AED 2,500 |
| External Broker | AGENT_PAYOUT | AED 27,000 |
| **Huspy net** |  | **AED 5,500** |

**Self-Generated sub-channel**

Gross revenue AED 30,000. Sub-channel: Self-Generated (60% / 5%).

```csv
offerId,propertyName,market,businessUnit,channel,country,currency,dealPrice,reportDate,stakeRole,partyId,amount,description,chargedTo,splitPct,financialAmount
TEST-BBG-002,DIFC Gate Offices Unit 1205,primary,mortgage,BBG,ae,AED,3000000,2026-04-15,REVENUE_SOURCE,party-third-fab,30000,Bank commission 1.0% of 3000000,,,
TEST-BBG-002,,,,,,,,,AGENT_PAYOUT,party-bbg-rm-layla-nasser,,,,,18000
TEST-BBG-002,,,,,,,,,AGENT_PAYOUT,party-bbg-tl-omar-sheikh,,,,,1500
TEST-BBG-002,,,,,,,,,DEMAND,party-client-011,,,,,
TEST-BBG-002,,,,,,,,,SUPPLY,party-third-fab,,,,,
```

**Expected P&L:**

| Party | Role | Amount |
| --- | --- | --- |
| Commercial RM | AGENT_PAYOUT | AED 18,000 |
| Team Lead | AGENT_PAYOUT | AED 1,500 |
| **Huspy net** |  | **AED 10,500** |

# 4. When are rates updated?

**Agent Financials are per engine.** Before an agent can be added to a deal, they must have an AF record configured for that deal's engine (Finance → Agent profile → Financials tab → Add engine config). The system enforces this at deal creation and bulk upload — it will block if a non-fixed-amount agent stake has no matching AF record. The `manual` engine is exempt: all payouts are fixed amounts declared on the deal.

An agent can hold AF records for multiple engines (e.g. a REBU agent who also closes B2C mortgage deals has separate `rebu` and `mbu-direct` configs with different commission terms and connected agents).

| Engine | Rate table | Who updates | How often | Where in Karvel |
| --- | --- | --- | --- | --- |
| `rebu` | Agent Financials (flat / slab / cap) | Finance | Per agent change | Agents page → Agent profile → Financials tab |
| `mbu-ma-broker` | Broker Rate Slabs (bank × GMV tier) | BizOps | Monthly | Deal Config → Broker Rate Slabs |
| `mbu-direct` | MBU Direct Rates (channel × sourcing type) | BizOps/Finance | Monthly | Deal Config → MBU Direct Rates |
| `manual` | — no rate table | Deal creator | Per deal | Entered directly on each deal stakeholder |

# 5. P&L Confirmation and Stakeholder Lifecycle

## 5.1 Lifecycle states

Every `PnlEntry` has a `status` field:

| Status | Meaning | Who can edit |
| --- | --- | --- |
| `draft` | Working copy. `amount` on `source: "engine"` stakes is the last engine estimate kept in sync after each ops edit. `source: "manual"` amounts are used by the engine directly. | Ops (when Tranche is in `under-review` or `pending-details` and no P&L approval is pending) |
| `confirmed` | Locked at the invoicing transition. `amount` is the authoritative payout for finance, invoicing, and accounting. | Nobody, immutable |

Stakes are confirmed when the Tranche transitions to **Invoicing**. This is the same moment the Tranche is locked for edits. Stakes on other Tranches of the same Deal are unaffected.

**P&L editing and approval (draft Tranches):**

The P&L display always reads from stake `amount` values directly. `grossRevenue` is always derived at runtime as the sum of `REVENUE_SOURCE` stake amounts — it is not stored on the Tranche. Each time Ops saves an edit, the engine re-runs to keep all `source: "engine"` stake amounts in sync (`syncEngineAmounts`). Ops can make multiple edits and preview the cumulative P&L impact before committing. When ready, Ops submits for Senior Ops approval.

## 5.2 What happens at confirmation (invoicing transition)

The system runs the P&L engine one final time and:

1. **Writes** `amount` on every `AGENT_PAYOUT` stake that was using `splitPercentage` (rate-based). From this point, the waterfall uses the fixed amount directly — no rate re-computation.
2. **Locks connected agent** `AGENT_PAYOUT` stakes (team lead, manager, etc.) by writing their final `amount` and setting `status: "confirmed"`. These stakes already exist as draft from Tranche creation; confirmation locks their amounts in place.
3. **Sets** `status: "confirmed"` on all stakes for the Tranche. Who confirmed and when is on `tranche.statusHistory` (entry where `to === "invoicing"`).

## 5.3 amount + source - override detection

Every `DealStakeholder` has a single `amount` field and a `source` field that records who wrote it:

| `source` | Meaning |
| --- | --- |
| `"engine"` | Amount was computed by the P&L engine (at Tranche creation or after any stake edit). For draft stakes, the engine re-derives live and keeps `amount` in sync; `amount` is the last saved engine estimate. |
| `"manual"` | Amount was explicitly entered by ops. The engine uses this value directly — no recomputation. |

**Override detection:** `source === "manual"` on a rate-based AGENT_PAYOUT stake means ops overrode the engine. The full change history (old value, new value, who, when) lives in `PnlEntryAudit`. Comparing the first and last audit records for a confirmed stake shows the full delta from initial estimate to confirmed value.

# 6. Glossary

| Term | Meaning |
| --- | --- |
| **pnlEngine** | Field on the deal that selects the P&L calculation method. Set at deal creation. |
| **Gross Revenue** | What Huspy receives from the client or bank before any deductions |
| **Huspy Net Margin** | Gross Revenue minus all payouts and costs |
| **Agent Commission** | The portion of Huspy's revenue paid to the closing agent(s) |
| **Acquisition Cost** | Fee paid to an external co-broker who shares a REBU deal with Huspy; reduces the agent commission base |
| **Operational Deduction** | Huspy-borne cost paid after agent commission. For REBU: notary, legal, conveyance fees. For MBU direct channels: the referral party's fee (0.3% of principal by default) |
| **Commission Posting** | The accounting entry that records the agent commission liability in the ledger |
| **Reporting Month** | The YYYY-MM used to look up the correct rate slab for a deal — derived from the deal's report date |
| **Split %** | When two agents share a deal, their combined pool split must sum to 100% |
| **BYOB Penalty Rate** | Per-broker service fee (in percentage points) subtracted from the slab rate for BYOB channel brokers |
