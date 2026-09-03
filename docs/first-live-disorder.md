# MAD First Live Active Disorder

This document records the first complete MAD Active Disorder flow published on Robinhood Chain Testnet.

## Environment

- Network: Robinhood Chain Testnet
- Chain ID: 46630
- MAD State Registry: `0x65605F7169ec0dA7aEF8178A8b7d69159b43B222`
- Test asset: `tPONS`
- Test asset address: `0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36`

`tPONS` is a controlled testnet-only asset created for MAD integration testing.

It is not an official PONS token and has no economic value.

## Scenario

MAD V0.1 evaluated a controlled price-dislocation scenario:

- Expected price: 1.00
- Observed price: 1.12
- Absolute deviation: 12%
- Deviation: 1200 basis points

The observation is synthetic test evidence and does not represent live market data.

## Result

MAD classified the state as:

- Active Disorder: `AD-001 — PRICE_DISLOCATION`
- Disorder ID: `0`
- Disorder bitmap: `1`
- Disorder score: `65`
- Severity: `HIGH`
- Sequence: `1`

## Ruleset

Ruleset:

`rulesets/v0.1/price-dislocation.json`

Ruleset hash:

`0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69`

## Evidence

Evidence:

`examples/evidence/tpons-price-dislocation.json`

Evidence hash:

`0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c`

## Onchain Transactions

### Asset registration

Transaction:

`0x3bfcdaaa91ad2fe93d476bc6d03dba3a2ec674d78433132e90b4277bc73e9e67`

### Active Disorder publication

Transaction:

`0x42ed5793ecd8ea07dec7fd527d3d1f5fb3a1d58fe0754afa1ec678fc2f0d55e5`

Block:

`112562724`

## Readback Verification

After publication, the live MAD registry returned:

- `supportedAssets(tPONS)` → `true`
- `isDisordered(tPONS)` → `true`
- `hasDisorder(tPONS, 0)` → `true`
- `latestSequence(tPONS)` → `1`

The canonical state returned:

- disorder score: `65`
- severity: `HIGH`
- disorder bitmap: `1`
- evidence hash: matches the published evidence
- ruleset hash: matches MAD V0.1
- sequence: `1`

## Significance

This was MAD's first complete onchain vertical slice:

```text
Controlled Observation
        ↓
MAD Ruleset
        ↓
AD-001 PRICE_DISLOCATION
        ↓
Score 65 / HIGH
        ↓
MADStateRegistry
        ↓
Robinhood Chain Testnet
        ↓
Independent Onchain Readback