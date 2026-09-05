import {
  describe,
  expect,
  it,
} from "vitest";

import {
  resolveRobinhoodCapability,
} from "../src/engine/resolveRobinhoodCapability.js";

const ASSET = {
  id: "asset-id",
  tokenSymbol: "TEST",
  tokenName:
    "Test • Robinhood Token",
  deployments: [
    {
      contractAddress:
        "0x1111111111111111111111111111111111111111",
      chainId: 4663,
      networkName:
        "Robinhood Chain",
    },
  ],
  currentMultiplier:
    "1.000000000000000000",
  pendingMultiplier: "",
  status:
    "ASSET_STATUS_ACTIVE",
  logoUrl: "",
  tradingCapabilities: {
    market: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
    extended: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
    overnight: {
      whole: "TRADABLE",
      fractional: "TRADABLE",
    },
  },
  tokenDecimals: 18,
  isin: "TEST-ISIN",
};

const FEED = {
  name:
    "Robinhood TEST / USD",
  proxyAddress:
    "0x2222222222222222222222222222222222222222",
  contractAddress:
    "0x3333333333333333333333333333333333333333",
  secondaryProxyAddress:
    null,
  heartbeatSeconds:
    86400,
  threshold:
    0.5,
  decimals:
    8,
  assetClass:
    "Equity",
  assetSubClass:
    "US",
  baseAsset:
    "TEST",
  quoteAsset:
    "USD",
  marketHours:
    "us_equities_24/5",
  productType:
    "Price",
  productTypeCode:
    "primaryTokenizedPrice",
};

describe(
  "Robinhood capability resolver",
  () => {
    it(
      "classifies an asset with canonical sources as FULL",
      async () => {
        const result =
          await resolveRobinhoodCapability(
            "TEST",
            {
              getAsset:
                async () => ASSET,
              getFeed:
                async () => FEED,
            },
          );

        expect(
          result?.capability,
        ).toBe("FULL");

        expect(
          result?.supportedDisorders,
        ).toBe(4);

        expect(
          result?.totalDisorders,
        ).toBe(4);
      },
    );

    it(
      "classifies an asset without canonical feed metadata as PARTIAL",
      async () => {
        const result =
          await resolveRobinhoodCapability(
            "TEST",
            {
              getAsset:
                async () => ASSET,
              getFeed:
                async () => undefined,
            },
          );

        expect(
          result?.capability,
        ).toBe("PARTIAL");

        expect(
          result?.supportedDisorders,
        ).toBe(2);
      },
    );

    it(
      "does not claim reference disorders when market semantics are unavailable",
      async () => {
        const result =
          await resolveRobinhoodCapability(
            "TEST",
            {
              getAsset:
                async () => ASSET,
              getFeed:
                async () => ({
                  ...FEED,
                  marketHours: null,
                }),
            },
          );

        expect(
          result?.capability,
        ).toBe("PARTIAL");

        expect(
          result?.supportedDisorders,
        ).toBe(2);
      },
    );

    it(
      "classifies an asset without Robinhood Chain deployment as DISCOVERABLE",
      async () => {
        const result =
          await resolveRobinhoodCapability(
            "TEST",
            {
              getAsset:
                async () => ({
                  ...ASSET,
                  deployments: [],
                }),
              getFeed:
                async () => FEED,
            },
          );

        expect(
          result?.capability,
        ).toBe(
          "DISCOVERABLE",
        );

        expect(
          result?.supportedDisorders,
        ).toBe(0);

        expect(
          result?.deployment,
        ).toBeNull();
      },
    );

    it(
      "returns undefined when Robinhood does not know the asset",
      async () => {
        const result =
          await resolveRobinhoodCapability(
            "UNKNOWN",
            {
              getAsset:
                async () => undefined,
              getFeed:
                async () => FEED,
            },
          );

        expect(result).toBeUndefined();
      },
    );
  },
);
