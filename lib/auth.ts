import { supabase } from "./supabase";

// Join with an invite code, then sign in. Returns a message to show if something went wrong, or null on success.
export async function joinWithInvite(input: { code: string; email: string; password: string }): Promise<string | null> {
  const { error } = await supabase.functions.invoke("signup-with-invite", { body: input });
  if (error) {
    // The function explains what was wrong (bad code, email already used ...) in its reply.
    const response = (error as { context?: Response }).context;
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
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  return signInError ? "Your account is ready, but signing in failed. Go back and sign in with your email and password." : null;
}
