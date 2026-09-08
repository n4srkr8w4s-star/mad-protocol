# MAD — Ministry of Active Disorder

> **Market data tells you what the price is.  
> MAD is being built to tell you whether the market itself is behaving normally.**

MAD — **Ministry of Active Disorder** — is an experimental market-disorder intelligence layer being developed for Robinhood Chain, tokenised assets, and eventually broader machine-readable financial infrastructure.

MAD is not intended to be another price feed, charting application, trading terminal, sentiment dashboard, or opaque AI market oracle.

Its purpose is different.

MAD attempts to answer a more structural question:

> **Is the environment around an asset behaving normally, and if not, what exactly is abnormal?**

That requires more than observing a price.

A tokenised asset may have a perfectly valid quoted price while the system around that price is under stress:

- the underlying market may be halted,
- reference data may be stale,
- an oracle may have diverged,
- a multiplier transition may be unresolved,
- market availability may have changed,
- liquidity may be deteriorating,
- an asset may be moving between operational states,
- or several individually understandable conditions may combine into something materially abnormal.

MAD is being built as infrastructure for detecting, representing, explaining, remembering and eventually reasoning about those conditions.

---

# Live Alpha

### MAD Observatory

https://mad-observatory.onrender.com

Human-facing view into MAD state, Radar, Evidence DNA, State Diff and Flight Recorder intelligence.

### MAD API

https://mad-api-kxi9.onrender.com

Machine-readable access to MAD asset intelligence.

MAD is under active alpha development. Interfaces, schemas and capabilities may evolve.

---

# The Core Idea

Traditional market systems are extremely good at answering questions such as:

```text
What is the price?
What is the volume?
What is the spread?
What is the market cap?
What did the asset do today?
```

MAD is interested in a different family of questions:

```text
Where is disorder emerging?

What changed?

Why did MAD classify the market this way?

How did the condition evolve?

Is the current state unusual relative to context?

Which disorders, assets or market structures are connected?

What should an intelligent agent pay attention to?
```

The project is therefore being developed as a sequence of increasingly richer intelligence layers.

```text
OBSERVE
   │
   ▼
DETECT
   │
   ▼
EXPLAIN
   │
   ▼
REMEMBER
   │
   ▼
REASON
   │
   ▼
CONTEXTUALISE
   │
   ▼
CONNECT
```

In MAD today and on the roadmap:

```text
MAD Radar
    │
    ▼
State Diff
    │
    ▼
Evidence DNA
    │
    ▼
Flight Recorder
    │
    ▼
Agentic MAD
    │
    ▼
MAD Shadow
    │
    ▼
MAD Matrix
```

Each layer exists to answer a specific question.

| Layer | Question |
|---|---|
| **MAD Radar** | Where is disorder? |
| **State Diff** | What changed? |
| **Evidence DNA** | Why did MAD say this? |
| **Flight Recorder** | How did it evolve? |
| **Agentic MAD** | What deserves attention, and how should the observed evidence be interpreted? |
| **MAD Shadow** | How abnormal is this relative to context? |
| **MAD Matrix** | What is connected to what? |

The intent is not to jump immediately to AI.

MAD is being built **data-rich first, intelligence-rich second, autonomous last**.

---

# Current Development State

MAD has moved beyond its original smart-contract foundation.

The current alpha spans five major layers:

```text
Robinhood / market / oracle data
              │
              ▼
         MAD Engine
              │
              ▼
   Deterministic MAD State
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
    Radar   Evidence   State Diff
              │
              ▼
       Flight Recorder
              │
      ┌───────┴────────┐
      ▼                ▼
   MAD API        MAD Observatory
                       │
                       ▼
              External consumers
```

Working capabilities currently include:

- canonical Active Disorder definitions,
- deterministic market-disorder evaluation,
- Robinhood Chain asset discovery,
- feed resolution,
- Robinhood asset-state ingestion,
- onchain multiplier observation,
- oracle and heartbeat assessment,
- multi-asset capability classification,
- MAD Radar,
- State Diff,
- Evidence DNA,
- Flight Recorder,
- historical observation replay,
- file-backed durable observation storage when configured,
- public HTTP API,
- human-facing MAD Observatory,
- Solidity state registry,
- stable public Solidity integration interface,
- deterministic severity states,
- evidence and ruleset provenance,
- role-based state publication,
- pause controls,
- and onchain state history through events.

