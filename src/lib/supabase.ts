import { createClient } from '@supabase/supabase-js';

/**
 * Project URL is public (not a secret). Hardcoded so a stuck/wrong
 * Vercel env var like https://aBcDe.supabase.co cannot break production.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wffkgzzrninmcbtqbdcf.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_ANON_KEY. Add the Supabase Publishable key in Vercel → Settings → Environment Variables.'
  );
}

if (!SUPABASE_URL || SUPABASE_URL.includes('undefined')) {
  console.error(
    'Missing VITE_SUPABASE_URL or invalid. Add Supabase project URL in Vercel → Settings → Environment Variables.'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  supabaseAnonKey || 'placeholder-anon-key'
);
