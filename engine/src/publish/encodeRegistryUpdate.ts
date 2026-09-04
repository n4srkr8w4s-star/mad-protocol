import {
  encodeFunctionData,
  getAddress,
} from "viem";

import { MAD_STATE_REGISTRY_ABI } from "./registryAbi.js";
import type { RegistryUpdatePayload } from "./types.js";

export function encodeRegistryUpdate(
  update: RegistryUpdatePayload,
): `0x${string}` {
  if (
    !Number.isInteger(update.disorderScore) ||
    update.disorderScore < 0 ||
    update.disorderScore > 100
  ) {
    throw new Error(
      `Invalid MAD disorder score: ${update.disorderScore}`,
    );
  }

  if (update.disorderBitmap < 0n) {
    throw new Error("Disorder bitmap cannot be negative");
  }

  return encodeFunctionData({
    abi: MAD_STATE_REGISTRY_ABI,
    functionName: "updateState",
    args: [
      getAddress(update.asset),
      update.disorderScore,
      update.disorderBitmap,
      update.evidenceHash,
      update.rulesetHash,
    ],
  });
}
