import type { User } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "./client";
import { createClient as createServerClient } from "./server";

export async function getUserServer(): Promise<User | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user ?? null;
}

export async function getSessionServer() {
  const supabase = createServerClient();
  return supabase.auth.getSession();
}

export async function getSessionClient() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}
