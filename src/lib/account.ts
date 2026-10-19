import { useCallback, useSyncExternalStore } from "react";
import { getSupabase } from "@/lib/supabaseBrowser";
import { getAccountInfo } from "@/lib/api/getAccountInfo";

export type AccountStatus = "loading" | "signed-in" | "signed-out";

export interface Account {
  status: AccountStatus;
  email?: string;
  /** Verified by the server (ADMIN_EMAILS). Only decides what is shown; every privileged call is checked again server-side. */
  isAdmin: boolean;
  /** Sends a one-time sign-in link. Rejects with a user-readable message. */
  requestLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface State {
  status: AccountStatus;
  email?: string;
  isAdmin: boolean;
}

// One shared store, so the header, the saved-reports section and the page all read the same session and the
// account info is fetched once per session change. The access token is never kept here: `getAccessToken` reads
// it from the Supabase client at the moment a server call needs it.
const SERVER_STATE: State = { status: "loading", isAdmin: false };
let state: State = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

async function applySession(session: { access_token: string; user?: { email?: string | null } } | null) {
  if (!session) {
    setState({ status: "signed-out", isAdmin: false });
    return;
  }
  // Show the account at once; the server then confirms the email and the admin flag.
  setState({ status: "signed-in", email: session.user?.email ?? undefined, isAdmin: false });
  try {
    const info = await getAccountInfo({ data: { accessToken: session.access_token } });
    setState({ status: "signed-in", email: info.email, isAdmin: info.isAdmin });
  } catch {
    // Not fatal: the account is shown, admin features stay hidden.
  }
}

function cleanUrlAfterSignIn() {
  const url = new URL(window.location.href);
  const hadParam = url.searchParams.has("signed_in");
  const hadHash = /access_token|refresh_token|error_description/.test(window.location.hash);
  if (!hadParam && !hadHash) return;
  url.searchParams.delete("signed_in");
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  setTimeout(() => document.getElementById("my-reports")?.scrollIntoView({ block: "start" }), 150);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const supabase = getSupabase();
  supabase.auth.onAuthStateChange((event, session) => {
    // Never call Supabase or await inside this callback; defer.
    setTimeout(() => {
      void applySession(session);
      if (event === "SIGNED_IN") cleanUrlAfterSignIn();
    }, 0);
  });
  void supabase.auth.getSession().then(({ data }) => {
    void applySession(data.session);
    cleanUrlAfterSignIn();
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current access token (refreshed by the client when needed), or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

const RATE_LIMIT_MESSAGE = "Please wait a minute before requesting another link.";

export function useAccount(): Account {
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);

  const requestLink = useCallback(async (email: string) => {
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/?signed_in=1`, shouldCreateUser: true },
    });
    if (error) {
      const limited = error.status === 429 || /rate|seconds|too many/i.test(error.message);
      throw new Error(limited ? RATE_LIMIT_MESSAGE : "Could not send the link. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut(); // local history stays
  }, []);

  return { status: current.status, email: current.email, isAdmin: current.isAdmin, requestLink, signOut };
}
