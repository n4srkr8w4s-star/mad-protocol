import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { evaluatePriceDislocation } from "../src/disorders/priceDislocation";
import { buildPriceDislocationEvidence } from "../src/evidence/priceDislocationEvidence";
import { loadPriceDislocationRuleset } from "../src/rulesets/loadPriceDislocationRuleset";

const EXPECTED_RULESET_HASH =
  "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69";

const EXPECTED_EVIDENCE_HASH =
  "0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c";

describe("MAD provenance", () => {
  it("reproduces the ruleset hash published onchain", () => {
    const loaded = loadPriceDislocationRuleset();

    expect(loaded.ruleset.id).toBe(
      "MAD-V0.1-PRICE-DISLOCATION",
    );

    expect(loaded.hash).toBe(EXPECTED_RULESET_HASH);
  });

  it("reproduces the tPONS evidence published onchain", () => {
    const { ruleset } = loadPriceDislocationRuleset();

    const observation = {
      expectedPriceE6: 1_000_000n,
      observedPriceE6: 1_120_000n,
    };

    const evaluation = evaluatePriceDislocation(
      observation,
      ruleset,
    );

    const evidence = buildPriceDislocationEvidence(
      {
        chainId: 46630,
        assetAddress:
          "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36",
        symbol: "tPONS",
      },
      observation,
      evaluation,
    );

    const committedEvidence = readFileSync(
      new URL(
        "../../examples/evidence/tpons-price-dislocation.json",
        import.meta.url,
      ),
      "utf8",
    ).trimEnd();

    expect(evidence.json).toBe(committedEvidence);
    expect(evidence.hash).toBe(EXPECTED_EVIDENCE_HASH);
  });
});
