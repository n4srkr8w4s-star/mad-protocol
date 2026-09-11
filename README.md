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
What is happening?

Where is disorder emerging?

How complete and trustworthy is MAD's ability
to assess the situation?

What materially changed?

Why did MAD classify the market this way?

How did the condition evolve?

Is the disorder new, persistent or recurring?

Later:
What deserves attention?
How abnormal is this relative to context?
What is connected to what?
```

The project is therefore being developed as a sequence of increasingly richer intelligence layers.

```text
OBSERVE
   │
   ▼
DETECT
   │
   ▼
QUALIFY
   │
   ▼
EXPLAIN
   │
   ▼
REMEMBER
   │
   ▼
TRACK
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

The important word being introduced into the Alpha architecture is **QUALIFY**.

MAD should not only produce a conclusion.

It should be capable of describing the quality of the evidence environment from which that conclusion was produced.

That creates an important distinction between:

```text
MARKET TRUTH
What MAD deterministically observes about the market.

EVIDENCE TRUTH
Why MAD reached its conclusion.

EPISTEMIC TRUTH
How good MAD's ability was to know.
```

In the current Alpha architecture and roadmap:

```text
MAD State
    │
    ▼
MAD Radar
    │
    ▼
Assessment Integrity
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
Disorder Persistence
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

Each layer exists to answer a distinct question.

| Layer | Question |
|---|---|
| **MAD State** | What is happening now? |
| **MAD Radar** | Where is disorder? |
| **Assessment Integrity** | How good was MAD's ability to make this assessment? |
| **State Diff** | What materially changed? |
| **Evidence DNA** | Why did MAD say this? |
| **Flight Recorder** | How did the condition evolve? |
| **Disorder Persistence** | Is the disorder new, persisting, recurring or cleared? |
| **Agentic MAD** | What deserves attention, and how should deterministic evidence be interpreted? |
| **MAD Shadow** | How abnormal is this relative to context? |
| **MAD Matrix** | What is connected to what? |

These layers are not intended to become a collection of independent dashboard widgets.

They form one intelligence chain.

A current MAD state without evidence is weak.

Evidence without an understanding of assessment quality can create false certainty.

A change without memory lacks context.

Memory without temporal interpretation forces the consumer to reconstruct persistence manually.

The architecture is therefore intentionally cumulative.

The intent is also not to jump immediately to AI.

MAD is being built:

> **data-rich first, deterministic second, intelligence-rich third, autonomous last.**

The first Alpha remains deterministic at its core.

AI will eventually reason **over** MAD's evidence, transitions and memory.

It will not be used to manufacture the underlying market truth.

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

# 6. Assessment Integrity

**Assessment Integrity answers: HOW GOOD WAS MAD'S ABILITY TO KNOW?**

A deterministic market conclusion and the quality of the assessment producing that conclusion are not the same thing.

MAD may observe a severe disorder with excellent evidence.

It may also observe apparently normal conditions while important parts of the assessment surface are unavailable.

Those cases must never be presented as equivalent.

Assessment Integrity is therefore being introduced as a deterministic qualification layer over a MAD assessment.

It does **not** mean:

```text
MAD is 87% confident that the market will move.
```

It means:

> How complete, timely, healthy and sufficient was the evidence environment from which MAD produced this assessment?

The first Alpha design uses four overall integrity states:

```text
STRONG
ADEQUATE
LIMITED
INSUFFICIENT
```

These are semantic states rather than opaque probability scores.

MAD should always be able to explain why an integrity level was assigned.

Conceptually:

```text
ASSESSMENT INTEGRITY
│
├── Coverage
│
├── Freshness
│
├── Source Health
│
├── Evidence Sufficiency
│
└── Evidence Coherence
```

## Coverage

Coverage asks:

> Of the evidence MAD requires for this assessment, how much was it actually able to assess?

Initial public semantics:

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

Coverage is evaluated against the **applicable assessment surface**, not the total global Active Disorder catalogue.

A disorder or evidence requirement that genuinely does not apply to a subject must not reduce coverage.

Likewise:

> Missing evidence must never silently become evidence of normality.

A stale or adverse observation that MAD successfully measured still counts as assessed coverage.

For example, if MAD successfully establishes that reference data is stale, coverage may still be complete even though the market condition itself is unhealthy.

Evidence requirements are also expected to distinguish between:

```text
REQUIRED
SUPPLEMENTARY
```

Missing supplementary evidence may reduce analytical richness without invalidating the core assessment.

Missing required evidence may materially constrain what MAD is allowed to claim.

## Freshness

Freshness asks:

> Was MAD's evidence timely enough for the assessment being made?

Freshness is deliberately separate from disorders such as `AD-005 REFERENCE_DATA_STALE`.

The distinction is important.

`AD-005` describes a condition MAD has observed in the market or reference-data environment.

Assessment Freshness describes the timeliness of the evidence MAD itself relied upon.

MAD may therefore legitimately have:

```text
MAD STATE
HIGH

