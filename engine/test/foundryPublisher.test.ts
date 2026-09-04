import { describe, expect, it } from "vitest";

import { buildCastSendArgs } from "../src/publish/foundryKeystorePublisher";

describe("FoundryKeystorePublisher", () => {
  it("builds a cast command without exposing private keys", () => {
    const args = buildCastSendArgs(
      {
        registryAddress:
          "0x65605F7169ec0dA7aEF8178A8b7d69159b43B222",
        rpcUrl:
          "https://rpc.testnet.chain.robinhood.com",
        accountName: "mad-testnet-deployer",
      },
      {
        asset:
          "0x9B35982C720e18d84cC9D84C6c20FA9cc45b8d36",
        disorderScore: 65,
        disorderBitmap: 1n,
        evidenceHash:
          "0x5a9b0eb22734511b0a3f78fdd69861b3e3e5cc3ad1f85d70cf8b04b1fc38df0c",
        rulesetHash:
          "0x4707cd5dd53c7195bf25ea754e5c72a349895945ec24fc7028a9543200be9b69",
      },
    );

    expect(args).toContain(
      "updateState(address,uint8,uint256,bytes32,bytes32)",
    );

    expect(args).toContain("mad-testnet-deployer");
    expect(args).toContain("--account");
    expect(args).toContain("--json");

    expect(args.join(" ")).not.toContain(
      "private-key",
    );
  });
});