This is still **alpha infrastructure**, not a production market-risk system.

---

# 1. MAD State

MAD State is the deterministic representation of what MAD currently observes for an asset.

A simplified mental model is:

```text
Asset
  │
  ├── Observations
  │
  ├── Assessed disorders
  │
  ├── Active disorders
  │
  ├── Composite score
  │
  └── Severity
```

MAD does not begin with a natural-language model deciding that something "looks risky."

Instead:

1. market and protocol observations are collected,
2. deterministic disorder rules evaluate those observations,
3. each assessed disorder produces explicit evidence,
4. active disorder scores contribute to the composite MAD state,
5. the composite state is published through stable machine-readable representations.

This separation is fundamental.

> **Observation is not interpretation.  
> Evidence is not inference.  
> Explanation is not the decision itself.**

---

# 2. Active Disorders

MAD represents abnormal market conditions through canonical **Active Disorder identifiers**.

The initial namespace currently defines:

| ID | Disorder |
|---|---|
| **AD-001** | `PRICE_DISLOCATION` |
| **AD-002** | `UNDERLYING_TRADING_HALT` |
| **AD-003** | `CORPORATE_ACTION_PENDING` |
| **AD-004** | `MULTIPLIER_TRANSITION` |
| **AD-005** | `REFERENCE_DATA_STALE` |
| **AD-006** | `LIQUIDITY_STRESS` |
| **AD-007** | `MARKET_SESSION_DISLOCATION` |
| **AD-008** | `ORACLE_DEVIATION` |

See:

[`docs/active-disorders.md`](docs/active-disorders.md)

The disorder namespace is intended to be stable and machine-readable.

A disorder identifier should mean the same thing whether it is consumed by:

- the MAD Engine,
- the Solidity registry,
- the Observatory,
- an HTTP client,
- another protocol,
- an SDK,
- or eventually an autonomous agent.

The goal is to make market disorder itself an addressable piece of infrastructure.

---

# 3. MAD Radar

**MAD Radar answers: WHERE?**

Radar scans the MAD asset universe and builds an operational view of where meaningful disorder currently exists.

It is not simply a leaderboard of volatile assets.

Radar combines:

- asset discovery,
- MAD capability,
- successful market evaluation,
- source health,
- composite disorder state,
- transition information,
- and operational availability.

Assets can currently fall into capability states such as:

```text
FULL
PARTIAL
DISCOVERABLE
```

This is deliberate.

MAD should never imply that an asset has been fully assessed when the required evidence is unavailable.

A partial observation is not equivalent to a clean market.

An unavailable source is not equivalent to a zero-risk signal.

---

# 4. State Diff

**State Diff answers: WHAT CHANGED?**

A market state by itself is useful.

A transition between two trustworthy states is substantially more useful.

State Diff compares the latest successful MAD observation against the previous trustworthy baseline and identifies semantic changes such as:

- score changes,
- severity changes,
- disorder activation,
- disorder clearance,
- disorder-state changes,
- assessment changes,
- multiplier changes,
- market-availability changes.

State Diff deliberately ignores ordinary movement that does not alter MAD's semantic state.

For example:

```text
Underlying price changes
Oracle price changes slightly
Deviation remains within tolerance
No disorder activates
MAD score remains 0
```

That is a new observation.

It is **not** necessarily a MAD state change.

This distinction prevents MAD from becoming a noisy price-difference engine.

### Baseline semantics

The first trustworthy observation establishes a baseline:

```text
BASELINE_ESTABLISHED
```

The next trustworthy observation can produce:

```text
DIFF_AVAILABLE
```

A valid diff may still report:

```text
changed: false
```

because two successful observations can legitimately show no material MAD transition.

Failed, partial or capability-only evaluations must not silently destroy the last trustworthy baseline.

---

# 5. Evidence DNA

**Evidence DNA answers: WHY DID MAD SAY THIS?**

A disorder score without inspectable evidence is not sufficient for the kind of infrastructure MAD is trying to become.

