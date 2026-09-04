import { describe, expect, it } from "vitest";

import { decodeActiveDisorders } from "../src/read/registryReader.js";

describe("MAD State Reader", () => {
  it("decodes multiple Active Disorders from a bitmap", () => {
    const disorders = decodeActiveDisorders(
      (1n << 0n) |
      (1n << 4n) |
      (1n << 7n),
    );

    expect(disorders).toEqual([
      {
        id: 0,
        code: "PRICE_DISLOCATION",
      },
      {
        id: 4,
        code: "REFERENCE_DATA_STALE",
      },
      {
        id: 7,
        code: "ORACLE_DEVIATION",
      },
    ]);
  });

  it("returns no disorders for a zero bitmap", () => {
    expect(decodeActiveDisorders(0n)).toEqual([]);
  });
});
