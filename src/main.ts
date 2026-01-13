import kalshiConfig from "../kalshi-config.json" with { type: "json" };
import { KalshiApi } from "../kalshi-api/index.ts";
import type {
  KalshiOrderResponse,
  KalshiProfileHolding,
} from "../kalshi-api/types.ts";
import { getPrettyTimestamp } from "./utils.ts";

const kalshiApi = KalshiApi(kalshiConfig);

const pastMarketsThatOrdered: string[] = [];
const stats = {
  totalOrdersPlaced: 0,
  totalRuns: 0,
};

async function main({ isInitialRun = true }: { isInitialRun?: boolean }) {
  console.log(`--- V2 Starting Run (${getPrettyTimestamp()}) ---`);
  const timePeriods = [
    "all_time",
    "yearly",
    "monthly",
    //"weekly",
    //"daily",
  ] as const; // Change this to "yearly", "monthly", "daily", or "all_time" as needed

  const leaderboardNicknames: string[] = [];

  for (const timePeriod of timePeriods) {
    const response = await kalshiApi.getSocialLeaderboard({
      metricName: "projected_pnl",
      timePeriod,
      limit: 99,
    });

    if (response.error) {
      console.error("Error fetching leaderboard:", response.error);
      return;
    }

    const users = response.data?.rank_list!;
    console.log(
      `Fetched ${users.length} users from ${timePeriod} leaderboard.`
    );

    // only add unique nicknames to the list
    for (const user of users) {
      if (!leaderboardNicknames.includes(user.nickname)) {
        leaderboardNicknames.push(user.nickname);
      }
    }
  }

  const userHoldingsByMarketTicker = new Map<
    string,
    Array<{ nickname: string; holding: KalshiProfileHolding }>
  >();

  console.log(
    `There are ${leaderboardNicknames.length} unique users from all leaderboards. Fetching their holdings...`
  );
  for (const nickname of leaderboardNicknames) {
    const holdingsResponse = await kalshiApi.getProfileHoldings(nickname);
    if (holdingsResponse.error) {
      console.error(
        `Error fetching holdings for ${nickname}:`,
        holdingsResponse.error
      );
      continue;
    }

    const holdings = holdingsResponse.data?.holdings || [];

    for (const holding of holdings) {
      for (const marketHolding of holding.market_holdings) {
        const marketTicker = marketHolding.market_ticker;
        if (!userHoldingsByMarketTicker.has(marketTicker)) {
          userHoldingsByMarketTicker.set(marketTicker, []);
        }
        userHoldingsByMarketTicker.get(marketTicker)!.push({
          nickname: nickname,
          holding: holding,
        });
      }
    }
  }

  console.log("Users grouped by market holdings:");
  const userHoldingsByMarketTickerArr = [
    ...userHoldingsByMarketTicker.entries(),
  ].filter(([_, userHoldings]) => userHoldings.length >= 3);

  for (const [marketTicker, userHoldings] of userHoldingsByMarketTickerArr) {
    console.log(
      `Market ID: ${marketTicker}`,
      userHoldings.map((uh) => uh.nickname)
    );

    if (pastMarketsThatOrdered.includes(marketTicker)) {
      console.log(
        `-> Skipping market ${marketTicker}. It has already been ordered.`
      );
      continue;
    }

    pastMarketsThatOrdered.push(marketTicker);

    if (isInitialRun) {
      console.log(
        `-> Skipping market ${marketTicker}. This is the first run. Skipping order placement to avoid unintended consequences.`
      );
      continue;
    }

    const marketHolding = userHoldings[0].holding.market_holdings[0];
    const side = marketHolding.signed_open_position > 0 ? "yes" : "no";

    const order = await kalshiApi.order({
      ticker: marketTicker,
      side,
      action: "buy",
      count: 3,
      type: "market",
      [`${side}_price`]: 95,
    });

    stats.totalOrdersPlaced += 1;

    console.log(`Placed order for market ${marketTicker}`, order);
  }

  stats.totalRuns += 1;

  console.log(
    `Total orders placed during this session: ${stats.totalOrdersPlaced}.`
  );
  console.log(
    `Total Runs: ${stats.totalRuns}. Total markets ordered: ${pastMarketsThatOrdered.length}.`
  );
  console.log(`--- Run Complete (${getPrettyTimestamp()}) ---`);
}

await main({ isInitialRun: true });

setInterval(
  () => {
    console.log("Starting the next run...");
    try {
      main({ isInitialRun: false });
    } catch (error) {
      console.error("Error during the next run:", error);
    }
  },
  1000 * 60 * 60 * 2 // Run every 2 hours
);