AD-005
REFERENCE_DATA_STALE
ACTIVE

ASSESSMENT INTEGRITY
STRONG
```

That means:

> MAD has strong, timely evidence that the underlying reference data is stale.

Freshness policies cannot use one universal timeout.

Different evidence types have different expected update behaviour, and market/session context may change what counts as timely.

Initial semantics are expected to remain deliberately small:

```text
FRESH
DEGRADED
STALE
UNKNOWN
```

Unknown freshness remains unknown.

Successful retrieval alone must never imply timely evidence.

## Source Health

Source Health asks:

> Was the source providing the observation operational and usable?

MAD already contains source-health intelligence.

Assessment Integrity should consume and aggregate that existing information rather than create a competing health subsystem.

Initial semantics:

```text
HEALTHY
DEGRADED
UNAVAILABLE
UNKNOWN
```

Coverage, freshness and source health remain separate because they describe different failure modes.

A source may be healthy while the particular evidence required is unavailable.

A source may be reachable while returning evidence that is too old.

A complete observation may still originate from degraded infrastructure.

## Evidence Sufficiency

Evidence Sufficiency asks:

> Does MAD have enough evidence to support the particular conclusion it is making?

This is intentionally claim-sensitive.

The correct question is not merely:

```text
Does MAD have enough data?
```

It is:

```text
Does MAD have enough evidence
for this specific claim?
```

For example, partial coverage may still be sufficient to assert that an independently observed oracle deviation is active.

The same evidence may be insufficient to make a broad statement that the entire market environment is normal.

Initial semantics:

```text
SUFFICIENT
LIMITED
INSUFFICIENT
```

This allows MAD to preserve directly observed truth while remaining explicit about the boundaries of the broader assessment.

## Evidence Coherence

Evidence Coherence asks:

> Do independently observed signals support a coherent interpretation, or are they materially mixed?

Initial semantics:

```text
COHERENT
MIXED
NOT_APPLICABLE
UNKNOWN
```

MAD deliberately avoids the stronger term `INCOHERENT` in the first Alpha.

Different signals are allowed to disagree.

In some situations, disagreement may itself be an important part of the observed market condition.

Coherence therefore qualifies the assessment.

It does not rewrite deterministic disorder results.

## Deterministic integrity, not a weighted confidence score

The first Alpha will not use an arbitrary formula such as:

```text
coverage * 0.25
+ freshness * 0.20
+ sourceHealth * 0.20
+ ...
```

Assessment Integrity is intended to use explicit deterministic gating.

Conceptually:

```text
INSUFFICIENT
    Required evidence cannot support
    the assessment being claimed.

LIMITED
    Material assessment limitations exist.

ADEQUATE
    The assessment is defensible but
    contains non-critical limitations.

STRONG
    The required assessment surface is
    complete, timely, healthy and sufficient.
```

Every non-strong result should carry inspectable reasons.

The purpose is not to create another score.

The purpose is to let MAD distinguish between:

```text
MAD SCORE: 0
INTEGRITY: STRONG
```

meaning:

> MAD thoroughly assessed the applicable environment and found no active disorder.

and:

```text
MAD SCORE: 0
INTEGRITY: INSUFFICIENT
```

meaning:

> MAD does not currently have enough evidence to characterise the environment safely.

Those states must never be treated as equivalent.

**Status: architecture locked for Alpha; implementation is the next Core MAD milestone.**

---

# 7. Flight Recorder

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

# 8. Disorder Persistence

**Disorder Persistence answers: IS THIS CONDITION NEW, PERSISTING, RECURRING OR CLEARED?**

State Diff tells MAD that something changed.

Flight Recorder preserves the trustworthy sequence of observations.

Disorder Persistence derives deterministic temporal meaning from that history.

Two assets may currently have:

```text
MAD SCORE: 65
SEVERITY: HIGH
ACTIVE: AD-008
```

while representing very different situations.

One may have activated AD-008 for the first time seconds ago.

Another may have remained in the same disorder state across many trustworthy observations for an extended period.

A current-state score alone cannot communicate that distinction.

The first Alpha persistence model is intentionally small:

```text
NEW
PERSISTING
RECURRENT
CLEARED
```

Conceptually:

```text
DisorderPersistence
│
├── disorderId
├── status
├── firstObservedAt
├── lastObservedAt
├── consecutiveObservations
├── totalActiveObservations
├── activationCount
└── duration
```

### NEW

The disorder is currently active and this is its first trustworthy observed activation.

### PERSISTING

The disorder remains active across consecutive trustworthy observations.

### RECURRENT

The disorder was active previously, cleared, and has activated again.

### CLEARED

The disorder was previously active and is no longer active in the current trustworthy observation.

A state such as `NEVER_OBSERVED` may exist internally without cluttering public interfaces.

The first Alpha should avoid subjective temporal labels such as:

```text
LONG_RUNNING
SEVERE_DURATION
UNUSUALLY_PERSISTENT
```

until MAD has a defensible contextual basis for making those claims.

The initial persistence layer should remain factual:

```text
AD-008 ORACLE_DEVIATION

