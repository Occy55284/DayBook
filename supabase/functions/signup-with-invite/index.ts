// Supabase Edge Function: join Daybook with an invite code.
// Deployed with "verify JWT" OFF, because people calling it aren't signed in yet.
// It uses the project's service key (supplied automatically by Supabase) to create the account.
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleSignup, type InviteStore } from "./handler.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const store: InviteStore = {
  async recentFailures(sinceIso) {
    const { count, error } = await admin
      .from("invite_attempts")
      .select("id", { count: "exact", head: true })
      .gte("at", sinceIso);
    if (error) throw error;
    return count ?? 0;
  },
  async recordFailure() {
    await admin.from("invite_attempts").insert({});
  },
  async claimInvite(code, nowIso) {
    // One UPDATE does the check and the claim together, so two people can never use the same code.
    const { data, error } = await admin
      .from("invites")
      .update({ used_at: nowIso })
      .eq("code", code)
      .is("used_at", null)
      .is("revoked_at", null)
      .gt("expires_at", nowIso)
      .select("id");
    if (error) throw error;
    return data && data.length === 1 ? (data[0].id as string) : null;
  },
  async releaseInvite(id) {
    await admin.from("invites").update({ used_at: null }).eq("id", id).is("used_by", null);
  },
  async markInviteUsed(id, userId) {
    await admin.from("invites").update({ used_by: userId }).eq("id", id);
  },
  async createUser(email, password) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) {
      const code = (error as { code?: string } | null)?.code ?? "";
      const message = error?.message ?? "Could not create the account.";
      if (code === "email_exists" || /already.*(registered|exists)/i.test(message)) return { error: "exists", message };
      if (code === "weak_password") return { error: "weak_password", message };
      return { error: "other", message };
    }
    return { userId: data.user.id };
  },
};

Deno.serve((req) => handleSignup(req, store));
