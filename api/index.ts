/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — catch-all handler for all /api/* routes.
 * Imports the shared Express app from server/app.ts and delegates to it.
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
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../server/app';

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-operator-name,x-operator-role,x-operator-username,x-employee-id,x-security-pin');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  // Restore original request path from Vercel rewrite.
  // Vercel rewrites route /api/employee/login → /api/index,
  // but x-matched-path preserves the original path for Express routing.
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  if (matchedPath && matchedPath !== req.url) {
    req.url = matchedPath;
  }

  // Initialize Express app once (cold start), reuse across warm invocations
  if (!app) {
    try {
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
    } catch (err: any) {
      console.error('[Vercel] FATAL: Failed to initialize Express app:', err);
      return res.status(500).json({
        error: 'Server initialization failed',
        message: err?.message || String(err),
      });
    }
  }

  // Set CORS response headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Delegate to Express
  return app(req, res);
}

export const config = {
  api: {
    // Disable Vercel's built-in body parser — Express handles it
    bodyParser: false,
  },
};
