/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — catch-all handler for all /api/* routes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;
let dbRef: any = null;

async function ensureInit() {
  if (app) {
    try {
      if (dbRef && typeof dbRef.reloadFromSupabase === 'function') {
        await dbRef.reloadFromSupabase();
      }
    } catch (e: any) {
      console.error('[Vercel] reloadFromSupabase failed:', e?.message);
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
      supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      console.log('[Vercel] Supabase service_role client initialized.');
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

  try {
    await ensureInit();
  } catch (err: any) {
    return res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || String(err),
    });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

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