Evidence DNA provides deterministic provenance for a MAD decision.

It is not AI-generated prose.

It is not an after-the-fact story.

It is built from the actual observations used by the evaluator.

A simplified Evidence DNA structure is:

```text
Asset
  │
  ├── Composite MAD state
  │
  └── Disorders
       │
       ├── status
       ├── score
       ├── severity
       ├── deterministic reason
       └── evidence facts
```

Disorder states include:

```text
DOMINANT
ACTIVE
INACTIVE
UNASSESSED
```

`DOMINANT` means an active disorder establishes the current composite MAD score.

Multiple disorders may be dominant when their scores tie.

`UNASSESSED` is intentionally distinct from `INACTIVE`.

MAD must not invent evidence for something it could not evaluate.

Examples of Evidence DNA facts currently include:

```text
isTradingHalt
currentMultiplierMatches
transitionPending
expectedCurrentE18
observedOnchainE18
pendingE18
ageSeconds
heartbeatSeconds
heartbeatBreached
marketAvailability
expectedPriceE18
observedPriceE18
deviationBps
direction
```

This creates a deterministic chain:

```text
Observation
   ↓
Rule evaluation
   ↓
Active Disorder
   ↓
Composite MAD state
   ↓
Evidence DNA
```

Eventually, AI reasoning can sit **above** this evidence.

It should not replace it.

---

# 6. Flight Recorder

**Flight Recorder answers: HOW DID IT EVOLVE?**

A system that only knows the current state has no memory.

MAD's Flight Recorder is the first historical intelligence layer in the project.

It records successful trustworthy observations over time.

A Flight Record captures:

- observation time,
- asset identity,
- MAD score,
- MAD severity,
- active disorders,
- State Diff transition,
- the Evidence DNA that existed at that moment,
- and the raw deterministic observations required internally.

Conceptually:

```text
Observation 1
NORMAL · 0
BASELINE

      ↓

Observation 2
NORMAL · 0
STABLE

      ↓

Observation 3
MODERATE · 35
AD-005 activated

      ↓

Observation 4
HIGH · 65
AD-008 activated

      ↓

Observation 5
NORMAL · 0
AD-005 / AD-008 cleared
```

The important point is that historical Evidence DNA is captured **at observation time**.

MAD does not regenerate historical explanations from today's market data.

That allows the system to answer:

> What did MAD actually know then?

rather than:

> What would MAD say now about the past?

### State Tracker vs Flight Recorder

These are intentionally separate concepts.

```text
State Tracker
"What should I compare the next observation against?"

Flight Recorder
"What actually happened over time?"
```

The State Tracker maintains comparison continuity.

The Flight Recorder maintains historical intelligence.

They share the same trustworthy observation boundary but serve different purposes.

### Persistence

MAD includes a versioned file-backed observation store capable of persisting:

- last-good baselines,
- Flight Recorder records,
- deterministic values including `bigint`,
- observation continuity across process restarts on a persistent filesystem.

Filesystem durability should not be confused with infrastructure-level persistence.

If MAD is deployed on an ephemeral filesystem, host replacement or redeployment may still remove stored history.

A future deployment architecture can move this contract to a dedicated durable store without changing the conceptual Flight Recorder model.

---

# 7. MAD Observatory

The **MAD Observatory** is the human window into the intelligence produced by MAD.

It is not intended to become the only way MAD is consumed.

The project is intentionally designed so that the Observatory behaves like one client of reusable MAD infrastructure.

Current Observatory capabilities include:

- multi-asset discovery,
- MAD Radar,
- source-health visibility,
- composite market state,
- active-disorder inspection,
- State Diff,
- Evidence DNA,
- Flight Recorder timeline,
- selectable historical observations,
- historical Evidence DNA replay.

The distinction between **current state** and **historical state** is important.

Selecting an old Flight Recorder observation does not pretend that the entire application has travelled back in time.

Only the replay panel changes context.

Current state remains current.

---

# 8. MAD API

MAD exposes its intelligence through an HTTP API so that the Engine can be consumed independently of the Observatory.

Current routes include:

