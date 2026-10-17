/**
 * Resilient fetch utility with timeout, exponential backoff retries,
 * and structured error handling.
 */

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOnStatus?: number[];
}

export class FetchError extends Error {
  public status?: number;
  public data?: any;
  public isTimeout?: boolean;

  constructor(message: string, status?: number, data?: any, isTimeout = false) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.data = data;
    this.isTimeout = isTimeout;
  }
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 12000,
    retries = 2,
    retryDelayMs = 600,
    retryOnStatus = [502, 503, 504],
    ...fetchInit
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(new DOMException('Request timed out', 'TimeoutError'));
      }, timeoutMs);
    }

    // Merge external abort signal if provided
    if (fetchInit.signal) {
      if (fetchInit.signal.aborted) {
        controller.abort(fetchInit.signal.reason);
      } else {
        fetchInit.signal.addEventListener('abort', () => {
          controller.abort(fetchInit.signal?.reason);
        });
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Check if response status warrants retry (e.g. 502/503/504)
      if (retryOnStatus.includes(response.status) && attempt < retries) {
        attempt++;
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      return response;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);

      const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timed out');
      lastError = new FetchError(
        isTimeout ? `Request timed out after ${timeoutMs}ms` : err?.message || 'Network request failed',
        undefined,
        undefined,
        isTimeout
      );

      // If user deliberately aborted, don't retry
      if (fetchInit.signal?.aborted) {
        throw lastError;
      }

      if (attempt < retries) {
        attempt++;
        const backoff = retryDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      break;
    }
  }

  throw lastError || new FetchError('Network request failed after retries');
}

/**
 * Fetch and safely parse JSON response with timeout and retry
 */
export async function fetchJsonWithRetry<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const response = await fetchWithRetry(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new FetchError(errorMsg, response.status, data);
  }

  return data as T;
}
