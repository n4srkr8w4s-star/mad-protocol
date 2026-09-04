import { readMADOnchainSnapshot } from "../read/registryReader.js";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

async function main(): Promise<void> {
  const rpcUrl = requireEnv("ROBINHOOD_TESTNET_RPC");
  const registryAddress = requireEnv("MAD_REGISTRY");
  const assetAddress = requireEnv("MAD_ASSET_ADDRESS");

  const symbol =
    process.env.MAD_ASSET_SYMBOL ?? "UNKNOWN";

  const snapshot = await readMADOnchainSnapshot({
    registryAddress,
    assetAddress,
    rpcUrl,
  });

  console.log("");
  console.log("MAD LIVE STATE");
  console.log("==============");
  console.log(`Asset:             ${symbol}`);
  console.log(`Address:           ${snapshot.asset.address}`);
  console.log(`Supported:         ${snapshot.asset.supported}`);
  console.log("");
  console.log(`MAD Score:         ${snapshot.mad.score}`);
  console.log(`Severity:          ${snapshot.mad.severity}`);
  console.log(`Disordered:        ${snapshot.mad.isDisordered}`);
  console.log(`Bitmap:            ${snapshot.mad.disorderBitmap}`);
  console.log(`Sequence:          ${snapshot.mad.sequence}`);
  console.log("");

  if (snapshot.mad.activeDisorders.length === 0) {
    console.log("Active Disorders:  NONE");
  } else {
    console.log("Active Disorders:");

    for (const disorder of snapshot.mad.activeDisorders) {
      console.log(
        `  AD-${String(disorder.id + 1).padStart(3, "0")} ${disorder.code}`,
      );
    }
  }

  console.log("");
  console.log("PROVENANCE");
  console.log("----------");
  console.log(
    `Evidence hash:     ${snapshot.provenance.evidenceHash}`,
  );
  console.log(
    `Ruleset hash:      ${snapshot.provenance.rulesetHash}`,
  );
  console.log(
    `Updated:           ${snapshot.provenance.updatedAtIso}`,
  );

  console.log("");
  console.log("NETWORK");
  console.log("-------");
  console.log(
    `${snapshot.network.name} (${snapshot.network.chainId})`,
  );
  console.log(
    `Registry:          ${snapshot.network.registry}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