```text
GET /api/v1/assets

GET /api/v1/assets/search?q=NVDA

GET /api/v1/assets/:assetId/state

GET /api/v1/assets/:assetId/evidence

GET /api/v1/assets/:assetId/history

GET /api/v1/radar
```

Example:

```text
/api/v1/assets/NVDA/state
```

The API is intended to evolve into a stable machine-consumption boundary for:

- applications,
- protocols,
- analytics systems,
- monitoring systems,
- developer tooling,
- and eventually autonomous agents.

### Known alpha issue

Flight Recorder history is currently stored against the canonical Robinhood asset identifier.

The canonical-ID history route works.

Friendly symbol resolution for routes such as:

```text
/api/v1/assets/NVDA/history
```

is still being refined.

This is currently tracked as a non-blocking alpha API usability issue.

---

# 9. Smart Contracts

MAD began with an onchain state foundation and retains that infrastructure as an important part of the architecture.

## `MADStateRegistry.sol`

Canonical onchain MAD state registry for supported assets.

Responsibilities include:

- publishing MAD state,
- asset support,
- disorder bitmap representation,
- severity representation,
- evidence references,
- ruleset provenance,
- role-controlled publication,
- emergency pause behaviour.

## `IMADStateRegistry.sol`

Stable public Solidity interface for consumers integrating MAD state.

The long-term intent is that an external protocol should not need to understand MAD's internal implementation in order to consume canonical state.

## `MADDisorders.sol`

Canonical Active Disorder identifier namespace and bitmap utilities.

This provides a compact representation that can be consumed both onchain and offchain.

---

# 10. Architecture Philosophy

MAD is being developed as reusable infrastructure rather than as a monolithic application.

The intended boundary is:

```text
┌───────────────────────────────────────────────┐
│                Data Sources                   │
│                                               │
│ Robinhood · Robinhood Chain · Oracles · RPC  │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│                 MAD Engine                    │
│                                               │
│ Discovery                                     │
│ Observation                                   │
│ Disorder evaluation                           │
│ Composite state                               │
│ State Diff                                    │
│ Evidence DNA                                  │
│ Flight Recorder                               │
└──────────────────────┬────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐      ┌────────────────────┐
│     MAD API      │      │ Solidity Registry  │
└────────┬─────────┘      └─────────┬──────────┘
         │                          │
         └────────────┬─────────────┘
                      ▼
        ┌───────────────────────────┐
        │        Consumers          │
        │                           │
        │ Observatory               │
        │ External applications     │
        │ Protocols                 │
        │ SDKs                      │
        │ Monitoring systems        │
        │ Agents                    │
        └───────────────────────────┘
```

This separation matters.

A new integration should ideally consume MAD rather than cause MAD's core intelligence layer to become application-specific.

---

# 11. PONS × MAD Concept Integration

The repository also contains an experimental **PONS × MAD concept integration**.

This is an **unofficial concept demo**.

It is not a partnership, endorsement, production integration or official PONS product.

The purpose is architectural and experiential:

> What would MAD look like if disorder intelligence appeared directly at the moment a user was inspecting a tokenised asset?

Rather than asking users to leave their trading experience and open a separate risk dashboard, the concept explores MAD as an embedded intelligence layer.

A PONS-style asset page can retain normal market information:

```text
Price
Chart
Market cap
Liquidity
Volume
Trading controls
Token information
```

while MAD adds:

```text
MAD INTELLIGENCE

HIGH · 65

2 market disorders active

View details →
```

From there:

```text
WHY?
    ↓
Evidence DNA

WHAT CHANGED?
    ↓
State Diff

REPLAY
    ↓
Flight Recorder
```

The concept currently includes both:

- **PONS** as an ecosystem-native token,
- **NVDA** as a tokenised real-world asset.

This combination is intentional.

It explores whether the same MAD intelligence model can eventually operate across different asset classes without becoming hardcoded to one specific token type.

Where real MAD capability does not yet exist, the concept explicitly reports that the asset is **not connected** rather than fabricating a score or evidence.

The demo should consume real MAD interfaces wherever possible.

PONS-specific logic must not be pushed into the MAD Engine merely to improve the appearance of the demo.

---

# 12. Building Toward Agentic MAD

MAD is ultimately being built toward an **agentic market-disorder intelligence layer**.

