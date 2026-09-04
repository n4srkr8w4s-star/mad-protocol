import { MADSeverity } from "../domain/types.js";

import {
  evaluateRobinhoodMultiplierState,
} from "../engine/evaluateRobinhoodMultiplierState.js";

const DEFAULT_ROBINHOOD_MAINNET_RPC =
  "https://rpc.mainnet.chain.robinhood.com";

async function main(): Promise<void> {
  const symbol = process.argv[2];

  if (!symbol) {
    throw new Error(
      "Usage: node dist/cli/robinhoodMultiplierState.js <symbol>",
    );
  }

  const rpcUrl =
    process.env.ROBINHOOD_MAINNET_RPC ??
    DEFAULT_ROBINHOOD_MAINNET_RPC;

  console.log("");
  console.log("MAD ROBINHOOD COHERENCE CHECK");
  console.log("=============================");

  const result =
    await evaluateRobinhoodMultiplierState({
      symbol,
      rpcUrl,
    });

  console.log("");
  console.log("ASSET");
  console.log("-----");
  console.log(`Symbol:              ${result.asset.symbol}`);
  console.log(`Name:                ${result.asset.name}`);
  console.log(`ISIN:                ${result.asset.isin}`);
  console.log(`Chain ID:            ${result.asset.chainId}`);
  console.log(`Contract:            ${result.asset.contractAddress}`);

  console.log("");
  console.log("MULTIPLIER SOURCES");
  console.log("------------------");
  console.log(
    `Robinhood REST:      ${result.sources.robinhoodApi.currentMultiplier}`,
  );
  console.log(
    `REST E18:            ${result.sources.robinhoodApi.currentMultiplierE18}`,
  );
  console.log(
    `Onchain uiMultiplier:${result.sources.robinhoodChain.uiMultiplierE18}`,
  );
  console.log(
    `Pending multiplier:  ${result.sources.robinhoodApi.pendingMultiplier ?? "NONE"}`,
  );

  console.log("");
  console.log("MAD EVALUATION");
  console.log("--------------");
  console.log(
    `Coherence:           ${
      result.evaluation.currentMultiplierMatches
        ? "MATCH"
        : "MISMATCH"
    }`,
  );
  console.log(
    `AD-004 active:       ${
      result.evaluation.active ? "YES" : "NO"
    }`,
  );
  console.log(
    `Transition pending:  ${
      result.evaluation.transitionPending
        ? "YES"
        : "NO"
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
