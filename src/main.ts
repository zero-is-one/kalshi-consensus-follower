import kalshiConfig from "../kalshi-config.json" with { type: "json" };
import { KalshiApi } from "../kalshi-api/index.ts";
import type {
  KalshiOrderResponse,
  KalshiProfileHolding,
} from "../kalshi-api/types.ts";

const kalshiApi = KalshiApi(kalshiConfig);

const pastMarketsThatOrdered: string[] = [];
let ordersMadeDuringSession = 0;
let sessionRunCount = 0;

async function main({ isInitialRun = true }: { isInitialRun?: boolean }) {
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
  ].filter(([_, userHoldings]) => userHoldings.length >= 2);

  for (const [marketTicker, userHoldings] of userHoldingsByMarketTickerArr) {
    console.log(
      `Market ID: ${marketTicker}`,
      userHoldings.map((uh) => uh.nickname)
    );

    const pastMarketOrderCount = pastMarketsThatOrdered.filter(
      (id) => id === marketTicker
    ).length;

    pastMarketsThatOrdered.push(...userHoldings.map(() => marketTicker));

    const newOrdersToPlaceCount = userHoldings.length - pastMarketOrderCount;

    if (newOrdersToPlaceCount === 0) {
      console.log(
        `-> Skipping market ${marketTicker}. It has already been ordered for all users in the past.`
      );
      continue;
    }

    if (isInitialRun) {
      console.log(
        `-> Skipping market ${marketTicker}. This is the first run. Skipping order placement to avoid unintended consequences.`
      );
      continue;
    }

    const marketHolding = userHoldings[0].holding.market_holdings[0];
    const side = marketHolding.signed_open_position > 0 ? "yes" : "no";

    await kalshiApi.order({
      ticker: marketTicker,
      side,
      action: "buy",
      count: newOrdersToPlaceCount,
      type: "market",
      [`${side}_price`]: 95,
    });

    ordersMadeDuringSession += newOrdersToPlaceCount;

    console.log(
      `Placed ${newOrdersToPlaceCount} orders for market ${marketTicker} for users:`
    );
  }

  sessionRunCount++;

  const nycTime = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
  });

  console.log(
    `Total orders placed during this session: ${ordersMadeDuringSession}.`
  );
  console.log(
    `Total Runs: ${sessionRunCount}. Total markets ordered: ${pastMarketsThatOrdered.length}.`
  );
  console.log(`--- Run Complete (${nycTime}) ---`);
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
