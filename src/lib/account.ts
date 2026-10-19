import { useCallback } from "react";

export type AccountStatus = "loading" | "signed-out" | "signed-in";

export interface Account {
  status: AccountStatus;
  email?: string;
  /** Only ever true after the server has verified the account (phase 08). Never trust it for authorization. */
  isAdmin: boolean;
  /** Sends a one-time sign-in link. Rejects with a user-readable message. */
  requestLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// STUB (phase 07). Always signed out, never admin. `requestLink` only waits so the UI can show its
// "link sent" state. Phase 08 replaces this hook with the real Supabase magic-link account.
export function useAccount(): Account {
  const requestLink = useCallback(async (_email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }, []);
  const signOut = useCallback(async () => {}, []);
  return { status: "signed-out", email: undefined, isAdmin: false, requestLink, signOut };
}
