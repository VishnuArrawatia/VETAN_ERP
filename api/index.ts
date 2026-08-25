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
    // Warm start: reload data from Supabase to ensure mutations from other
    // serverless invocations are visible.
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

  // Parse body manually since bodyParser: false
  let body: any = req.body;
  if (!body && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (raw) body = JSON.parse(raw);
      req.body = body;
    } catch (_) {}
  }

  // Handle salary revision actions before Express routing
  if (req.url === '/api/revisions' && req.method === 'POST' && body) {
    const { action } = body;
    if (action === 'delete_revision' && body.id) {
      try {
        if (dbRef && typeof dbRef.deleteSalaryRevision === 'function') {
          dbRef.deleteSalaryRevision(body.id);
          return res.json({ success: true });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
    if (action === 'update_revision' && body.id) {
      try {
        if (dbRef && typeof dbRef.updateSalaryRevision === 'function') {
          dbRef.updateSalaryRevision(body.id, {
            old_salary: body.old_salary,
            new_salary: body.new_salary,
            effective_date: body.effective_date,
            reason: body.reason,
            remarks: body.remarks
          });
          return res.json({ success: true });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
    // Handle payroll unlock
    if (body.action === 'unlock') {
      try {
        if (dbRef && dbRef.data && dbRef.data.payroll_runs) {
          const { month, company } = body;
          const suffix = company && company !== 'ALL' ? `-${company}` : '';
          const run = dbRef.data.payroll_runs.find((r: any) => r.month === month && r.id === `RUN-${month}${suffix}`);
          if (!run) return res.status(404).json({ error: 'Payroll run not found' });
          run.status = 'DRAFT';
          if (dbRef.dbSqlite) dbRef.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
          if (typeof dbRef.persistData === 'function') dbRef.persistData();
          return res.json({ success: true });
        }
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  // Also handle payroll unlock for /api/payroll-runs/close
  if (req.url === '/api/payroll-runs/close' && req.method === 'POST' && body) {
    const { action, month, company } = body;
    if (action === 'unlock') {
      try {
        if (dbRef && dbRef.data && dbRef.data.payroll_runs) {
          const suffix = company && company !== 'ALL' ? `-${company}` : '';
          const run = dbRef.data.payroll_runs.find((r: any) => r.month === month && r.id === `RUN-${month}${suffix}`);
          if (!run) return res.status(404).json({ error: 'Payroll run not found' });
          run.status = 'DRAFT';
          if (dbRef.dbSqlite) dbRef.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
          if (typeof dbRef.persistData === 'function') dbRef.persistData();
          return res.json({ success: true });
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
    bodyParser: false,
  },
};
// force redeploy Tue Aug 25 19:41:33 IST 2026