That does not mean attaching an LLM to a price feed and asking whether a market looks dangerous.

The intended sequence is:

```text
OBSERVE
   ↓
DETECT
   ↓
EXPLAIN
   ↓
REMEMBER
   ↓
REASON
```

An intelligent agent should be able to distinguish between:

### Observed fact

```text
Oracle age = 93,240 seconds
```

### Deterministic MAD state

```text
AD-005 active
REFERENCE_DATA_STALE
MAD score = 65
Severity = HIGH
```

### Historical fact

```text
AD-005 was not active in the previous trustworthy observation.
```

### Statistical inference

```text
This condition is unusual relative to recent observations.
```

### AI interpretation

```text
The change deserves attention because reference-data staleness
appeared shortly before oracle deviation increased.
```

Those categories should never be silently collapsed into one another.

The first agentic layer is therefore intended to be deliberately bounded.

It should reason **over MAD's deterministic state, Evidence DNA, State Diff and Flight Recorder**.

It should not invent market facts.

It should not hide uncertainty.

It should not autonomously trade.

---

# 13. Roadmap

The roadmap is organised around increasing intelligence depth rather than accumulating unrelated features.

## Foundation — Built

```text
Canonical Active Disorders
        ↓
MAD State Registry
        ↓
Stable Solidity interface
        ↓
Deterministic severity model
```

## Observation Engine — Built

```text
Robinhood asset discovery
        ↓
Feed resolution
        ↓
Robinhood state
        ↓
Onchain multiplier
        ↓
Oracle / heartbeat
        ↓
Deterministic disorder evaluation
```

## Multi-Asset Intelligence — Built

```text
Capability model
        ↓
Multi-asset evaluation
        ↓
MAD Radar
        ↓
Source-health intelligence
```

## Change Intelligence — Built

```text
Trustworthy baseline
        ↓
State Diff
        ↓
Semantic transition detection
```

## Explanation Intelligence — Built

```text
Deterministic evidence
        ↓
Evidence DNA
        ↓
Inspectable disorder provenance
```

## Historical Intelligence — Alpha / Built

```text
Flight Recorder
        ↓
Historical Evidence DNA
        ↓
Observation replay
        ↓
Process-restart continuity when durable storage is configured
```

## External Consumption — In Progress

```text
MAD API
        ↓
Observatory
        ↓
PONS concept integration
        ↓
Future TypeScript SDK
        ↓
Broader protocol/application consumption
```

## Agentic MAD — Next

The next major intelligence layer is intentionally narrow.

The first agent should be able to reason over:

- current MAD state,
- active disorders,
- Evidence DNA,
- State Diff,
- historical observations,
- Flight Recorder transitions.

Its role is initially to:

- explain,
- compare,
- identify meaningful transitions,
- surface what deserves attention,
- and clearly distinguish deterministic facts from interpretation.

Not trade autonomously.

Not issue fabricated predictions.

Not obscure the evidence chain.

## MAD Shadow — Later

**Question: HOW ABNORMAL IS THIS RELATIVE TO CONTEXT?**

MAD Shadow is intended to introduce contextual and statistical comparison.

Potential directions include:

- normal-state envelopes,
- historical distributions,
- anomaly distance,
- regime comparison,
- contextual deviation,
- counterfactual state analysis.

Shadow should sit above deterministic MAD state.

It should not redefine the underlying disorder truth.

## MAD Matrix — Later

**Question: WHAT IS CONNECTED TO WHAT?**

MAD Matrix is intended to model relationships across:

- disorders,
- assets,
- protocols,
- oracles,
- liquidity structures,
- market sessions,
- shared dependencies,
- and potentially correlated disorder propagation.

The eventual objective is not simply:

```text
Asset A is HIGH.
Asset B is MODERATE.
```

but something closer to:

```text
These assets are exhibiting related disorder
because they depend on the same stressed market structure.
```

---

# 14. Long-Term Vision

The long-term ambition for MAD is larger than a dashboard.

The project is exploring whether **market disorder can become reusable machine-readable infrastructure**.

Today, applications typically consume:

```text
price
volume
market cap
liquidity
oracle values
```

