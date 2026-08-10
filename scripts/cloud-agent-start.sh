#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Materialize Vite env from Cloud Agent secret when present.
if [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  if [[ ! -f .env.local ]] || ! grep -q '^VITE_SUPABASE_ANON_KEY=' .env.local 2>/dev/null; then
    printf 'VITE_SUPABASE_ANON_KEY=%s\n' "$VITE_SUPABASE_ANON_KEY" > .env.local
  fi
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
