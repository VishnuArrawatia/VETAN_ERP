/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — catch-all handler for all /api/* routes.
 * Uses dynamic imports so module-level crashes surface as JSON errors
 * instead of opaque FUNCTION_INVOCATION_FAILED.
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
let initError: string | null = null;

async function ensureApp(): Promise<any> {
  if (app) return app;
  if (initError) throw new Error(initError);

  try {
    // Dynamic imports so module-level crashes are caught here
    const { createClient } = await import('@supabase/supabase-js');
    const { createApp } = await import('../server/app');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      console.log('[Vercel] Supabase service_role client initialized.');
    } else {
      console.warn('[Vercel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — running without cloud persistence.');
    }

    app = await createApp(supabaseAdmin);
    console.log('[Vercel] Express app initialized with all ERP routes.');
    return app;
  } catch (err: any) {
    const msg = err?.message || String(err);
    const stack = err?.stack || '';
    initError = msg;
    console.error('[Vercel] FATAL: Failed to initialize Express app:', msg, stack);
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Handle CORS preflight — this must work WITHOUT importing Express
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-operator-name,x-operator-role,x-operator-username,x-employee-id,x-security-pin');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  try {
    // Restore original request path from Vercel rewrite.
    const matchedPath = req.headers['x-matched-path'] as string | undefined;
    if (matchedPath && matchedPath !== req.url) {
      req.url = matchedPath;
    }

    const expressApp = await ensureApp();
    return expressApp(req, res);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('[Vercel] Handler error:', msg);
    return res.status(500).json({
      error: 'Server initialization failed',
      message: msg,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