MAD is investigating an additional primitive:

```text
market condition
```

Eventually, a protocol or agent could ask:

```text
What is the MAD state of this asset?

Which disorders are active?

What evidence supports them?

What changed since the last observation?

How long has the condition existed?

Has this pattern appeared before?

Which other assets share the same disorder structure?

How abnormal is the current state?

What should receive attention?
```

That creates a progression of consumers:

```text
Humans
   ↓
Applications
   ↓
Protocols
   ↓
Machines
   ↓
Autonomous agents
```

The Observatory is one consumer.

The PONS concept is another possible consumer.

The eventual SDK and API are intended to make MAD available to many more.

The central idea remains the same:

> **MAD should become a reusable intelligence layer, not a feature trapped inside one interface.**

---

# 15. Design Principles

Several principles guide development.

### Deterministic before probabilistic

Core disorder classification should be inspectable and reproducible before AI interpretation is introduced.

### Evidence before explanation

MAD should know what it observed before attempting to explain what it means.

### Memory before reasoning

An intelligent system cannot understand change if it has no trustworthy memory.

### Unknown is not normal

Missing evidence must not silently become a clean-state signal.

### Observation is not change

A new market observation does not automatically constitute a meaningful MAD transition.

### Historical evidence must remain historical

Past explanations must come from what MAD captured at that time, not from today's data.

### Consumers should not define the engine

Observatory, PONS demos and future integrations should consume MAD intelligence rather than distort the core engine around their UI requirements.

### Stable machine contracts matter

Public interfaces should evolve deliberately because MAD is intended for machine consumption, not only human viewing.

### Alpha claims should remain honest

A working prototype is not a production risk system.

A concept integration is not a partnership.

A deterministic signal is not an AI prediction.

A file-backed durable store is not the same thing as globally durable infrastructure.

---

# 16. Repository Structure

```text
mad-protocol/
│
├── src/
│   ├── interfaces/
│   ├── libraries/
│   └── testnet/
│
├── engine/
│   ├── src/
│   └── test/
│
├── observatory/
│   └── src/
│
├── pons-demo/
│   └── src/
│
├── docs/
│
├── rulesets/
│   └── v0.1/
│
├── deployments/
│
├── script/
│
├── test/
│
└── examples/
```

At a high level:

```text
src/          Solidity protocol layer
engine/       Deterministic MAD intelligence
observatory/  Human-facing MAD application
pons-demo/    Unofficial external integration concept
docs/         Specifications and design material
rulesets/     Versioned disorder rulesets
```

---

# 17. Development

## Solidity

MAD uses Foundry.

Run the protocol tests:

```bash
forge test -vv
```

## Engine

```bash
cd engine
npm install
npm test
npm run build
```

## Observatory

```bash
cd observatory
npm install
npm run dev
```

## PONS Concept Demo

```bash
cd pons-demo
npm install
npm run dev
```

The PONS concept expects the local MAD API to be available for live NVDA intelligence.

---

# 18. Project Status

MAD is **experimental alpha software under active development**.

The current project demonstrates a working progression from:

```text
market observation
        ↓
deterministic disorder detection
        ↓
machine-readable MAD state
        ↓
change intelligence
        ↓
evidence provenance
        ↓
historical memory
```

The next major step is:

```text
bounded agentic reasoning
```

The objective is not to rush from alpha into a production trading system.

The objective is to establish a trustworthy intelligence foundation first.

---

# 19. Why "Ministry of Active Disorder"?

Financial systems usually describe markets through prices, returns and risk metrics.

MAD starts from a different premise:

> Markets can be functioning, degraded, transitioning, uncertain or actively disordered — and those states deserve explicit representation.

Hence:

**Ministry of Active Disorder.**

A system whose job is not merely to watch markets move.

Its job is to understand when the machinery around those markets stops behaving normally.

---

## Disclaimer

MAD is experimental software and research infrastructure.

It is not financial advice, an investment recommendation, a production risk-management system, a trading signal service, or a guarantee of market integrity.

Third-party names and interfaces referenced in demonstrations remain the property of their respective owners.

The PONS × MAD interface is an unofficial concept integration and does not imply partnership, endorsement or affiliation.
