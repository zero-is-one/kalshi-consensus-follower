import axios from "axios";
import type { AxiosResponse } from "axios";
import type {
  KalshiConfig,
  KalshiEventResponse,
  KalshiLeaderboardRequest,
  KalshiLeaderboardResponse,
  KalshiOrderRequest,
  KalshiOrderResponse,
  KalshiPortfolioBalance,
  KalshiProfileHoldingsResponse,
  KalshiProfileMetrics,
  StandardResponse,
} from "./types";
import { createSignature, RateLimiter } from "./utils.ts";

const globalRateLimiter = new RateLimiter();

export function KalshiApi(config: KalshiConfig) {
  const {
    apiKey,
    privateKeyPem,
    baseUrl = "https://api.elections.kalshi.com",
  } = config;

  async function request<T = any>(
    method: string,
    path: string,
    body: any = null
  ): Promise<StandardResponse<T>> {
    // Wait for rate limiter slot
    await globalRateLimiter.waitForSlot();

    const timestamp = Date.now().toString(); // milliseconds
    const signature = createSignature(privateKeyPem, timestamp, method, path);

    const headers: Record<string, string> = {
      "KALSHI-ACCESS-KEY": apiKey,
      "KALSHI-ACCESS-SIGNATURE": signature,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      Accept: "application/json",
    };

    // Add Content-Type header for POST requests
    if (method === "POST" && body) {
      headers["Content-Type"] = "application/json";
    }

    const url = baseUrl + path;

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers,
        data: body,
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          success: false,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          error: {
            message: `Request failed: ${error.response.status} ${error.response.statusText}`,
            code: error.code,
            details: error.response.data,
          },
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          status: 0,
          statusText: "No Response",
          headers: {},
          error: {
            message: "Request failed: No response received",
            code: error.code,
            details: error.message,
          },
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          status: 0,
          statusText: "Request Setup Failed",
          headers: {},
          error: {
            message: `Request failed: ${error.message}`,
            code: error.code,
            details: error.toString(),
          },
        };
      }
    }
  }

  // API Methods
  const getPortfolioBalance = async () => {
    const path = "/trade-api/v2/portfolio/balance";
    return request<KalshiPortfolioBalance>("GET", path);
  };

  const order = async (orderRequest: KalshiOrderRequest) => {
    const path = "/trade-api/v2/portfolio/orders";
    return request<KalshiOrderResponse>("POST", path, orderRequest);
  };

  const getEvent = async (eventTicker: string) => {
    const path = `/trade-api/v2/events/${eventTicker}`;
    return request<KalshiEventResponse>("GET", path);
  };

  const getProfileMetrics = async (nickname: string) => {
    const path = `/v1/social/profile/metrics?nickname=${nickname}&since_day_before=0`;
    return request<KalshiProfileMetrics>("GET", path);
  };

  const getSocialLeaderboard = async (
    leaderboardRequest: KalshiLeaderboardRequest
  ) => {
    let path = `/v1/social/leaderboard?metric_name=${leaderboardRequest.metricName}&limit=${leaderboardRequest.limit}`;

    if (leaderboardRequest.category) {
      path += `&category=${leaderboardRequest.category}`;
    }

    path += `&time_period=${leaderboardRequest.timePeriod}`;

    return request<KalshiLeaderboardResponse>("GET", path);
  };

  const getProfileHoldings = (nickname: string) => {
    let path = `/v1/social/profile/holdings?nickname=${nickname}&limit=99&closed_positions=false`;
    return request<KalshiProfileHoldingsResponse>("GET", path);
  };

  return {
    request,
    getPortfolioBalance,
    order,
    getEvent,
    getProfileMetrics,
    getSocialLeaderboard,
    getProfileHoldings,
  };
}

export type KalshiApiInterface = ReturnType<typeof KalshiApi>;
