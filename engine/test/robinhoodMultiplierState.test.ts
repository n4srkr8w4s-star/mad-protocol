import { describe, expect, it } from "vitest";

import {
  MADSeverity,
} from "../src/domain/types.js";

import {
  evaluateRobinhoodMultiplierState,
} from "../src/engine/evaluateRobinhoodMultiplierState.js";

const AAPL_MULTIPLIER =
  1000566080061092436n;

const AAPL = {
  id: "0x00000000000000000000000000000000c2425be3658540dd8e2424cbf3c5c649",
  tokenSymbol: "AAPL",
  tokenName: "Apple • Robinhood Token",

  deployments: [
    {
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
      chainId: 4663,
      networkName: "Robinhood Chain",
    },
  ],

  currentMultiplier:
    "1.000566080061092436",

  pendingMultiplier: "",

  status: "ASSET_STATUS_ACTIVE",

  logoUrl:
    "https://cdn.robinhood.com/ncw_assets/logos/aapl.png",

  tradingCapabilities: {
    market: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },

    extended: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },

    overnight: {
      whole: "TRADING_STATUS_TRADABLE",
      fractional: "TRADING_STATUS_TRADABLE",
    },
  },

  tokenDecimals: 18,
  isin: "US0378331005",
};

describe("Robinhood multiplier state evaluation", () => {
  it("reports real-shape AAPL sources as coherent when multipliers match", async () => {
    const result =
      await evaluateRobinhoodMultiplierState(
        {
          symbol: "AAPL",
          rpcUrl:
            "https://example.invalid",
        },
        {
          getAsset: async () => AAPL,

          readMultiplier: async () => ({
            contractAddress:
              "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
            valueE18:
              AAPL_MULTIPLIER,
            valueE18String:
              AAPL_MULTIPLIER.toString(),
          }),
        },
      );

    expect(result.asset.symbol).toBe(
      "AAPL",
    );

    expect(
      result.sources.robinhoodApi
        .currentMultiplierE18,
    ).toBe(
      "1000566080061092436",
    );

    expect(
      result.sources.robinhoodChain
        .uiMultiplierE18,
    ).toBe(
      "1000566080061092436",
    );

    expect(
      result.evaluation
        .currentMultiplierMatches,
    ).toBe(true);

    expect(result.evaluation.active).toBe(
      false,
    );

    expect(result.evaluation.score).toBe(
      0,
    );

    expect(
      result.evaluation.severity,
    ).toBe(MADSeverity.NORMAL);
  });

  it("detects cross-source multiplier incoherence", async () => {
    const result =
      await evaluateRobinhoodMultiplierState(
        {
          symbol: "AAPL",
          rpcUrl:
            "https://example.invalid",
        },
        {
          getAsset: async () => AAPL,

          readMultiplier: async () => ({
            contractAddress:
              "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
            valueE18:
              1000000000000000000n,
            valueE18String:
              "1000000000000000000",
          }),
        },
      );

    expect(
      result.evaluation
        .currentMultiplierMatches,
    ).toBe(false);

    expect(result.evaluation.active).toBe(
      true,
    );

    expect(result.evaluation.score).toBe(
      65,
    );

    expect(
      result.evaluation.severity,
    ).toBe(MADSeverity.HIGH);
  });
});
