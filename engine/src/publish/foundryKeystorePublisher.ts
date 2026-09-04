import { spawnSync } from "node:child_process";

import type {
  PublishResult,
  RegistryPublisher,
  RegistryUpdatePayload,
} from "./types.js";

export interface FoundryKeystorePublisherConfig {
  registryAddress: string;
  rpcUrl: string;
  accountName: string;
}

export function buildCastSendArgs(
  config: FoundryKeystorePublisherConfig,
  update: RegistryUpdatePayload,
): string[] {
  return [
    "send",
    config.registryAddress,
    "updateState(address,uint8,uint256,bytes32,bytes32)",
    update.asset,
    update.disorderScore.toString(),
    update.disorderBitmap.toString(),
    update.evidenceHash,
    update.rulesetHash,
    "--rpc-url",
    config.rpcUrl,
    "--account",
    config.accountName,
    "--json",
  ];
}

export class FoundryKeystorePublisher
  implements RegistryPublisher
{
  constructor(
    private readonly config: FoundryKeystorePublisherConfig,
  ) {}

  async publish(
    update: RegistryUpdatePayload,
  ): Promise<PublishResult> {
    const args = buildCastSendArgs(this.config, update);

    const result = spawnSync("cast", args, {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "inherit"],
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(
        `cast send failed with exit code ${result.status}`,
      );
    }

    if (!result.stdout) {
      throw new Error(
        "cast send returned no transaction receipt",
      );
    }

    const receipt: unknown = JSON.parse(result.stdout);

    if (
      typeof receipt !== "object" ||
      receipt === null ||
      !("transactionHash" in receipt) ||
      typeof receipt.transactionHash !== "string" ||
      !receipt.transactionHash.startsWith("0x")
    ) {
      throw new Error(
        "cast send returned an invalid transaction receipt",
      );
    }

    return {
      transactionHash:
        receipt.transactionHash as `0x${string}`,
    };
  }
}
