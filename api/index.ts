/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — catch-all handler for all /api/* routes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;
let dbRef: any = null;

async function ensureInit(httpMethod?: string) {
  if (app) {
    // FIX: Always reload from Supabase to ensure fresh data (loans, attendance, etc.)
    // On GET: always reload for latest data
    // On POST: reload only if critical data seems missing (cold start race fix)
    if (dbRef && typeof dbRef.reloadFromSupabase === 'function') {
      const employeesCount = (dbRef.data?.employees || []).length;
      const loansCount = (dbRef.data?.loans || []).length;
      // Only reload if data is empty (cold start) — NOT on every GET
      // This fixes the 2-3 second cold-start penalty on every request
      const needsReload = loansCount === 0 || employeesCount === 0;
      if (needsReload) {
        try {
          await dbRef.reloadFromSupabase();
          console.log('[Vercel] Reloaded from Supabase — employees:', (dbRef.data?.employees || []).length, 'loans:', (dbRef.data?.loans || []).length);
        } catch (e: any) {
          console.error('[Vercel] reloadFromSupabase failed:', e?.message);
        }
      }
    }
    return;
  }

  try {
    const { createApp, getAppDb } = await import('./_app.cjs');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        // FIX 3: Add connection timeout + retry for serverless resilience
        db: {
          schema: 'public'
        },
        global: {
          fetch: (url: any, options: any) => {
            // Add timeout to prevent hanging serverless functions
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15_000);
            return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
          }
        }
      });
      const urlHost = new URL(supabaseUrl).hostname;
      console.log(`[Vercel] Supabase client initialized (host: ${urlHost}).`);
    } else {
      console.warn('[Vercel] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — running without cloud persistence.');
    }

    app = await createApp(supabaseAdmin);
    dbRef = typeof getAppDb === 'function' ? getAppDb() : null;
    console.log('[Vercel] Express app initialized with all ERP routes.');
  } catch (err: any) {
    console.error('[Vercel] FATAL: Failed to initialize Express app:', err?.message || String(err));
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-operator-name,x-operator-role,x-operator-username,x-employee-id,x-security-pin');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  if (matchedPath && matchedPath !== req.url) {
    req.url = matchedPath;
  }

  // Health check — keep-warm cron target (no DB needed)
  if (req.url === '/api/health' || req.url === '/health') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  try {
    await ensureInit(req.method);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || String(err),
    });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // FIX 1: Disable all caching — force live data from Supabase
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // ── Action interceptors (before Express) ──
  // Vercel may cache api/index.ts with old code. These interceptors
  // handle critical actions before Express routing.
  const body: any = req.body;
  if (req.method === 'POST' && body && typeof body.action === 'string') {

    if (body.action === 'delete_revision' && body.id) {
      try {
        if (dbRef && typeof dbRef.deleteSalaryRevision === 'function') {
          dbRef.deleteSalaryRevision(body.id);
          return res.json({ success: true, action: 'deleted' });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (body.action === 'update_revision' && body.id) {
      try {
        if (dbRef && typeof dbRef.updateSalaryRevision === 'function') {
          dbRef.updateSalaryRevision(body.id, {
            old_salary: body.old_salary,
            new_salary: body.new_salary,
            effective_date: body.effective_date,
            reason: body.reason,
            remarks: body.remarks,
          });
          return res.json({ success: true, action: 'updated' });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (body.action === 'unlock_payroll' && body.month) {
      try {
        if (dbRef && dbRef.data && dbRef.data.payroll_runs) {
          const { month, company } = body;
          const suffix = company && company !== 'ALL' ? `-${company}` : '';
          const run = dbRef.data.payroll_runs.find(
            (r: any) => r.month === month && r.id === `RUN-${month}${suffix}`
          );
          if (!run) return res.status(404).json({ error: 'Payroll run not found' });
          run.status = 'DRAFT';
          if (dbRef.dbSqlite) dbRef.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
          if (typeof dbRef.persistData === 'function') dbRef.persistData();
          if (typeof dbRef.flushPendingWrites === 'function') await dbRef.flushPendingWrites();
          return res.json({ success: true, action: 'unlocked' });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  return app(req, res);
}

export const config = {
  api: {
    bodyParser: true,
  },
};
