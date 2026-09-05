import {
  MADSeverity,
} from "../domain/types.js";

import {
  evaluateRobinhoodCompositeState,
} from "../engine/evaluateRobinhoodCompositeState.js";

const DEFAULT_ROBINHOOD_MAINNET_RPC =
  "https://rpc.mainnet.chain.robinhood.com";

async function main(): Promise<void> {
  const symbol = process.argv[2];

  if (!symbol) {
    throw new Error(
      "Usage: node dist/cli/robinhoodCompositeState.js <symbol>",
    );
  }

  const rpcUrl =
    process.env.ROBINHOOD_MAINNET_RPC ??
    DEFAULT_ROBINHOOD_MAINNET_RPC;

  console.log("");
  console.log("MAD COMPOSITE STOCK TOKEN STATE");
  console.log("===============================");

  const result =
    await evaluateRobinhoodCompositeState({
      symbol,      rpcUrl,
    });

  console.log("");
  console.log("ASSET");
  console.log("-----");
  console.log(`Symbol:              ${result.asset.symbol}`);
  console.log(`Name:                ${result.asset.name}`);
  console.log(`ISIN:                ${result.asset.isin}`);
  console.log(`Status:              ${result.asset.status}`);
  console.log(`Chain ID:            ${result.asset.chainId}`);
  console.log(`Contract:            ${result.asset.contractAddress}`);

  console.log("");
  console.log("UNDERLYING");
  console.log("----------");
  console.log(
    `Bid:                 ${result.observations.underlying.bid} ${result.observations.underlying.currency}`,
  );
  console.log(
    `Ask:                 ${result.observations.underlying.ask} ${result.observations.underlying.currency}`,
  );
  console.log(
    `Trading halt:        ${
      result.observations.underlying.isTradingHalt
        ? "YES"
        : "NO"
    }`,
  );
  console.log(
    `Generated:           ${result.observations.underlying.generatedAt}`,
  );

  console.log("");
  console.log("MULTIPLIER");
  console.log("----------");
  console.log(
    `Robinhood REST:      ${result.observations.multiplier.robinhoodApi}`,
  );
  console.log(
    `REST E18:            ${result.observations.multiplier.robinhoodApiE18}`,
  );
  console.log(
    `Onchain E18:         ${result.observations.multiplier.onchainE18}`,
  );
  console.log(
    `Pending:             ${result.observations.multiplier.pending ?? "NONE"}`,
  );

  console.log("");
  console.log("ORACLE");
  console.log("------");
  console.log(
    `Feed:                ${result.observations.oracle.feedAddress}`,
  );
  console.log(
    `Description:         ${result.observations.oracle.description}`,
  );
  console.log(
    `Price:               ${result.observations.oracle.price}`,
  );
  console.log(
    `Updated:             ${result.observations.oracle.updatedAt}`,
  );

  console.log("");
  console.log("SOURCE TIMING");
  console.log("-------------");
  console.log(
    `REST quote age:      ${result.observations.timing.robinhoodPriceAgeSeconds}s`,
  );
  console.log(
    `Oracle age:          ${result.observations.timing.oracleAgeSeconds}s`,
  );
  console.log(
    `Cross-source skew:   ${result.observations.timing.sourceSkewSeconds}s`,
  );

  console.log("");
  console.log("ASSESSED DISORDERS");
  console.log("------------------");

  for (const disorder of result.disorders.assessed) {
    console.log(
      `${disorder.code}:`,
    );
    console.log(
      `  Active:            ${
        disorder.evaluation.active
          ? "YES"
          : "NO"
      }`,
    );
    console.log(
      `  Score:             ${disorder.evaluation.score}`,
    );
    console.log(
      `  Severity:          ${
        MADSeverity[
          disorder.evaluation.severity
        ]
      }`,
    );
    console.log(
      `  Reason:            ${disorder.evaluation.reason}`,
    );
  }

  console.log("");
  console.log("UNASSESSED DISORDERS");
  console.log("--------------------");

  for (const disorder of result.disorders.unassessed) {
    console.log(
      `${disorder.code}: UNASSESSED`,
    );
    console.log(
      `  Reason:            ${disorder.reason}`,
    );
  }

  console.log("");
  console.log("COMPOSITE MAD STATE");
  console.log("-------------------");
  console.log(
    `MAD score:           ${result.mad.disorderScore}`,
  );
  console.log(
    `Severity:            ${
      MADSeverity[result.mad.severity]
    }`,
  );
  console.log(
    `Bitmap:              ${result.mad.disorderBitmap}`,
  );
  console.log(
    `Active disorders:    ${result.mad.activeDisorders.length}`,
  );
  console.log(
    `Assessed disorders:  ${result.mad.assessedDisorders}`,
  );
  console.log(
    `Unassessed:          ${result.mad.unassessedDisorders}`,
  );

  if (
    result.mad.unassessedDisorders > 0
  ) {
    console.log("");
    console.log(
      "Coverage note: overall MAD severity applies only to assessed disorders.",
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
