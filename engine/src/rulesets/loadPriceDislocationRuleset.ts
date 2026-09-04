import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ActiveDisorderId,
  type PriceDislocationRuleset,
} from "../domain/types.js";

import { keccakUtf8 } from "../crypto/keccak.js";

const RULESET_URL = new URL(
  "../../../rulesets/v0.1/price-dislocation.json",
  import.meta.url,
);

export interface LoadedPriceDislocationRuleset {
  ruleset: PriceDislocationRuleset;
  raw: string;
  hash: `0x${string}`;
}

export function loadPriceDislocationRuleset(): LoadedPriceDislocationRuleset {
  const raw = readFileSync(
    fileURLToPath(RULESET_URL),
    "utf8",
  ).trimEnd();

  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("id" in parsed) ||
    !("disorderId" in parsed) ||
    !("thresholdBps" in parsed) ||
    !("scoreBands" in parsed) ||
    !("absoluteDeviation" in parsed)
  ) {
    throw new Error("Invalid MAD price-dislocation ruleset");
  }

  const ruleset = parsed as PriceDislocationRuleset;

  if (
    ruleset.disorderId !==
    ActiveDisorderId.PRICE_DISLOCATION
  ) {
    throw new Error(
      "Price-dislocation ruleset has invalid disorder ID",
    );
  }

  if (
    typeof ruleset.id !== "string" ||
    !Number.isInteger(ruleset.thresholdBps) ||
    !Array.isArray(ruleset.scoreBands) ||
    typeof ruleset.absoluteDeviation !== "boolean"
  ) {
    throw new Error(
      "Invalid MAD price-dislocation ruleset structure",
    );
  }

  for (const band of ruleset.scoreBands) {
    if (
      !Number.isInteger(band.minBps) ||
      !Number.isInteger(band.score) ||
      band.score < 0 ||
      band.score > 100
    ) {
      throw new Error(
        "Invalid MAD price-dislocation score band",
      );
    }
  }

  return {
    ruleset,
    raw,
    hash: keccakUtf8(raw),
  };
}