ACTIVE
Persistence: PERSISTING

First observed: 14:31:08
Last observed:  14:48:44
Duration:       17m 36s
Consecutive observations: 7
Total active observations: 9
```

Persistence must be derived only from trustworthy historical observations.

Failed evaluations, cache hits and capability-only states must not manufacture temporal continuity.

This layer is intentionally separate from Flight Recorder.

```text
Flight Recorder
"What actually happened over time?"

Disorder Persistence
"What does that trustworthy history tell us
about the lifetime of this disorder?"
```

Persistence is especially important for future Prediction-market intelligence.

A probability dislocation that appears once and disappears is not analytically equivalent to one that persists, clears and repeatedly reappears.

**Status: architecture locked for Alpha; implementation follows Assessment Integrity.**

---

# 9. MAD Observatory

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

# 10. MAD API

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

# 11. Smart Contracts

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

# 12. Architecture Philosophy

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

# 13. PONS × MAD Concept Integration

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

# 14. Building Toward Agentic MAD

Agentic MAD is a deliberate future layer, not the immediate next implementation milestone.

The current sequence is **Core MAD Alpha → Assessment Integrity → Disorder Persistence → Prediction-market Alpha → Bounded Agentic MAD**.

This ordering is intentional. The agent should be shaped by deterministic evidence, trustworthy memory and more than one market domain before it is allowed to interpret MAD intelligence.

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

# 15. Roadmap

The roadmap is organised around increasing intelligence depth rather than accumulating unrelated features.

MAD deliberately prefers a small number of high-integrity capabilities over a large number of shallow features.

The objective for the first Alpha is not breadth.

It is to establish an intelligence spine with precise semantics, inspectable evidence, explicit uncertainty and trustworthy memory.

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
Process-restart continuity
when durable storage is configured
```

## Assessment Qualification — Architecture Locked / Next Core Build

MAD's next Alpha layer is **Assessment Integrity**.

It adds deterministic information about the quality of MAD's ability to assess a subject.

```text
Assessment Integrity
        │
        ├── Coverage
        ├── Freshness
        ├── Source Health
        ├── Evidence Sufficiency
        └── Evidence Coherence
```

The purpose is not to create an opaque confidence score.

It is to make limitations first-class.

MAD must be able to distinguish:

```text
No disorder observed
with strong assessment integrity
```

from:

```text
No disorder observed
because important evidence was unavailable
```

The latter must never masquerade as normality.

## Temporal Intelligence — Architecture Locked / Next Core Build

After Assessment Integrity, MAD will add **Disorder Persistence**.

```text
Trustworthy observations
        ↓
Flight Recorder
        ↓
Disorder Persistence
        ↓
NEW / PERSISTING / RECURRENT / CLEARED
```

This gives temporal meaning to disorder history without introducing prediction or probabilistic modelling.

Once Assessment Integrity and Disorder Persistence are implemented, tested and exposed through the appropriate machine boundaries, the first Core MAD Alpha intelligence pass will be considered feature-complete for this phase.

The intention at that point is to **stop adding additional Asset intelligence features** and move to the next domain.

## Domain-Neutral MAD — Architectural Direction

MAD began with tokenised assets on Robinhood Chain.

The intelligence architecture is not intended to remain asset-specific.

The emerging abstraction is a canonical **MAD Subject**.

Conceptually:

```text
MAD Subject
│
├── ASSET
│     └── Asset observation/evaluator
│
└── PREDICTION
      └── Prediction-market observation/evaluator
```

Both domains should ultimately feed a common intelligence lifecycle:

```text
Domain observation
        ↓
Domain-specific deterministic evaluation
        ↓
MAD assessment
        ↓
Assessment Integrity
        ↓
State Diff
        ↓
Evidence DNA
        ↓
Flight Recorder
        ↓
Persistence
```

