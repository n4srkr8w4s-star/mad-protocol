import { formatUnits } from "viem";

import { MADSeverity } from "../domain/types.js";

import {
  evaluateRobinhoodPriceCoherence,
} from "../engine/evaluateRobinhoodPriceCoherence.js";

const DEFAULT_ROBINHOOD_MAINNET_RPC =
  "https://rpc.mainnet.chain.robinhood.com";

async function main(): Promise<void> {
  const symbol = process.argv[2];
  const feedAddress = process.argv[3];

  if (!symbol || !feedAddress) {
    throw new Error(
      "Usage: node dist/cli/robinhoodPriceCoherence.js <symbol> <feedAddress>",
    );
  }

  const rpcUrl =
    process.env.ROBINHOOD_MAINNET_RPC ??
    DEFAULT_ROBINHOOD_MAINNET_RPC;

  console.log("");
  console.log("MAD ROBINHOOD PRICE COHERENCE");
  console.log("=============================");

  const result =
    await evaluateRobinhoodPriceCoherence({
      symbol,
      feedAddress,
      rpcUrl,
    });

  const expectedPrice =
    formatUnits(
      BigInt(
        result.evaluation.expectedPriceE18,
      ),
      18,
    );

  const observedPrice =
    formatUnits(
      BigInt(
        result.evaluation.observedPriceE18,
      ),
      18,
    );

  console.log("");
  console.log("ASSET");
  console.log("-----");
  console.log(`Symbol:              ${result.asset.symbol}`);
  console.log(`Name:                ${result.asset.name}`);
  console.log(`ISIN:                ${result.asset.isin}`);
  console.log(`Chain ID:            ${result.asset.chainId}`);
  console.log(`Contract:            ${result.asset.contractAddress}`);

  console.log("");
  console.log("ROBINHOOD UNDERLYING");
  console.log("--------------------");
  console.log(
    `Bid:                 ${result.sources.robinhoodPrice.bid} ${result.sources.robinhoodPrice.currency}`,
  );
  console.log(
    `Ask:                 ${result.sources.robinhoodPrice.ask} ${result.sources.robinhoodPrice.currency}`,
  );
  console.log(
    `Generated:           ${result.sources.robinhoodPrice.generatedAt}`,
  );
  console.log(
    `Trading halt:        ${
      result.sources.robinhoodPrice.isTradingHalt
        ? "YES"
        : "NO"
    }`,
  );

  console.log("");
  console.log("MULTIPLIER");
  console.log("----------");
  console.log(
    `Current:             ${result.sources.robinhoodAsset.currentMultiplier}`,
  );
  console.log(
    `Pending:             ${result.sources.robinhoodAsset.pendingMultiplier ?? "NONE"}`,
  );

  console.log("");
  console.log("ROBINHOOD CHAIN ORACLE");
  console.log("----------------------");
  console.log(
    `Feed:                ${result.sources.robinhoodOracle.feedAddress}`,
  );
  console.log(
    `Description:         ${result.sources.robinhoodOracle.description}`,
  );
  console.log(
    `Oracle price:        ${result.sources.robinhoodOracle.price}`,
  );
  console.log(
    `Updated:             ${result.sources.robinhoodOracle.updatedAt}`,
  );

  console.log("");
  console.log("MAD EXPECTED STATE");
  console.log("------------------");
  console.log(
    `Expected token price:${expectedPrice}`,
  );
  console.log(
    `Observed oracle:     ${observedPrice}`,
  );

  console.log("");
  console.log("MAD EVALUATION");
  console.log("--------------");
  console.log(
    `Deviation:           ${result.evaluation.deviationBps} bps`,
  );
  console.log(
    `Direction:           ${result.evaluation.direction}`,
  );
  console.log(
    `AD-007 active:       ${
      result.evaluation.active ? "YES" : "NO"
    }`,
  );
  console.log(
    `MAD score:           ${result.evaluation.score}`,
  );
  console.log(
    `Severity:            ${
      MADSeverity[result.evaluation.severity]
    }`,
  );
  console.log(
    `Reason:              ${result.evaluation.reason}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
