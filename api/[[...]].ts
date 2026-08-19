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

  // Initialize Express app once (cold start), reuse across warm invocations
  if (!app) {
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
