export interface KalshiConfig {
  apiKey: string;
  privateKeyPem: string;
  baseUrl?: string;
}

export interface StandardResponse<T = any> {
  status: number;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  statusText: string;
  headers: any;
  success: boolean;
}

export type KalshiPortfolioBalance = {
  balance: number;
  portfolio_value: number;
  updated_ts: number;
};

export type KalshiEvent = {
  event_ticker: string;
  series_ticker: string;
  sub_title: string;
  title: string;
  collateral_return_type: string;
  mutually_exclusive: boolean;
  category: string;
  strike_date: string;
  strike_period: string;
  markets: KalshiMarket[];
  available_on_brokers: boolean;
  product_metadata: Record<string, unknown>;
};

export type KalshiMarket = {
  ticker: string;
  event_ticker: string;
  market_type: "binary";
  title: string;
  subtitle: string;
  yes_sub_title: string;
  no_sub_title: string;
  open_time: string;
  close_time: string;
  expected_expiration_time: string;
  expiration_time: string;
  latest_expiration_time: string;
  settlement_timer_seconds: number;
  status: "initialized" | string;
  response_price_units: "cents";
  yes_bid: number;
  yes_bid_dollars: string;
  yes_ask: number;
  yes_ask_dollars: string;
  no_bid: number;
  no_bid_dollars: string;
  no_ask: number;
  no_ask_dollars: string;
  last_price: number;
  last_price_dollars: string;
  volume: number;
  volume_24h: number;
  result: "yes" | string;
  can_close_early: boolean;
  open_interest: number;
  notional_value: number;
  notional_value_dollars: string;
  previous_yes_bid: number;
  previous_yes_bid_dollars: string;
  previous_yes_ask: number;
  previous_yes_ask_dollars: string;
  previous_price: number;
  previous_price_dollars: string;
  liquidity: number;
  liquidity_dollars: string;
  settlement_value: number;
  settlement_value_dollars: string;
  expiration_value: string;
  category: string;
  risk_limit_cents: number;
  fee_waiver_expiration_time: string;
  early_close_condition: string;
  tick_size: number;
  strike_type: "greater" | string;
  floor_strike: number;
  cap_strike: number;
  functional_strike: string;
  custom_strike: Record<string, unknown>;
  rules_primary: string;
  rules_secondary: string;
  mve_collection_ticker: string;
  mve_selected_legs: Array<{
    event_ticker: string;
    market_ticker: string;
    side: string;
  }>;
  primary_participant_key: string;
  price_level_structure: string;
  price_ranges: Array<{
    start: string;
    end: string;
    step: string;
  }>;
};

export type KalshiOrderRequest = {
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count: number;
  client_order_id?: string;
  type?: "limit" | "market";
  yes_price?: number;
  no_price?: number;
  yes_price_dollars?: string;
  no_price_dollars?: string;
  expiration_ts?: number;
  time_in_force?: "fill_or_kill" | "good_till_canceled" | "immediate_or_cancel";
  buy_max_cost?: number;
  post_only?: boolean;
  reduce_only?: boolean;
  sell_position_floor?: number;
  self_trade_prevention_type?: "taker_at_cross" | "maker";
  order_group_id?: string;
  cancel_order_on_pause?: boolean;
};

export type KalshiOrderResponse = {
  order: {
    order_id: string;
    user_id: string;
    client_order_id: string;
    ticker: string;
    side: "yes" | "no";
    action: "buy" | "sell";
    type: "limit" | "market";
    status: "resting" | string;
    yes_price: number;
    no_price: number;
    yes_price_dollars: string;
    no_price_dollars: string;
    fill_count: number;
    remaining_count: number;
    initial_count: number;
    taker_fees: number;
    maker_fees: number;
    taker_fill_cost: number;
    maker_fill_cost: number;
    taker_fill_cost_dollars: string;
    maker_fill_cost_dollars: string;
    queue_position: number;
    taker_fees_dollars: string;
    maker_fees_dollars: string;
    expiration_time: string;
    created_time: string;
    last_update_time: string;
    self_trade_prevention_type: "taker_at_cross" | "maker";
    order_group_id: string;
    cancel_order_on_pause: boolean;
  };
};

export type KalshiEventResponse = {
  event: KalshiEvent;
  markets: KalshiMarket[];
};

export type KalshiProfileMetrics = {
  metrics: {
    signed_open_position: number | null;
    open_interest: number | null;
    volume: number | null;
    dollars_traded: number | null;
    dollars_investment: number | null;
    pnl: number | null;
    portfolio_value: number | null;
    roi: number | null;
    num_markets_traded: number | null;
  };
  social_id: string;
};

export const leaderboardMetricNames = [
  "volume",
  "projected_pnl",
  "num_markets_traded",
] as const;
export type KalshiLeaderboardMetricName =
  (typeof leaderboardMetricNames)[number];

export const leaderboardCategories = [
  "Politics",
  "Sports",
  "Entertainment", // this is "Culture" in the UI
  "Crypto",
  "Climate+and+Weather", // this is "Climate" in the UI
  "Economics",
  "Mentions",
  "Companies",
  "Financials",
  "Science+and+Technology",
  "Health",
  "World",
  "Elections",
] as const;

export type KalshiLeaderboardCategory = (typeof leaderboardCategories)[number];

export type KalshiLeaderboardRequest = {
  metricName: KalshiLeaderboardMetricName;
  limit: number;
  timePeriod: "yearly" | "monthly" | "weekly" | "daily" | "all_time";
  category?: KalshiLeaderboardCategory;
};

export type KalshiLeaderboardResponse = {
  rank_list: Array<{
    nickname: string;
    social_id: string;
    profile_image_path: string;
    value: number;
    rank: number;
    is_anonymous: boolean;
  }>;
};

export type KalshiProfileMarketHolding = {
  market_id: string;
  market_ticker: string;
  signed_open_position: number;
  pnl: number;
};

export type KalshiProfileHolding = {
  event_ticker: string;
  series_ticker: string;
  total_absolute_position: number;
  market_holdings: KalshiProfileMarketHolding[];
};

export type KalshiProfileHoldingsResponse = {
  holdings: KalshiProfileHolding[];
  social_id: string;
};
