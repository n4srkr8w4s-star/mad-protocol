# MAD Active Disorders

MAD — Ministry of Active Disorder

Active Disorders are canonical machine-readable conditions used by MAD to describe abnormal financial or market state across supported tokenised assets.

Each disorder has a permanent protocol identifier.

Once assigned, an identifier MUST NOT be reused for another meaning.

---

## AD-001 — PRICE_DISLOCATION

**ID:** 0

The observed onchain price materially diverges from the expected reference price.

Typical evidence may include:

- onchain token price
- reference market price
- deviation in basis points
- observation timestamp
- market session state

---

## AD-002 — UNDERLYING_TRADING_HALT

**ID:** 1

Trading in the underlying financial asset is halted while the tokenised representation remains part of the onchain financial system.

Typical evidence may include:

- trading halt status
- halt timestamp
- last valid underlying price
- current onchain price
- liquidity conditions

---

## AD-003 — CORPORATE_ACTION_PENDING

**ID:** 2

A corporate action affecting the underlying asset is pending or approaching effectiveness.

Examples may include:

- dividend
- stock split
- reverse split
- merger
- spin-off
- redemption
- symbol or instrument change

---

## AD-004 — MULTIPLIER_TRANSITION

**ID:** 3

A Robinhood Stock Token multiplier change is pending, active, or requires financial-state normalisation.

Typical evidence may include:

- current multiplier
- pending multiplier
- effective timestamp
- token-adjusted reference price

---

## AD-005 — REFERENCE_DATA_STALE

**ID:** 4

One or more required reference-data inputs exceed the freshness threshold defined by the active MAD ruleset.

Typical evidence may include:

- source timestamp
- current timestamp
- data age
- permitted freshness threshold

---

## AD-006 — LIQUIDITY_STRESS

**ID:** 5

Available onchain liquidity deteriorates materially relative to expected or historical conditions.

Potential signals may include:

- pool depth
- spread
- price impact
- liquidity change
- executable depth

This disorder will be activated only after MAD liquidity modelling is implemented.

---

## AD-007 — MARKET_SESSION_DISLOCATION

**ID:** 6

Onchain behaviour becomes materially abnormal relative to the current trading session or availability of the underlying market.

Examples may include:

- underlying market closed
- weekend
- extended-hours trading
- overnight session
- market holiday

Market closure alone does not necessarily constitute disorder.

MAD must identify an abnormal condition relative to the expected behaviour for that session.

---

## AD-008 — ORACLE_DEVIATION

**ID:** 7

A material divergence exists between an oracle-provided value and another trusted financial reference after required multiplier and unit normalisation.

Typical evidence may include:

- oracle value
- reference value
- multiplier
- deviation
- oracle timestamp

---

# Bitmap Mapping

MAD represents Active Disorders using a `uint256` bitmap.

| Disorder | ID | Bit |
|---|---:|---:|
| PRICE_DISLOCATION | 0 | 0 |
| UNDERLYING_TRADING_HALT | 1 | 1 |
| CORPORATE_ACTION_PENDING | 2 | 2 |
| MULTIPLIER_TRANSITION | 3 | 3 |
| REFERENCE_DATA_STALE | 4 | 4 |
| LIQUIDITY_STRESS | 5 | 5 |
| MARKET_SESSION_DISLOCATION | 6 | 6 |
| ORACLE_DEVIATION | 7 | 7 |

Example:

If AD-002 and AD-005 are active:

```text
bit 1 = 1
bit 4 = 1

bitmap = 00010010