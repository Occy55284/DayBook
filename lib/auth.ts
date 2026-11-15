import { supabase } from "./supabase";
import { LEGAL_VERSION } from "./legal";

// When one of our server functions says no, it explains why in its reply (bad code, wrong password ...).
// This pulls that explanation out, or gives a general message if the server couldn't be reached.
export async function explainFunctionError(error: unknown): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response && typeof response.json === "function") {
    try {
      const body = await response.json();
      if (body && typeof body.error === "string") return body.error;
    } catch {
      /* fall through to the general message */
    }
  }
  return "Couldn't reach the server. Check your connection and try again.";
}

// Join with an invite code, then sign in. Returns a message to show if something went wrong, or null on success.
export async function joinWithInvite(input: { code: string; email: string; password: string }): Promise<string | null> {
  // The person has ticked the agreement box; we send which version of the Terms they saw so it can be recorded.
  const { error } = await supabase.functions.invoke("signup-with-invite", {
    body: { ...input, acceptedTerms: true, termsVersion: LEGAL_VERSION },
  });
  if (error) return explainFunctionError(error);
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  return signInError ? "Your account is ready, but signing in failed. Go back and sign in with your email and password." : null;
}

// Permanently delete your own account and everything in it. Needs your password and the word DELETE.
// Returns a message to show if it didn't work, or null once it's done (and you've been signed out).
export async function deleteMyAccount(password: string): Promise<string | null> {
  const { error } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE", password } });
  if (error) return explainFunctionError(error);
  // The account is gone, so just clear this device's copy of the login (no need to tell the server).
  await supabase.auth.signOut({ scope: "local" });
  return null;
}
