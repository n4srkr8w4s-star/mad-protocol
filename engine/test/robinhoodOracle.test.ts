import {
  describe,
  expect,
  it,
} from "vitest";

import {
  normaliseRobinhoodOracle,
} from "../src/adapters/robinhood/oracle.js";

const AAPL_FEED =
  "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0";

describe(
  "Robinhood Stock Token oracle adapter",
  () => {
    it("normalises the observed AAPL oracle state", () => {
      const oracle =
        normaliseRobinhoodOracle({
          feedAddress:
            AAPL_FEED,

          description:
            "Robinhood AAPL / USD",

          decimals: 8,

          roundId:
            18446744073709552171n,

          answer:
            32707004308n,

          startedAt:
            1788504283n,

          updatedAt:
            1788504295n,

          answeredInRound:
            18446744073709552171n,
        });

      expect(
        oracle.description,
      ).toBe(
        "Robinhood AAPL / USD",
      );

      expect(
        oracle.decimals,
      ).toBe(8);

      expect(
        oracle.answerRaw,
      ).toBe(
        "32707004308",
      );

      expect(
        oracle.price,
      ).toBe(
        "327.07004308",
      );
    });

    it("preserves oracle provenance", () => {
      const oracle =
        normaliseRobinhoodOracle({
          feedAddress:
            AAPL_FEED,

          description:
            "Robinhood AAPL / USD",

          decimals: 8,

          roundId:
            18446744073709552171n,

          answer:
            32707004308n,

          startedAt:
            1788504283n,

          updatedAt:
            1788504295n,

          answeredInRound:
            18446744073709552171n,
        });

      expect(
        oracle.roundId,
      ).toBe(
        "18446744073709552171",
      );

      expect(
        oracle.updatedAtUnix,
      ).toBe(
        "1788504295",
      );

      expect(
        oracle.answeredInRound,
      ).toBe(
        "18446744073709552171",
      );
    });

    it("rejects a non-positive oracle answer", () => {
      expect(() =>
        normaliseRobinhoodOracle({
          feedAddress:
            AAPL_FEED,

          description:
            "Robinhood AAPL / USD",

          decimals: 8,

          roundId: 1n,
          answer: 0n,
          startedAt: 1n,
          updatedAt: 1n,
          answeredInRound: 1n,
        }),
      ).toThrow(
        "Invalid oracle answer",
      );
    });

    it("rejects an incomplete oracle round", () => {
      expect(() =>
        normaliseRobinhoodOracle({
          feedAddress:
            AAPL_FEED,

          description:
            "Robinhood AAPL / USD",

          decimals: 8,

          roundId: 10n,
          answer:
            32707004308n,

          startedAt: 1n,
          updatedAt: 1n,
          answeredInRound: 9n,
        }),
      ).toThrow(
        "answeredInRound is behind roundId",
      );
    });
  },
);
