import {
  decodeFunctionData,
} from "viem";

import { describe, expect, it } from "vitest";

import { evaluatePriceState } from "../src/engine/evaluatePriceState";
import { encodeRegistryUpdate } from "../src/publish/encodeRegistryUpdate";
import { MAD_STATE_REGISTRY_ABI } from "../src/publish/registryAbi";

const TPONS =
  "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36";

describe("MAD Registry Publisher boundary", () => {
  it("encodes the Engine output for MADStateRegistry.updateState", () => {
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

    const calldata = encodeRegistryUpdate(
      result.registryUpdate,
    );

    const decoded = decodeFunctionData({
      abi: MAD_STATE_REGISTRY_ABI,
      data: calldata,
    });

    expect(decoded.functionName).toBe("updateState");

    expect(decoded.args).toEqual([
      TPONS,
      65,
      1n,
      "0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c",
      "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
    ]);
  });
});
