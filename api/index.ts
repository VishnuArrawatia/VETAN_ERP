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

/** Ensure the Express app and Supabase client are initialized. */
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

  // Initialize Express app once (cold start), reuse across warm invocations
  try {
    await ensureInit();
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || String(err),
    });
  }

  // Temporary diagnostic: test Supabase connection directly
  if (req.url === '/api/__debug/supabase-prod') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const urlLen = supabaseUrl?.length || 0;
    const keyLen = supabaseKey?.length || 0;
    const keyPrefix = supabaseKey ? supabaseKey.substring(0, 4) : 'NONE';
    
    let queryResult: any = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const testClient = createClient(supabaseUrl, supabaseKey);
        const { data, error, count } = await testClient
          .from('vetan_erp_store')
          .select('id, payload', { count: 'exact' })
          .limit(5);
        queryResult = {
          error: error ? { message: error.message, code: error.code } : null,
          rowCount: data?.length || 0,
          ids: data?.map((r: any) => r.id) || [],
          hasPayload: data?.some((r: any) => !!r.payload) || false,
          employeesInPayload: data?.map((r: any) => ({
            id: r.id,
            employeeCount: Array.isArray(r.payload?.employees) ? r.payload.employees.length : 0
          })) || [],
        };
      } catch (e: any) {
        queryResult = { exception: e.message };
      }
    }
    
    return res.status(200).json({
      envVarsPresent: { url: urlLen > 0, key: keyLen > 0 },
      urlLength: urlLen,
      keyPrefix,
      keyLength: keyLen,
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
