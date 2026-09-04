import { describe, expect, it } from "vitest";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../src/domain/types";

import { evaluatePriceState } from "../src/engine/evaluatePriceState";

const TPONS =
  "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36";

describe("MAD Engine", () => {
  it("produces the complete first-live-disorder state", () => {
    const result = evaluatePriceState(
      {
        chainId: 46630,
        assetAddress: TPONS,
        symbol: "tPONS",
      },
      {
        expectedPriceE6: 1_000_000n,
        observedPriceE6: 1_120_000n,
      },
    );

    expect(result.observation.deviationBps).toBe(1200);
    expect(result.observation.direction).toBe("ABOVE");

    expect(result.state.disorderScore).toBe(65);
    expect(result.state.severity).toBe(MADSeverity.HIGH);
    expect(result.state.disorderBitmap).toBe(1n);

    expect(result.state.activeDisorders).toEqual([
      ActiveDisorderId.PRICE_DISLOCATION,
    ]);

    expect(result.provenance.rulesetHash).toBe(
      "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
    );

    expect(result.provenance.evidenceHash).toBe(
      "0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c",
    );

    expect(result.registryUpdate).toEqual({
      asset: TPONS,
      disorderScore: 65,
      disorderBitmap: 1n,
      evidenceHash:
        "0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c",
      rulesetHash:
        "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
    });
  });

  it("produces a normal state below the disorder threshold", () => {
    const result = evaluatePriceState(
      {
        chainId: 46630,
        assetAddress: TPONS,
        symbol: "tPONS",
      },
      {
        expectedPriceE6: 1_000_000n,
        observedPriceE6: 1_020_000n,
      },
    );

    expect(result.state.disorderScore).toBe(0);
    expect(result.state.severity).toBe(MADSeverity.NORMAL);
    expect(result.state.disorderBitmap).toBe(0n);
    expect(result.state.activeDisorders).toEqual([]);
  });
});
