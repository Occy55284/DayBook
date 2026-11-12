import { createClient } from "@supabase/supabase-js";

// The project URL and publishable key are meant to be public: they only identify
// the project. Your data is protected by the login + row-level security rules in
// the database, not by hiding these. Environment variables override the defaults.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uhsnchogzczdmqnqoqpa.supabase.co";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4HTQBr862Z4DnYl4iheYig_Bym11r8D";

export const supabase = createClient(URL, KEY);
