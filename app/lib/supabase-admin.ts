import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | undefined;

function getConfig() {
  return {
    url: process.env.SUPABASE_URL?.trim() || "",
    secretKey: process.env.SUPABASE_SECRET_KEY?.trim() || "",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || "",
  };
}

export function isSupabaseConfigured() {
  const config = getConfig();
  return Boolean(config.url && config.secretKey && config.publishableKey);
}

export function getSupabaseAdmin() {
  const config = getConfig();
  if (!config.url || !config.secretKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.");
  }

  adminClient ??= createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return adminClient;
}

export function getSupabaseUploadConfig() {
  const config = getConfig();
  if (!config.url || !config.publishableKey) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY.");
  }
  return { url: config.url, publishableKey: config.publishableKey };
}