This does **not** justify a large refactor of the existing Engine merely for architectural purity.

The abstraction should be introduced only where concrete reuse requires it.

## Prediction Markets — Next Domain

Prediction markets are the next planned MAD domain after the first Core Alpha intelligence pass.

This capability is **not yet implemented**.

The purpose is not to make MAD another outcome-prediction model.

MAD will instead investigate the quality and behaviour of the market mechanism producing a displayed probability.

A Prediction market may tell a user:

```text
YES 67%
```

MAD should eventually help answer:

> **How much confidence should I place in the market producing that 67%?**

Potential MAD questions include:

```text
Is the probability supported by healthy liquidity?

Did the move occur under weakening depth?

Did related markets confirm the repricing?

Was the move broad or concentrated?

Did the condition persist?

Is the market's displayed consensus structurally stable?

Is MAD itself operating with sufficient evidence
to make that assessment?
```

The first Prediction architecture will begin with **data-source reconnaissance**, not UI.

MAD must first establish what can be truthfully observed from available prediction-market venues.

The intended source progression is:

```text
Venue data
    ↓
Prediction Market Adapter
    ↓
Canonical Prediction Observation
    ↓
Deterministic Prediction Disorders
    ↓
MAD Intelligence
```

Candidate venues may include Robinhood-accessible prediction markets, Kalshi, Polymarket or other sources where suitable official data interfaces are available.

No venue should be selected simply because its API is convenient.

The selection should be driven by:

- observation quality,
- market-state availability,
- liquidity/depth data,
- trade data,
- timestamps and freshness,
- resolution metadata,
- related-market discovery,
- and suitability for deterministic MAD analysis.

The Observatory may eventually introduce:

```text
ASSETS    RADAR    PREDICTIONS
```

but `PREDICTIONS` should represent real MAD intelligence, not a cosmetic betting-market screen.

The initial consumer-facing objective is expected to focus on a very small number of high-value capabilities:

```text
MARKET TRUST
How trustworthy is the market structure
behind the displayed probability?

WHAT CHANGED
What materially changed in the probability,
liquidity, depth or related-market structure?

WHY
What deterministic evidence supports
MAD's conclusion?

REPLAY
How did the condition evolve?
```

Prediction Markets are expected to become an important proving ground for the domain-neutrality of MAD.

## External Consumption — In Progress

```text
MAD API
        ↓
Observatory
        ↓
Concept integrations
        ↓
Future TypeScript SDK
        ↓
Broader protocol/application consumption
```

The PONS concept remains an experimental external-integration demonstration and may be resumed separately.

It does not control the Core MAD roadmap.

## Agentic MAD — After Core Alpha and Initial Prediction Intelligence

The first agentic layer is intentionally delayed until MAD has been tested against more than one market domain.

This is deliberate.

An agent designed only around tokenised-asset observations risks becoming a Robinhood-specific conversational wrapper.

An agent reasoning over both:

```text
ASSET MARKET INTELLIGENCE
```

and:

```text
PREDICTION-MARKET INTELLIGENCE
```

will provide a much stronger test of whether MAD's intelligence primitives are genuinely reusable.

The first agent should reason over:

- current MAD state,
- Assessment Integrity,
- active disorders,
- Evidence DNA,
- State Diff,
- historical observations,
- Flight Recorder transitions,
- Disorder Persistence.

Its role is initially to:

- explain,
- compare,
- identify meaningful transitions,
- surface what deserves attention,
- distinguish fact from interpretation,
- and clearly expose uncertainty.

Not trade autonomously.

Not issue fabricated predictions.

Not obscure the evidence chain.

The intended reasoning hierarchy remains:

```text
OBSERVED FACT
        ↓
DETERMINISTIC MAD STATE
        ↓
HISTORICAL FACT
        ↓
STATISTICAL INFERENCE
        ↓
AI INTERPRETATION
```

Those categories must never be silently collapsed into one another.

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
- prediction markets,
- protocols,
- oracles,
- liquidity structures,
- market sessions,
- shared dependencies,
- and potentially correlated disorder propagation.

The eventual objective is not simply:

```text
Subject A is HIGH.
Subject B is MODERATE.
```

but something closer to:

```text
These subjects are exhibiting related disorder
because they depend on the same stressed
market structure or belief relationship.
```

Prediction markets may become particularly important to Matrix because related markets naturally form graphs of conditional and overlapping beliefs.

---

# 16. Long-Term Vision

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

# 17. Design Principles

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

# 18. Repository Structure

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

# 19. Development

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

# 20. Project Status

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

# 21. Why "Ministry of Active Disorder"?

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
