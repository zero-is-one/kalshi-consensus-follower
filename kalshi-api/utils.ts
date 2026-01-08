import crypto from "crypto";

// Global rate limiter: 10 requests per second
export class RateLimiter {
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerSecond = 10;
  private readonly timeWindowMs = 1000;

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 1 second
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.timeWindowMs
    );

    // If we've hit the limit, wait until the oldest request is 1 second old
    if (this.requestTimestamps.length >= this.maxRequestsPerSecond) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.timeWindowMs - (now - oldestTimestamp);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        // Recursively call to ensure we have a slot
        return this.waitForSlot();
      }
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }
}

export function createSignature(
  privateKeyPem: string,
  timestamp: string,
  method: string,
  path: string
) {
  // Strip query parameters before signing
  const pathWithoutQuery = path.split("?")[0];

  // Message to sign: timestamp + HTTP_METHOD + path_without_query
  const message = `${timestamp}${method}${pathWithoutQuery}`;

  // Sign using RSA-PSS with SHA256
  const signature = crypto.sign("sha256", Buffer.from(message, "utf8"), {
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return signature.toString("base64");
}
