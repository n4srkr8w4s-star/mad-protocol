import { describe, expect, it } from "vitest";

import {
  normaliseRobinhoodStockToken,
} from "../src/domain/stockTokenState.js";

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

describe("MAD Stock Token state", () => {
  it("normalises Robinhood AAPL into canonical MAD state", () => {
    const state =
      normaliseRobinhoodStockToken(AAPL);

    expect(state.asset).toMatchObject({
      source: "ROBINHOOD",
      symbol: "AAPL",
      name: "Apple • Robinhood Token",
      isin: "US0378331005",
      decimals: 18,
      status: "ASSET_STATUS_ACTIVE",
    });

    expect(state.deployment).toEqual({
      networkName: "Robinhood Chain",
      chainId: 4663,
      contractAddress:
        "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    });
  });

  it("preserves the multiplier exactly without floating point", () => {
    const state =
      normaliseRobinhoodStockToken(AAPL);

    expect(state.multiplier.current).toBe(
      "1.000566080061092436",
    );

    expect(state.multiplier.currentE18).toBe(
      "1000566080061092436",
    );
  });

  it("represents no pending multiplier as no transition", () => {
    const state =
      normaliseRobinhoodStockToken(AAPL);

    expect(state.multiplier.pending).toBeNull();
    expect(state.multiplier.pendingE18).toBeNull();
    expect(
      state.multiplier.transitionPending,
    ).toBe(false);
  });

  it("detects a pending multiplier transition", () => {
    const state =
      normaliseRobinhoodStockToken({
        ...AAPL,
        pendingMultiplier:
          "0.500000000000000000",
      });

    expect(state.multiplier.pending).toBe(
      "0.500000000000000000",
    );

    expect(state.multiplier.pendingE18).toBe(
      "500000000000000000",
    );

    expect(
      state.multiplier.transitionPending,
    ).toBe(true);
  });
});
