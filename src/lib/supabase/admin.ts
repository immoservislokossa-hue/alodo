import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableFetchError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("connect timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  );
}

async function fetchWithRetry(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
  const maxAttempts = 3;
  const timeoutMs = 20000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (attempt === maxAttempts || !isRetryableFetchError(error)) {
        throw error;
      }

      await sleep(500 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Supabase fetch failed after retries.");
}

export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Supabase admin configuration is missing.");
  }

  adminClient = createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: fetchWithRetry,
    },
  });

  return adminClient;
}
