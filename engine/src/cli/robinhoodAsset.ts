import {
  getRobinhoodAssetBySymbol,
  getRobinhoodChainDeployment,
} from "../adapters/robinhood/assets.js";

async function main(): Promise<void> {
  const symbol = process.argv[2];

  if (!symbol) {
    throw new Error(
      "Usage: node dist/cli/robinhoodAsset.js <symbol>",
    );
  }

  const asset =
    await getRobinhoodAssetBySymbol(symbol);

  if (!asset) {
    throw new Error(
      `Robinhood Stock Token not found: ${symbol}`,
    );
  }

  const deployment =
    getRobinhoodChainDeployment(asset);

  if (!deployment) {
    throw new Error(
      `${asset.tokenSymbol} has no Robinhood Chain mainnet deployment`,
    );
  }

  console.log("");
  console.log("ROBINHOOD STOCK TOKEN");
  console.log("=====================");
  console.log(`Symbol:              ${asset.tokenSymbol}`);
  console.log(`Name:                ${asset.tokenName}`);
  console.log(`Asset ID:            ${asset.id}`);
  console.log(`ISIN:                ${asset.isin}`);
  console.log(`Status:              ${asset.status}`);
  console.log(`Decimals:            ${asset.tokenDecimals}`);

  console.log("");
  console.log("DEPLOYMENT");
  console.log("----------");
  console.log(`Network:             ${deployment.networkName}`);
  console.log(`Chain ID:            ${deployment.chainId}`);
  console.log(`Contract:            ${deployment.contractAddress}`);

  console.log("");
  console.log("MULTIPLIER STATE");
  console.log("----------------");
  console.log(`Current multiplier:  ${asset.currentMultiplier}`);
  console.log(
    `Pending multiplier: ${asset.pendingMultiplier || "NONE"}`,
  );

  console.log("");
  console.log("TRADING CAPABILITIES");
  console.log("--------------------");
  console.log(
    `Market:             ${asset.tradingCapabilities.market.whole}`,
  );
  console.log(
    `Extended:           ${asset.tradingCapabilities.extended.whole}`,
  );
  console.log(
    `Overnight:          ${asset.tradingCapabilities.overnight.whole}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
