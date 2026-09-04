import { describe, expect, it } from "vitest";

import {
  ActiveDisorderId,
  MADSeverity,
} from "../src/domain/types";

import { evaluatePriceDislocation } from "../src/disorders/priceDislocation";
import { loadPriceDislocationRuleset } from "../src/rulesets/loadPriceDislocationRuleset";

const { ruleset } = loadPriceDislocationRuleset();

describe("AD-001 PRICE_DISLOCATION", () => {
  it("reproduces the first live tPONS disorder", () => {
    const result = evaluatePriceDislocation(
      {
        expectedPriceE6: 1_000_000n,
        observedPriceE6: 1_120_000n,
      },
      ruleset,
    );

    expect(result.disorderId).toBe(
      ActiveDisorderId.PRICE_DISLOCATION,
    );

    expect(result.active).toBe(true);
    expect(result.deviationBps).toBe(1200);
    expect(result.score).toBe(65);
    expect(result.severity).toBe(MADSeverity.HIGH);
    expect(result.direction).toBe("ABOVE");
  });

  it("does not activate below the threshold", () => {
    const result = evaluatePriceDislocation(
      {
        expectedPriceE6: 1_000_000n,
        observedPriceE6: 1_040_000n,
      },
      ruleset,
    );

    expect(result.active).toBe(false);
    expect(result.deviationBps).toBe(400);
    expect(result.score).toBe(0);
    expect(result.severity).toBe(MADSeverity.NORMAL);
  });

  it("detects downward dislocation", () => {
    const result = evaluatePriceDislocation(
      {
        expectedPriceE6: 1_000_000n,
        observedPriceE6: 880_000n,
      },
      ruleset,
    );

    expect(result.active).toBe(true);
    expect(result.deviationBps).toBe(1200);
    expect(result.score).toBe(65);
    expect(result.severity).toBe(MADSeverity.HIGH);
    expect(result.direction).toBe("BELOW");
  });
});
