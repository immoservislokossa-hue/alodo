type Session = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  user?: {
    id: string;
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type AuthResult = {
  data: {
    session: Session | null;
    user: Session["user"] | null;
  };
  error: Error | null;
};

type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

const STORAGE_KEY = "alodo.supabase.session";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Configuration Supabase manquante.");
  }

  return { url, anonKey };
}

function readSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeSession(session: Session | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function buildAuthHeaders(session: Session | null, anonKey: string) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${session?.access_token ?? anonKey}`,
    "Content-Type": "application/json",
  };
}

function buildRestHeaders(session: Session | null, anonKey: string) {
  return {
    ...buildAuthHeaders(session, anonKey),
    Prefer: "return=representation",
  };
}

export function createSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  const auth = {
    async signInWithPassword({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResult> {
      try {
        const response = await fetch(
          `${url}/auth/v1/token?grant_type=password`,
          {
            method: "POST",
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          }
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.error_description ||
              payload?.msg ||
              "Email ou mot de passe invalide."
          );
        }

        const session = payload as Session;
        writeSession(session);

        return {
          data: {
            session,
            user: session.user ?? null,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: { session: null, user: null },
          error: error instanceof Error ? error : new Error("Connexion impossible."),
        };
      }
    },

    async getSession(): Promise<{ data: { session: Session | null } }> {
      return { data: { session: readSession() } };
    },

    async getUser(): Promise<AuthResult> {
      try {
        const session = readSession();
        if (!session?.access_token) {
          return { data: { session: null, user: null }, error: null };
        }

        const response = await fetch(`${url}/auth/v1/user`, {
          headers: buildAuthHeaders(session, anonKey),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.msg || "Utilisateur introuvable.");
        }

        const nextSession = {
          ...session,
          user: payload,
        } as Session;
        writeSession(nextSession);

        return {
          data: {
            session: nextSession,
            user: payload,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: { session: null, user: null },
          error: error instanceof Error ? error : new Error("Utilisateur introuvable."),
        };
      }
    },

    async signOut() {
      writeSession(null);
      return { error: null };
    },
  };

  const from = (table: string) => {
    let selectedColumns = "*";
    const filters: Array<{ column: string; value: string | number | boolean }> = [];

    const runSelect = async <T,>(single = false): Promise<QueryResult<T>> => {
      try {
        const session = readSession();
        const params = new URLSearchParams();
        params.set("select", selectedColumns);
        filters.forEach((filter) => {
          params.set(filter.column, `eq.${String(filter.value)}`);
        });

        const response = await fetch(`${url}/rest/v1/${table}?${params.toString()}`, {
          headers: buildRestHeaders(session, anonKey),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message || "Requete impossible.");
        }

        return {
          data: (single ? payload?.[0] ?? null : payload) as T,
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error : new Error("Requete impossible."),
        };
      }
    };

    const builder = {
      select(columns = "*") {
        selectedColumns = columns;
        return builder;
      },
      eq(column: string, value: string | number | boolean) {
        filters.push({ column, value });
        return builder;
      },
      single() {
        return runSelect(true);
      },
      async insert(values: Record<string, unknown> | Array<Record<string, unknown>>) {
        try {
          const session = readSession();
          const response = await fetch(`${url}/rest/v1/${table}`, {
            method: "POST",
            headers: buildRestHeaders(session, anonKey),
            body: JSON.stringify(values),
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload?.message || "Insertion impossible.");
          }

          return { data: payload, error: null };
        } catch (error) {
          return {
            data: null,
            error: error instanceof Error ? error : new Error("Insertion impossible."),
          };
        }
      },
    };

    return builder;
  };

  return {
    auth,
    from,
  };
}
