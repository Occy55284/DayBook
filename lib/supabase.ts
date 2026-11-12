import { createClient } from "@supabase/supabase-js";

// These two values are safe to ship in the app: they only identify the project.
// Your data is protected by the login + row-level security rules in the database.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
);
