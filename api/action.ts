/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless Function — action handler for revision edit/delete
 * and payroll unlock. Separate from the main catch-all to avoid
 * Vercel function caching issues with api/index.ts.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let dbRef: any = null;

async function ensureDb() {
  if (dbRef) return;
  const { getAppDb } = await import('./_app.cjs');
  dbRef = typeof getAppDb === 'function' ? getAppDb() : null;
}

async function readBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req as any) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureDb();
  } catch (err: any) {
    return res.status(500).json({ error: 'Database init failed: ' + err.message });
  }

  const body = await readBody(req);
  const { action } = body || {};

  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  try {
    switch (action) {
      case 'delete_revision': {
        if (!body.id) return res.status(400).json({ error: 'id required' });
        if (!dbRef || typeof dbRef.deleteSalaryRevision !== 'function') {
          return res.status(500).json({ error: 'deleteSalaryRevision not available' });
        }
        dbRef.deleteSalaryRevision(body.id);
        return res.json({ success: true, action: 'deleted' });
      }

      case 'update_revision': {
        if (!body.id) return res.status(400).json({ error: 'id required' });
        if (!dbRef || typeof dbRef.updateSalaryRevision !== 'function') {
          return res.status(500).json({ error: 'updateSalaryRevision not available' });
        }
        dbRef.updateSalaryRevision(body.id, {
          old_salary: body.old_salary,
          new_salary: body.new_salary,
          effective_date: body.effective_date,
          reason: body.reason,
          remarks: body.remarks,
        });
        return res.json({ success: true, action: 'updated' });
      }

      case 'unlock_payroll': {
        if (!body.month) return res.status(400).json({ error: 'month required' });
        if (!dbRef || !dbRef.data || !dbRef.data.payroll_runs) {
          return res.status(500).json({ error: 'payroll data not available' });
        }
        const { month, company } = body;
        const suffix = company && company !== 'ALL' ? `-${company}` : '';
        const run = dbRef.data.payroll_runs.find(
          (r: any) => r.month === month && r.id === `RUN-${month}${suffix}`
        );
        if (!run) return res.status(404).json({ error: 'Payroll run not found' });
        run.status = 'DRAFT';
        if (dbRef.dbSqlite) {
          dbRef.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
        }
        if (typeof dbRef.persistData === 'function') dbRef.persistData();
        return res.json({ success: true, action: 'unlocked' });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
