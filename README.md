# MAD — Ministry of Active Disorder

MAD is open infrastructure for detecting, representing, and eventually modelling financial disorder across tokenised assets on Robinhood Chain.

## Live

**MAD Observatory**  
https://mad-observatory.onrender.com

**MAD API**  
https://mad-api-kxi9.onrender.com

## Current Status

MAD V0.1 is under active development.

The initial foundation provides:

- MAD State Registry
- Public Solidity integration interface
- Canonical Active Disorder identifiers
- Deterministic severity states
- Evidence and ruleset provenance
- Role-based state publication
- Emergency pause controls
- Onchain state history through events

## Architecture

MAD is being developed as reusable Robinhood Chain infrastructure.

```text
Robinhood / Market Data
          │
          ▼
      MAD Engine
          │
          ▼
       MAD State
          │
          ▼
   Active Disorders
          │
          ▼
      MAD Matrix
          │
          ▼
      MAD Shadow

      ### MAD State

What is happening?

### MAD Matrix

What is connected?

### MAD Shadow

What happens if conditions change?

## Smart Contracts

### `MADStateRegistry.sol`

Canonical onchain state registry for supported tokenised assets.

### `IMADStateRegistry.sol`

Stable public interface for external protocol integrations.

### `MADDisorders.sol`

Canonical Active Disorder identifier namespace and bitmap utilities.

## Active Disorders

MAD V0.1 currently defines:

| ID | Disorder |
|---|---|
| AD-001 | PRICE_DISLOCATION |
| AD-002 | UNDERLYING_TRADING_HALT |
| AD-003 | CORPORATE_ACTION_PENDING |
| AD-004 | MULTIPLIER_TRANSITION |
| AD-005 | REFERENCE_DATA_STALE |
| AD-006 | LIQUIDITY_STRESS |
| AD-007 | MARKET_SESSION_DISLOCATION |
| AD-008 | ORACLE_DEVIATION |

See [`docs/active-disorders.md`](docs/active-disorders.md).

## Development

Install pinned dependencies:

```bash
./script/install-dependencies.sh