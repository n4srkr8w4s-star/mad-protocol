import { evaluatePriceState } from "../engine/evaluatePriceState.js";
import { FoundryKeystorePublisher } from "../publish/foundryKeystorePublisher.js";
import { MADSeverity } from "../domain/types.js";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const rpcUrl = requireEnv("ROBINHOOD_TESTNET_RPC");
  const registryAddress = requireEnv("MAD_REGISTRY");
  const assetAddress = requireEnv("MAD_ASSET_ADDRESS");
  const symbol = requireEnv("MAD_ASSET_SYMBOL");

  const expectedPriceE6 = BigInt(
    requireEnv("MAD_EXPECTED_PRICE_E6"),
  );

  const observedPriceE6 = BigInt(
    requireEnv("MAD_OBSERVED_PRICE_E6"),
  );

  const accountName =
    process.env.MAD_KEYSTORE_ACCOUNT ??
    "mad-testnet-deployer";

  const result = evaluatePriceState(
    {
      chainId: 46630,
      assetAddress,
      symbol,
    },
    {
      expectedPriceE6,
      observedPriceE6,
    },
  );

  console.log("");
  console.log("MAD ENGINE RESULT");
  console.log("-----------------");
  console.log(`Asset:           ${symbol}`);
  console.log(`Address:         ${assetAddress}`);
  console.log(
    `Deviation:       ${result.observation.deviationBps} bps`,
  );
  console.log(
    `Direction:       ${result.observation.direction}`,
  );
  console.log(
    `Score:           ${result.state.disorderScore}`,
  );
  console.log(
    `Severity:        ${MADSeverity[result.state.severity]}`,
  );
  console.log(
    `Bitmap:          ${result.state.disorderBitmap}`,
  );
  console.log(
    `Evidence hash:   ${result.provenance.evidenceHash}`,
  );
  console.log(
    `Ruleset hash:    ${result.provenance.rulesetHash}`,
  );

  const shouldPublish = process.argv.includes("--publish");

  if (!shouldPublish) {
    console.log("");
    console.log("DRY RUN ONLY — no transaction submitted.");
    console.log(
      "Run again with --publish to submit this state.",
    );
    return;
  }

  console.log("");
  console.log("Publishing to MADStateRegistry...");

  const publisher = new FoundryKeystorePublisher({
    registryAddress,
    rpcUrl,
    accountName,
  });

  const published = await publisher.publish(
    result.registryUpdate,
  );

  console.log("");
  console.log("MAD STATE PUBLISHED");
  console.log(
    `Transaction: ${published.transactionHash}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
