/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — catch-all handler for all /api/* routes.
 * Imports the pre-bundled Express app from ./_app.cjs (built by esbuild
 * during vercel build) and delegates to it.
 *
 * Environment variables required (server-side only, NEVER exposed to browser):
 *   SUPABASE_URL             — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service_role key (bypasses RLS)
 *
 * Routing: vercel.json rewrites ALL /api/* to this file.
 * The x-matched-path header (set by Vercel rewrites) carries the original
 * request path so Express can route correctly.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

/**
 * Create the Express app. On Vercel, we re-create on every request to ensure
 * fresh data from Supabase (no stale cached state across warm starts).
 */
async function ensureInit() {
  if (app) return;

  try {
    const { createApp } = await import('./_app.cjs');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      console.log('[Vercel] Supabase service_role client initialized.');
    } else {
      console.warn('[Vercel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — running without cloud persistence.');
    }

    app = await createApp(supabaseAdmin);
    console.log('[Vercel] Express app initialized with all ERP routes.');
  } catch (err: any) {
    console.error('[Vercel] FATAL: Failed to initialize Express app:', err?.message || String(err));
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight — no imports needed
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-operator-name,x-operator-role,x-operator-username,x-employee-id,x-security-pin');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // Restore original request path from Vercel rewrite.
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  if (matchedPath && matchedPath !== req.url) {
    req.url = matchedPath;
  }

  // Vercel warm-start: always re-init to load fresh data from Supabase.
  // This ensures mutations (loans, leaves, etc.) from other instances are visible.
  app = undefined;
  try {
    await ensureInit();
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || String(err),
    });
  }

  // Temporary diagnostic: test Supabase + network connectivity
  if (req.url === '/api/__debug/supabase-prod') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const urlLen = supabaseUrl?.length || 0;
    const keyLen = supabaseKey?.length || 0;
    const keyPrefix = supabaseKey ? supabaseKey.substring(0, 4) : 'NONE';
    
    let queryResult: any = null;
    let fetchTestResult: any = null;
    
    // Test 1: raw fetch to Supabase REST endpoint
    if (supabaseUrl) {
      try {
        const testUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey || ''}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const fetchRes = await fetch(testUrl, {
          method: 'GET',
          headers: { 'apikey': supabaseKey || '' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        fetchTestResult = { status: fetchRes.status, ok: fetchRes.ok };
      } catch (e: any) {
        fetchTestResult = { error: e.message, name: e.name, cause: e.cause?.message };
      }
    }
    
    // Test 2: Supabase client query
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const testClient = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await testClient
          .from('vetan_erp_store')
          .select('id')
          .limit(5);
        queryResult = {
          error: error ? { message: error.message, code: error.code } : null,
          rowCount: data?.length || 0,
          ids: data?.map((r: any) => r.id) || [],
        };
      } catch (e: any) {
        queryResult = { exception: e.message, cause: e.cause?.message };
      }
    }
    
    return res.status(200).json({
      envVarsPresent: { url: urlLen > 0, key: keyLen > 0 },
      urlLength: urlLen,
      keyPrefix,
      keyLength: keyLen,
      fetchTest: fetchTestResult,
      queryResult,
    });
  }

  // Set CORS response headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Delegate to Express
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
