// Supabase Edge Function: delete your own Daybook account.
// Deployed with "verify JWT" OFF because the function does its own, stricter check:
// it looks up the real signed-in person from their login token (the public anon key would not pass).
// Deleting the account removes all their trades, commissions and settings (the database cascades).
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleDelete, type DeleteStore } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const store: DeleteStore = {
  async getUser(token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email };
  },
  async verifyPassword(email, password) {
    // A throwaway client, so this check never touches anyone's real session.
    const checker = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await checker.auth.signInWithPassword({ email, password });
    return !error;
  },
  async isOnlyAdmin(userId) {
    const { data, error } = await admin.from("app_admins").select("user_id");
    if (error) throw error;
    return (data ?? []).length === 1 && data![0].user_id === userId;
  },
  async deleteUser(userId) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    return !error;
  },
};

Deno.serve((req) => handleDelete(req, store));
