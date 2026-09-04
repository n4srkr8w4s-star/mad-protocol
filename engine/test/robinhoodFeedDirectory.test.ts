import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseRobinhoodFeedMetadata,
} from "../src/adapters/robinhood/feedDirectory.js";

const AAPL_PROXY =
  "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0";

const DIRECTORY_PAYLOAD = [
  {
    compareOffchain: "",
    contractAddress:
      "0xBb11A21267cFDb63d4935d99a499133DD1744ACb",
    contractType: "",
    contractVersion: 6,
    decimalPlaces: null,
    ens: null,
    formatDecimalPlaces: null,
    healthPrice: "",
    heartbeat: 86400,
    history: null,
    multiply: "100000000",
    name: "Robinhood AAPL / USD",
    pair: ["", ""],
    path: "robinhood-aapl-usd-shared-svr",

    proxyAddress:
      "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",

    secondaryProxyAddress:
      "0x4bDbb3150014c6Ab2C6D9347B0779c49015a2f3f",

    threshold: 0.5,

    valuePrefix: "",

    assetName:
      "Apple (Robinhood Tokenized Equity)",

    feedCategory: "custom",
    feedType: "Crypto",

    docs: {
      assetClass: "Equity",
      assetSubClass: "US",
      attributeType: "other",
      baseAsset: "AAPL",
      baseAssetClic: "AAPL_CR",
      baseAssetEntityId: "crypto-AAPL",
      blockchainName: "Robinhood",
      clicProductName:
        "AAPL/USD-RefPrice-DF-Robinhood-001",
      deliveryChannelCode: "DF",
      marketHours: "us_equities_24/5",
      productSubType: "calculatedPrice",
      productType: "Price",
      productTypeCode:
        "primaryTokenizedPrice",
      quoteAsset: "USD",
      quoteAssetClic: "USD_FX",
      quoteAssetEntityId: "forex-USD",
    },

    decimals: 8,

    maxSubmissionValue:
      "95780971304118053647396689196894323976171195136475135",
  },
];

describe(
  "Robinhood feed directory adapter",
  () => {
    it("normalises the observed AAPL feed metadata", () => {
      const feed =
        parseRobinhoodFeedMetadata(
          DIRECTORY_PAYLOAD,
          AAPL_PROXY,
        );

      expect(feed.name).toBe(
        "Robinhood AAPL / USD",
      );

      expect(
        feed.proxyAddress,
      ).toBe(AAPL_PROXY);

      expect(
        feed.contractAddress,
      ).toBe(
        "0xBb11A21267cFDb63d4935d99a499133DD1744ACb",
      );

      expect(
        feed.heartbeatSeconds,
      ).toBe(86400);

      expect(feed.decimals).toBe(8);

      expect(feed.threshold).toBe(
        0.5,
      );
    });

    it("preserves feed semantics needed by MAD", () => {
      const feed =
        parseRobinhoodFeedMetadata(
          DIRECTORY_PAYLOAD,
          AAPL_PROXY,
        );

      expect(feed.baseAsset).toBe(
        "AAPL",
      );

      expect(feed.quoteAsset).toBe(
        "USD",
      );

      expect(feed.assetClass).toBe(
        "Equity",
      );

      expect(feed.assetSubClass).toBe(
        "US",
      );

      expect(feed.marketHours).toBe(
        "us_equities_24/5",
      );

      expect(
        feed.productTypeCode,
      ).toBe(
        "primaryTokenizedPrice",
      );
    });

    it("finds the feed proxy case-insensitively", () => {
      const feed =
        parseRobinhoodFeedMetadata(
          DIRECTORY_PAYLOAD,
          AAPL_PROXY.toLowerCase(),
        );

      expect(
        feed.heartbeatSeconds,
      ).toBe(86400);
    });

    it("rejects an unknown feed", () => {
      expect(() =>
        parseRobinhoodFeedMetadata(
          DIRECTORY_PAYLOAD,
          "0x0000000000000000000000000000000000000001",
        ),
      ).toThrow(
        "Robinhood feed not found in directory",
      );
    });
  },
);
