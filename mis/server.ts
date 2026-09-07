import express from "express";
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";

const ROOT = path.join(process.cwd(), "mis");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "mis-config.json"), "utf-8"));
const DATA_DIR = CFG.dataDir || path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "mis-store.json");
const MAP_PATH = path.join(DATA_DIR, "ledger-map.json");
const PORT = CFG.port || 3001;

type Row = Record<string, any>;
let store: any = null;

function loadStore() {
  store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  store.stock = store.stock || [];
  store.loans = store.loans || [];
  store.payments = store.payments || [];
  store.stock = store.stock || [];
  store.loans = store.loans || [];
  store.payments = store.payments || [];
  store.budget = store.budget || [];
  console.log(`[MIS] store: ${store.meta.counts.sales} sales, ${store.meta.counts.tb} TB, ${store.stock.length} stock, ${store.loans.length} loans, ${store.payments.length} payments, ${store.budget.length} budget`);
}
loadStore();

function saveMap() {
  fs.writeFileSync(MAP_PATH, JSON.stringify({ mappings: store.ledgerMap }, null, 2));
}
function saveStore() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store));
}

const app = express();
app.use(express.json({ limit: "20mb" }));

// ---------- helpers ----------
function months(): string[] {
  const set = new Set<string>();
  for (const r of store.sales) set.add(r.month);
  return [...set].sort();
}
// month "2026-04" → "FY-2026-27" (Apr start) — sales/rejection rows me fy field nahi hai, month se derive
function fyOf(ym: string): string {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  const startYear = m >= (CFG.fiscalYearStartMonth || 4) ? y : y - 1;
  return `FY-${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
function salesRows(fy: string, entity: string): Row[] {
  let rows = store.sales as Row[];
  if (fy && fy !== "ALL") rows = rows.filter((r) => fyOf(r.month) === fy);
  if (entity && entity !== "ALL") rows = rows.filter((r) => r.entity === entity);
  return rows;
}
function rejectionRows(fy: string, entity: string): Row[] {
  let rows = store.rejections as Row[];
  if (fy && fy !== "ALL") rows = rows.filter((r) => fyOf(r.month) === fy);
  if (entity && entity !== "ALL") rows = rows.filter((r) => r.entity === entity);
  return rows;
}
// NEW PL STATEMENT = user ki official monthly sales (New PL sheet se loaded).
// register sirf invoice-level detail (kabhi kabhi adhoora: IWSR me Jul-Aug missing tha).
function stmtRows(fy: string, entity: string): Row[] {
  let rows = store.stmtPL as Row[];
  if (!rows) rows = [];
  if (fy && fy !== "ALL") rows = rows.filter((r) => r.fy === fy);
  if (entity && entity !== "ALL") rows = rows.filter((r) => r.entity === entity);
  return rows;
}
// month "2026-04" se label "2026-04"" return as-is
function stmtMonthlySales(fy: string, entity: string, month = "") {
  const st = stmtRows(fy, entity);
  const reg = salesRows(fy, entity);
  const byMonth = new Map<string, { month: string; stmt: number; register: number; used: number; src: string }>();
  let salesOnly = 0; // statement ka pure 'Sales' row (bina jobwork/inter-co)
  const add = (m: string, v: number, src: "stmt" | "register") => {
    if (!m) return;
    const o = byMonth.get(m) || { month: m, stmt: 0, register: 0, used: 0, src: "" };
    if (src === "stmt") { o.stmt += v; if (!o.src) o.src = "stmt"; }
    else { o.register += v; if (!o.src) o.src = "register"; }
    byMonth.set(m, o);
  };
  // Statement OPERATIONAL REVENUE = PL ka top line (reconciliation-proven: register Apr-Jun
  // isi se <1.5% par match hota hai; pure 'Sales' row me jobwork/inter-co excluded hota hai)
  for (const r of st) {
    add(r.month, Number(r.revenue) || Number(r.sales) || 0, "stmt");
    salesOnly += Number(r.sales) || Number(r.revenue) || 0;
  }
  const regSum = new Map<string, number>();
  for (const r of reg) regSum.set(r.month, (regSum.get(r.month) || 0) + (Number(r.taxable) || 0));
  for (const [m, v] of regSum) add(m, v, "register");
  const list = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  let total = 0, stmtTotal = 0, registerTotal = 0;
  for (const o of list) {
    // statement authoritative jab ho; warna register
    o.used = o.stmt || o.register;
    total += o.used; stmtTotal += o.stmt; registerTotal += o.register;
  }
  if (month && month !== "ALL") {
    const keep = list.filter((o) => o.month === month);
    return { months: keep.map((o) => o.month), byMonth: keep, total: keep.reduce((s, o) => s + o.used, 0), stmtTotal: keep.reduce((s, o) => s + o.stmt, 0), registerTotal: keep.reduce((s, o) => s + o.register, 0), salesOnlyTotal: keep.length ? salesOnly : 0, registerLines: reg.length, stmtMonths: st.length };
  }
  return { months: list.map((o) => o.month), byMonth: list, total, stmtTotal, registerTotal, salesOnlyTotal: salesOnly, registerLines: reg.length, stmtMonths: st.length };
}
function groupSum(rows: Row[], keyFn: (r: Row) => string): Row[] {
  const m = new Map<string, { name: string; qty: number; taxable: number; gst: number; total: number }>();
  for (const r of rows) {
    const k = keyFn(r);
    const cur = m.get(k) || { name: k, qty: 0, taxable: 0, gst: 0, total: 0 };
    cur.qty += Number(r.qty) || 0;
    cur.taxable += Number(r.taxable ?? r.amount) || 0;
    cur.gst += Number(r.gst) || 0;
    cur.total += Number(r.total ?? r.taxable) || 0;
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => b.taxable - a.taxable);
}
function matrix(rows: Row[], keyFn: (r: Row) => string, valueKey = "taxable") {
  const keys = new Set<string>(), mons = new Set<string>();
  for (const r of rows) { keys.add(keyFn(r)); mons.add(r.month); }
  const m = new Map<string, any>();
  for (const k of keys) {
    const o: any = { name: k };
    for (const mo of mons) o[mo] = 0;
    m.set(k, o);
  }
  for (const r of rows) m.get(keyFn(r))![r.month] += Number(r[valueKey] ?? r.amount) || 0;
  const list = [...m.values()];
  for (const o of list) {
    o.total = Object.entries(o).filter(([k]) => k !== "name" && k !== "total").reduce((s, [, v]) => s + (v as number), 0);
  }
  return { months: [...mons].sort(), rows: list.sort((a, b) => b.total - a.total) };
}

// ---------- PL/BS from TB ----------
const MONTH_NAMES = ["April","May","June","July","August","September","October","November","December","January","February","March"];

function tbRows(fy: string, entity: string): Row[] {
  let rows = store.tb as Row[];
  if (fy && fy !== "ALL") rows = rows.filter((r) => r.fy === fy);
  if (entity && entity !== "ALL") rows = rows.filter((r) => r.entity === entity);
  return rows;
}

function statementOf(r: Row): "PL" | "BS" | null {
  if (r.groupPL) return "PL";
  if (r.groupBS) return "BS";
  return null;
}

app.get("/api/mis/years", (_req, res) => {
  res.json({ years: store.meta.tbYears, currentFy: store.meta.tbYears[store.meta.tbYears.length - 1], entities: ["SAKAR", "SVN"] });
});

// Known group names (for mapping dropdown suggestions)
app.get("/api/mis/ledger-groups", (_req, res) => {
  const pl = new Set<string>(), bs = new Set<string>();
  for (const r of store.tb as Row[]) {
    if (r.groupPL) pl.add(r.groupPL);
    if (r.groupBS) bs.add(r.groupBS);
  }
  res.json({ pl: [...pl].sort(), bs: [...bs].sort() });
});

// Unmapped ledgers (naye ledgers jinka group nahi hai)
app.get("/api/mis/unmapped", (req, res) => {
  const { fy = "ALL", entity = "ALL", search = "" } = req.query as any;
  let rows = tbRows(fy, entity).filter((r) => !statementOf(r));
  if (search) {
    const s = String(search).toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s));
  }
  const seen = new Set<string>();
  const uniq = rows.filter((r) => {
    const k = `${r.entity}|${r.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  res.json({ ledgers: uniq.slice(0, 500), count: rows.length });
});

// Map a ledger to PL/BS group (user mapping - saved in F:/Financial Report/ledger-map.json)
app.post("/api/mis/map-ledger", (req, res) => {
  const { entity, ledger, statement, group } = req.body;
  if (!ledger || !statement || !group) return res.status(400).json({ error: "ledger, statement, group required" });
  if (!["PL", "BS"].includes(statement)) return res.status(400).json({ error: "statement must be PL or BS" });

  // update mapping file
  let maps = store.ledgerMap || [];
  maps = maps.filter((m: any) => !(m.ledger === ledger && (!entity || m.entity === entity)));
  maps.push({ entity: entity || "ALL", ledger, statement, group, mappedAt: new Date().toISOString() });
  store.ledgerMap = maps;
  saveMap();

  // apply to store in-place (fast - loader re-run ki zaroorat nahi)
  let changed = 0;
  for (const r of store.tb as Row[]) {
    if (r.code === ledger || r.name === ledger) {
      if (!entity || entity === "ALL" || r.entity === entity) {
        if (statement === "PL") { r.groupPL = group; r.groupBS = ""; }
        else { r.groupBS = group; r.groupPL = ""; }
        r.mapped = true; r.mappingSource = "user";
        changed++;
      }
    }
  }
  saveStore();
  res.json({ ok: true, changed, mappings: maps.length });
});

// Manual loan edit: schedule-sheet se aayi rows ko user override/edit kar sake
// ---------- TB REVIEW GATE: upload -> validate -> user OK -> accept ----------
function saveReview() {
  fs.writeFileSync(path.join(DATA_DIR, "tb-review.json"), JSON.stringify({ generatedAt: new Date().toISOString(), issues: store.tbReview || [] }, null, 2));
}

app.get("/api/mis/tb-review", (_req, res) => {
  const issues = store.tbReview || [];
  res.json({
    generatedAt: store.meta.generatedAt,
    accepted: store.tbReviewAccepted || "",
    counts: {
      total: issues.length,
      open: issues.filter((i: any) => i.status === "open").length,
      ok: issues.filter((i: any) => i.status === "ok").length,
      errors: issues.filter((i: any) => i.severity === "error" && i.status === "open").length,
      warnings: issues.filter((i: any) => i.severity === "warning" && i.status === "open").length,
      infos: issues.filter((i: any) => i.severity === "info" && i.status === "open").length,
    },
    issues,
  });
});

app.post("/api/mis/tb-review/ok", (req, res) => {
  const { id, note } = req.body;
  const iss = (store.tbReview || []).find((i: any) => i.id === id);
  if (!iss) return res.status(404).json({ error: "issue not found" });
  iss.status = "ok";
  if (note) iss.note = note;
  iss.okAt = new Date().toISOString();
  saveStore(); saveReview();
  res.json({ ok: true, id });
});

app.post("/api/mis/tb-review/reopen", (_req, res) => {
  for (const i of store.tbReview || []) { i.status = "open"; i.note = ""; }
  store.tbReviewAccepted = "";
  saveStore(); saveReview();
  res.json({ ok: true });
});

app.post("/api/mis/tb-review/accept", (req, res) => {
  const open = (store.tbReview || []).filter((i: any) => i.status === "open");
  for (const i of open) i.status = "accepted";
  store.tbReviewAccepted = new Date().toISOString();
  saveStore(); saveReview();
  res.json({ ok: true, acceptedAt: store.tbReviewAccepted, forceAccepted: open.length });
});

app.post("/api/mis/tb-review/ai", async (req, res) => {
  const { ids } = req.body || {};
  const aiCfg = (CFG as any).ai?.gemini || {};
  const issues = (store.tbReview || []).filter((i: any) => !ids?.length || ids.includes(i.id));
  const target = issues.filter((i: any) => i.status === "open").slice(0, 12);
  if (!target.length) return res.json({ explanations: [], engine: "none", note: "koi open issue nahi" });
  if (!aiCfg.apiKey) {
    const RULES: Record<string, string> = {
      "Trial-Balance": "TB balanced nahi hai = kisi month me total debit ≠ credit. Ya SAP dump incomplete hai (kuch ledgers cut gaye), ya Total-row galti se data me aa gayi, ya kisi ledger ka sign galat hai. Check: dump me ledgers-count match karo aur sheet me koi TOTAL row to data range me nahi hai.",
      "Opening-Change": "Opening balance pichhli load se badla hai — ya to prior-period adjustment hui (audit/depreciation re-post), ya galti se ledger replace hua. Adjustment intentional hai to OK, warna SAP me opening verify karo.",
      "Total-Change": "FY-total pichhli load se badla. Naye months aane par normal hai; same months me farak aaya to posting revise hui. Explain ho sakta hai to OK.",
      "Spike": "Is month me amount achanak bahut bada hai — annual payment (insurance/bonus/audit-fee), one-time purchase, ya duplicate posting ho sakta hai. Voucher-register me us month ki entries dekho; genuine one-time ho to OK.",
      "Unmapped": "Ye ledger kisi PL/BS group me nahi — PL/BS reports me amount judega hi nahi aur networth/net-profit galat dikhega. Ledger Mapping tab me group set karo (ya OK karke baad me map karo).",
      "Future-Month": "Future month me data hai — posting period galti hai. SAP me document/posting date check karo.",
      "Sum-Mismatch": "OB + months ka jod sheet-Total se nahi milta — sheet me formula stale hai (recalc karo), ya kisi month ka column skip/galat range me hai.",
      "New-Ledger": "Naya ledger TB me aaya. Ledger Mapping me uska PL/BS group set karo, phir OK.",
    };
    return res.json({ explanations: target.map((i: any) => ({ id: i.id, explanation: RULES[i.check] || "Detail check karo." })), engine: "offline-rules" });
  }
  try {
    const prompt = `Tum ek senior Indian chartered accountant ho jo manufacturing-company ka MIS review karta hai. Niche TB-review ke issues hain (Indian accounting, FY April se start). Har issue ke liye 2-3 line ka simple explanation do HINGLISH me (roman Hindi + English accounting words): (1) issue kya batata hai, (2) SAP me kya check karein, (3) kab OK karna safe hai. Return STRICT JSON array only: [{"id": number, "explanation": string}]. Issues: ${JSON.stringify(target.map((i: any) => ({ id: i.id, check: i.check, severity: i.severity, entity: i.entity, ledger: i.ledger, detail: i.detail })))}`;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiCfg.model || "gemini-2.0-flash"}:generateContent?key=${aiCfg.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }),
    });
    const j: any = await r.json();
    const text: string = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const m = /\[[\s\S]*\]/.exec(text);
    res.json({ explanations: m ? JSON.parse(m[0]) : [], engine: "gemini" });
  } catch (e: any) {
    res.status(502).json({ error: "Gemini call failed: " + e.message });
  }
});

app.post("/api/mis/loan-edit", (req, res) => {
  const { company, fy, month, loanName, principal, interest } = req.body;
  if (!loanName || !month) return res.status(400).json({ error: "loanName, month required" });
  const lc = (store.loans || []).filter((l: Row) =>
    (!company || l.company === company) && (!fy || l.fy === fy) &&
    String(l.month).toLowerCase() === String(month).toLowerCase() &&
    (l.loanName === loanName || l.loanName.includes(loanName)));
  if (!lc.length) return res.status(404).json({ error: "loan row not found" });
  for (const l of lc) {
    if (principal != null) l.principal = Number(principal) || 0;
    if (interest != null) l.interest = Number(interest) || 0;
    l.manualEdit = true;
    l.editedAt = new Date().toISOString();
  }
  saveStore();
  res.json({ ok: true, changed: lc.length });
});

// Manual loan ADD (naya loan jo sheet me nahi hai)
app.post("/api/mis/loan-add", (req, res) => {
  const { company, fy, month, loanName, lender, principal, interest, closingBalance } = req.body;
  if (!company || !loanName || !month) return res.status(400).json({ error: "company, loanName, month required" });
  store.loans = store.loans || [];
  store.loans.push({
    srcFile: "manual", company: String(company).toUpperCase(), fy: fy || "", month,
    loanName, lender: lender || "", openingBalance: 0,
    principal: Number(principal) || 0, interest: Number(interest) || 0,
    closingBalance: Number(closingBalance) || 0, manual: true,
    addedAt: new Date().toISOString(),
  });
  saveStore();
  res.json({ ok: true, count: store.loans.length });
});

// Manual loan DELETE (galat row hatani ho)
app.post("/api/mis/loan-delete", (req, res) => {
  const { company, fy, month, loanName } = req.body;
  const before = (store.loans || []).length;
  store.loans = (store.loans || []).filter((l: Row) =>
    !(l.srcFile === "manual" &&
      (!company || l.company === String(company).toUpperCase()) &&
      (!fy || l.fy === fy) &&
      (!month || String(l.month).toLowerCase() === String(month).toLowerCase()) &&
      (!loanName || l.loanName.includes(loanName))));
  saveStore();
  res.json({ ok: true, removed: before - store.loans.length });
});

// Remove user mapping (wapas TB-column par jao)
app.post("/api/mis/unmap-ledger", (req, res) => {
  const { entity, ledger } = req.body;
  store.ledgerMap = (store.ledgerMap || []).filter((m: any) => !(m.ledger === ledger && (!entity || m.entity === entity)));
  saveMap();
  let changed = 0;
  for (const r of store.tb as Row[]) {
    if ((r.code === ledger || r.name === ledger) && (!entity || entity === "ALL" || r.entity === entity)) {
      r.groupPL = r.tbGroupPL || "";
      r.groupBS = r.tbGroupBS || "";
      r.mapped = false; r.mappingSource = "tb-column";
      changed++;
    }
  }
  saveStore();
  res.json({ ok: true, changed });
});

// PL & BS statement with month columns (OB + Apr..Mar + Total)
app.get("/api/mis/plbs", (req, res) => {
  const { fy = "ALL", entity = "ALL", statement = "PL" } = req.query as any;
  const rows = tbRows(fy, entity).filter((r) => statementOf(r) === statement);
  const groups = new Map<string, any>();
  for (const r of rows) {
    const g = statement === "PL" ? r.groupPL : r.groupBS;
    if (!g) continue;
    if (!groups.has(g)) {
      const o: any = { group: g, ob: 0, total: 0, ledgers: [] };
      for (const mn of MONTH_NAMES) o[mn] = 0;
      groups.set(g, o);
    }
    const G = groups.get(g);
    G.ob += Number(r.ob) || 0;
    G.total += Number(r.total) || 0;
    for (const mn of MONTH_NAMES) G[mn] += Number(r.monthly?.[mn]) || 0;
  }
  for (const G of groups.values()) {
    // ledger breakup per group (drill data)
    G.ledgers = rows
      .filter((r) => (statement === "PL" ? r.groupPL : r.groupBS) === G.group)
      .map((r: any) => ({
        code: r.code, name: r.name, entity: r.entity, ob: r.ob, monthly: r.monthly, total: r.total,
        source: r.mappingSource,
      }))
      .sort((a: any, b: any) => Math.abs(b.total) - Math.abs(a.total));
  }
  const list = [...groups.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const grand = list.reduce((s, g) => ({ ob: s.ob + g.ob, total: s.total + g.total }), { ob: 0, total: 0 });
  res.json({ statement, groups: list, grand, months: MONTH_NAMES });
});

// ---------- sales/other v1 APIs ----------
app.get("/api/mis/summary", (_req, res) => {
  res.json({
    meta: store.meta,
    months: months(),
    entities: [...new Set(store.sales.map((r: Row) => r.entity))],
  });
});

// STATEMENT-BASED sales summary — official monthly figure (New PL sheet) per FY/entity/month.
// register ka invoice-line data sirf detail ke liye (fallback jab statement month nahi hai).
app.get("/api/mis/sales-summary", (req, res) => {
  const { entity, fy = "ALL", month = "" } = req.query as any;
  res.json({ fy, entity, month: month || "ALL", ...stmtMonthlySales(fy, entity, month) });
});

app.get("/api/mis/sales", (req, res) => {
  const { entity, fy = "ALL", month, groupBy = "item", search = "" } = req.query as any;
  let rows = salesRows(fy, entity);
  if (month && month !== "ALL") rows = rows.filter((r) => r.month === month);
  if (search) {
    const s = String(search).toLowerCase();
    rows = rows.filter((r) => (groupBy === "customer" ? r.customerName : r.itemDesc).toLowerCase().includes(s));
  }
  const keyFn = groupBy === "customer"
    ? (r: Row) => `${r.customerCode} - ${r.customerName}`
    : (r: Row) => `${r.itemNo} - ${r.itemDesc}`;
  res.json({ groups: groupSum(rows, keyFn), count: rows.length });
});

app.get("/api/mis/matrix", (req, res) => {
  const { entity, fy = "ALL", by = "item", category = "", byValue = "taxable" } = req.query as any;
  let rows = salesRows(fy, entity);
  if (category) rows = rows.filter((r) => r.itemCategory === category);
  const keyFn = by === "customer" ? (r: Row) => `${r.customerCode} - ${r.customerName}` : (r: Row) => r.itemGroup || r.itemDesc;
  const vKey = byValue === "qty" ? "qty" : byValue === "amount" ? "taxable" : byValue;
  res.json(matrix(rows, keyFn, vKey));
});

app.get("/api/mis/fg-analysis", (req, res) => {
  const { entity, fy = "ALL" } = req.query as any;
  const rows = salesRows(fy, entity);
  const fg = rows.filter((r) => (CFG.fgCategories as string[]).includes(r.itemCategory));
  res.json(matrix(fg, (r: Row) => r.itemGroup || "Other"));
});

app.get("/api/mis/rejections", (req, res) => {
  const { entity, fy = "ALL", by = "party" } = req.query as any;
  const rows = rejectionRows(fy, entity);
  // FY filter purchases bhi (month se) — channel-2 purchase-memos same FY ka
  let purch = store.purchases as Row[];
  if (fy && fy !== "ALL") purch = purch.filter((p) => fyOf(p.month) === fy);
  if (entity && entity !== "ALL") purch = purch.filter((p) => p.entity === entity);
  const keyFn = by === "reason" ? (r: Row) => r.reason || "Unknown" : (r: Row) => `${r.partyCode || r.vendorCode || "?"} - ${r.partyName}`;
  // FG-purchase ledger me PD(GRPO)=normal inward bhi hota hai - sirf credit-memo/PC = rejection
  const merged = [...rows, ...purch.filter((p: Row) => (p.partyCode || p.vendorCode) && p.docType !== "grpo")];
  const grouped = groupSum(merged, keyFn);
  res.json({ groups: grouped, byChannel: {
    "credit-note": merged.filter((r: Row) => r.channel === "credit-note").reduce((s: number, r: Row) => s + r.amount, 0),
    "purchase-invoice": merged.filter((r: Row) => r.channel === "purchase-invoice").reduce((s: number, r: Row) => s + r.amount, 0),
  }, count: merged.length });
});

// ---------- STOCK: opening/production/sold/closing + dead-stock classification ----------
const MONTH_IDX: Record<string, number> = { "Apr": 0, "April": 0, "May": 1, "Jun": 2, "June": 2, "Jul": 3, "July": 3, "Aug": 4, "August": 4, "Sep": 5, "Sept": 5, "September": 5, "Oct": 6, "October": 6, "Nov": 7, "November": 7, "Dec": 8, "December": 8, "Jan": 9, "January": 9, "Feb": 10, "February": 10, "Mar": 11, "March": 11 };
function monthIdx(m: string): number { return MONTH_IDX[String(m || "").trim()] ?? MONTH_IDX[String(m || "").trim().toLowerCase().replace(/^\w/, c => c.toUpperCase())] ?? -1; }

app.get("/api/mis/stock", (req, res) => {
  const { company = "ALL", fy = "ALL", upto = "" } = req.query as any;
  const rules = CFG.deadStockRules || { deadMonths: 12, nonMovingMonths: 6 };
  let rows = store.stock as Row[];
  if (company !== "ALL") rows = rows.filter((r) => r.company === company);
  if (fy !== "ALL") rows = rows.filter((r) => r.fy === fy);
  if (upto) rows = rows.filter((r) => monthIdx(r.month) <= monthIdx(upto));

  // Latest cumulative position per item (closing = latest month ka total, multi-warehouse rows sum)
  let minMiAll = 99, maxMiAllG = -1;
  for (const r of rows) { const mi = monthIdx(r.month); if (mi > maxMiAllG) maxMiAllG = mi; if (mi >= 0 && mi < minMiAll) minMiAll = mi; }
  const byItem = new Map<string, any>();
  for (const r of rows) {
    const k = `${r.company}|${r.itemNo}`;
    if (!byItem.has(k)) {
      byItem.set(k, {
        company: r.company, itemNo: r.itemNo, itemDesc: r.itemDesc, itemGroup: r.itemGroup,
        openingQty: 0, producedQty: 0, soldQty: 0, closingQty: 0, closingValue: 0,
        lastSaleMonth: "", lastSaleDate: "", monthsSinceSale: 999,
        deadWhQty: 0, nonMovingWhQty: 0, monthAcc: {} as Record<number, any>, maxMi: -1,
        isSap: false,
      });
    }
    const o = byItem.get(k);
    const miRaw = monthIdx(r.month);
    if (miRaw === minMiAll) o.openingQty += Number(r.openingQty) || 0; // opening = sirf PEHLE month ka (warna har month ka opening sum ho jata)
    o.producedQty += Number(r.producedQty) || 0;
    o.soldQty += Number(r.soldQty) || 0;
    if (r.warehouseCode) o.isSap = true;
    const mi = monthIdx(r.month);
    const acc = o.monthAcc[mi] || (o.monthAcc[mi] = { qty: 0, value: 0, dead: 0, nm: 0, lastSale: "" });
    acc.qty += Number(r.closingQty) || 0;
    acc.value += Number(r.closingValue) || 0;
    acc.dead += Number(r.deadWhQty) || 0;
    acc.nm += Number(r.nonMovingWhQty) || 0;
    if (r.lastSaleMonth) acc.lastSale = r.lastSaleMonth;
    if (mi > o.maxMi) o.maxMi = mi;
  }
  const nowM = new Date();
  const items = [...byItem.values()].map((o) => {
    const acc = o.monthAcc[o.maxMi] || { qty: 0, value: 0, dead: 0, nm: 0, lastSale: "" };
    o.closingQty = acc.qty; o.closingValue = acc.value;
    o.deadWhQty = acc.dead; o.nonMovingWhQty = acc.nm;
    if (acc.lastSale) o.lastSaleMonth = acc.lastSale;
    // months since last sale: from lastSaleDate or lastSaleMonth label
    let ms = o.monthsSinceSale;
    try {
      const d = o.lastSaleDate ? new Date(o.lastSaleDate) : (o.lastSaleMonth ? new Date(o.lastSaleMonth + "-01") : null);
      if (d && !isNaN(d.getTime())) ms = Math.floor((nowM.getTime() - d.getTime()) / (30 * 86400000));
    } catch {}
    let status = "Moving";
    let whFlag = "";
    if (o.isSap) {
      // SAP B1: warehouse-name based classification primary (Dead Stock / Non-Moving named WH)
      if (o.soldQty > 0 || o.producedQty > 0) status = "Moving";
      else if (o.closingQty <= 0) status = "Moving"; // koi stock hi nahi
      else if ((o.deadWhQty || 0) >= o.closingQty) { status = "Dead"; whFlag = "Dead WH"; }
      else if ((o.deadWhQty || 0) + (o.nonMovingWhQty || 0) >= o.closingQty) { status = "Non-Moving"; whFlag = "Non-Mov WH"; }
      else status = "Slow"; // normal WH me baitha, is period koi movement nahi
      if (!whFlag && (o.deadWhQty || 0) > 0) whFlag = "Dead WH (partial)";
      else if (!whFlag && (o.nonMovingWhQty || 0) > 0) whFlag = "Non-Mov WH (partial)";
    } else {
      // template-format: lastSaleDate/month se time-based
      if (!o.lastSaleMonth && !o.lastSaleDate) status = "Dead";
      else if (ms >= rules.deadMonths) status = "Dead";
      else if (ms >= rules.nonMovingMonths) status = "Non-Moving";
      else if (o.closingQty > 0 && o.soldQty === 0) status = "Slow";
    }
    return { ...o, monthsSinceSale: ms === 999 ? "-" : ms, status, whFlag };
  }).sort((a, b) => b.closingValue - a.closingValue);

  // ---------- Warehouse-wise breakdown (latest month snapshot; SAP B1 rows me store-name hota hai) ----------
  let maxMiAll = -1;
  for (const r of rows) { const mi = monthIdx(r.month); if (mi > maxMiAll) maxMiAll = mi; }
  const whAgg = new Map<string, { company: string; store: string; code: string; items: Set<string>; qty: number; value: number; dead: number; nm: number }>();
  const whItemAgg = new Map<string, any>();
  for (const r of rows) {
    if (monthIdx(r.month) !== maxMiAll) continue;
    const store = String(r.storeName || "").trim() || "(no warehouse)";
    const code = String(r.warehouseCode || "").trim();
    const wk = `${r.company}||${store}`;
    const W = whAgg.get(wk) || (whAgg.set(wk, { company: r.company, store, code, items: new Set(), qty: 0, value: 0, dead: 0, nm: 0 }), whAgg.get(wk)!);
    const q = Number(r.closingQty) || 0, v = Number(r.closingValue) || 0;
    if (q !== 0 || v !== 0) W.items.add(`${r.company}|${r.itemNo}`);
    W.qty += q; W.value += v;
    W.dead += Number(r.deadWhQty) || 0; W.nm += Number(r.nonMovingWhQty) || 0;
    const ik = `${r.company}|${r.itemNo}|${store}`;
    const I = whItemAgg.get(ik) || (whItemAgg.set(ik, { company: r.company, itemNo: r.itemNo, itemDesc: r.itemDesc, itemGroup: r.itemGroup, store, code, qty: 0, value: 0, dead: 0, nm: 0 }), whItemAgg.get(ik)!);
    I.qty += q; I.value += v; I.dead += Number(r.deadWhQty) || 0; I.nm += Number(r.nonMovingWhQty) || 0;
  }
  const whSummary = [...whAgg.values()]
    .map((W) => ({ company: W.company, store: W.store, code: W.code, items: W.items.size, qty: W.qty, value: W.value, deadQty: W.dead, nmQty: W.nm }))
    .sort((a, b) => b.value - a.value);
  const whItems = [...whItemAgg.values()].filter((i) => i.qty !== 0 || i.value !== 0).sort((a, b) => b.value - a.value).slice(0, 1000);

  const summary = {
    openingQty: items.reduce((s, i) => s + i.openingQty, 0),
    producedQty: items.reduce((s, i) => s + i.producedQty, 0),
    soldQty: items.reduce((s, i) => s + i.soldQty, 0),
    closingQty: items.reduce((s, i) => s + i.closingQty, 0),
    closingValue: items.reduce((s, i) => s + i.closingValue, 0),
    byStatus: {} as Record<string, { qty: number; value: number; items: number }>,
  };
  for (const i of items) {
    const s = summary.byStatus[i.status] || (summary.byStatus[i.status] = { qty: 0, value: 0, items: 0 });
    s.qty += i.closingQty; s.value += i.closingValue; s.items++;
  }
  res.json({ summary, items: items.slice(0, 1000), count: items.length, whSummary, whItems });
});

// ---------- DSCR: monthly, per company (EBITDA proxy = revenue - opex from TB; debt service = loans upload) ----------
function buildDSCR(fy: string): any {
  const companies = CFG.companies.map((c: any) => c.code);
  const result: any = {};

  // revenue & opex per month per company from TB (PL side)
  let tb = store.tb as Row[];
  if (fy !== "ALL") tb = tb.filter((r) => r.fy === fy);
  for (const comp of companies) {
    const rows = tb.filter((r) => r.entity === comp && r.groupPL);
    const monthly: any = {};
    for (const mn of MONTH_NAMES) monthly[mn] = { revenue: 0, expense: 0, depreciation: 0, interestTb: 0 };
    for (const r of rows) {
      const g = (r.groupPL || "").toLowerCase();
      for (const mn of MONTH_NAMES) {
        const v = Number(r.monthly?.[mn]) || 0; // raw: sales = credit (negative), expenses = debit (positive)
        if (g.includes("sale")) monthly[mn].revenue += v;
        else if (g.includes("deprecia")) monthly[mn].depreciation += Math.abs(v);
        else if (g.includes("interest")) monthly[mn].interestTb += Math.abs(v);
        else monthly[mn].expense += v; // credits (jaise change-in-inventory) naturaly net off honge
      }
    }
    // debt service from loan-repayment-schedule upload
    let loans = (store.loans || []) as Row[];
    if (fy !== "ALL") loans = loans.filter((l) => l.fy === fy || !l.fy);
    const lc = loans.filter((l) => l.company === comp);
    const byLoan: Record<string, { principal: number; interest: number; closing: number }> = {};
    for (const mn of MONTH_NAMES) {
      monthly[mn].principal = 0; monthly[mn].interest = 0; monthly[mn].dscr = null as any;
      monthly[mn].closingBalance = 0;
      const lr = lc.filter((l) => monthIdx(l.month) === monthIdx(mn));
      for (const l of lr) {
        monthly[mn].principal += Number(l.principal) || 0;
        monthly[mn].interest += Number(l.interest) || 0;
        const k = l.loanName;
        byLoan[k] = byLoan[k] || { principal: 0, interest: 0, closing: 0 };
        byLoan[k].principal += Number(l.principal) || 0;
        byLoan[k].interest += Number(l.interest) || 0;
        if (l.closingBalance) byLoan[k].closing = Number(l.closingBalance) || 0; // latest closing wins
      }
      monthly[mn].closingBalance = lr.reduce((s, l) => s + (Number(l.closingBalance) || 0), 0) || monthly[mn].closingBalance;
      const ebitda = (-monthly[mn].revenue) - monthly[mn].expense; // revenue credit hai isliye flip
      const ds = monthly[mn].principal + monthly[mn].interest;
      monthly[mn].ebitda = ebitda;
      monthly[mn].debtService = ds;
      monthly[mn].dscr = ds > 0 ? Number((ebitda / ds).toFixed(2)) : null;
    }
    // FY closing balance per loan (last non-zero)
    for (const k of Object.keys(byLoan)) {
      const lastRows = lc.filter((l) => l.loanName === k && (l.closingBalance || 0) > 0);
      if (lastRows.length) byLoan[k].closing = Number(lastRows[lastRows.length - 1].closingBalance) || 0;
    }
    result[comp] = { monthly, loans: byLoan };
  }
  return { months: MONTH_NAMES, fy, result };
}

app.get("/api/mis/dscr", (req, res) => {
  const { fy = "ALL" } = req.query as any;
  res.json(buildDSCR(fy));
});

// ---------- YoY / period comparison ----------
app.get("/api/mis/compare", (req, res) => {
  const { metric = "sales", from = "Apr", to = "Aug" } = req.query as any;
  const mFrom = monthIdx(from), mTo = monthIdx(to);
  const mNames = MONTH_NAMES.slice(mFrom, mTo + 1);
  if (metric === "sales") {
    // sales by month by FY (from monthly tags) + by entity
    const out: any = {};
    for (const r of store.sales as Row[]) {
      const mi = Number(r.month.slice(5, 7));
      const fyAdj = mi >= 4 ? Number(r.month.slice(0, 4)) : Number(r.month.slice(0, 4)) - 1;
      const mIdxCal = mi >= 4 ? mi - 4 : mi + 8; // Apr=0
      if (mIdxCal < mFrom || mIdxCal > mTo) continue;
      const fy = `FY-${fyAdj}-${String((fyAdj + 1) % 100).padStart(2, "0")}`;
      out[fy] = out[fy] || { entity: {} as Record<string, number>, total: 0 };
      out[fy].entity[r.entity] = (out[fy].entity[r.entity] || 0) + r.taxable;
      out[fy].total += r.taxable;
    }
    res.json({ months: mNames, fyWise: out });
  } else {
    // PL/BS metric: fy-wise group totals for the period
    const { entity = "ALL", statement = "PL" } = req.query as any;
    const rows = tbRows("ALL", entity).filter((r: Row) => statementOf(r) === statement);
    const out: any = {};
    for (const r of rows) {
      const g = statement === "PL" ? r.groupPL : r.groupBS;
      const fy = r.fy;
      out[fy] = out[fy] || {};
      out[fy][g] = (out[fy][g] || 0) + mNames.reduce((s, mn) => s + (Number(r.monthly?.[mn]) || 0), 0);
    }
    res.json({ months: mNames, fyWise: out });
  }
});

// ---------- BUDGET vs ACTUAL ----------
// Head→PL-group auto-match: normalised name equality ya containment
function normHead(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function matchPLGroup(head: string, company: string): string {
  const nh = normHead(head);
  const groups = new Set<string>();
  for (const r of store.tb as Row[]) if (r.groupPL && r.entity === company) groups.add(r.groupPL);
  // fallback: sab companies ke groups (SVN jaisi company ke liye jinka PL-groups user-mapping se aate hain)
  if (!groups.size) for (const r of store.tb as Row[]) if (r.groupPL) groups.add(r.groupPL);
  for (const g of groups) {
    const ng = normHead(g);
    if (ng === nh) return g;
  }
  for (const g of groups) {
    const ng = normHead(g);
    if (ng.includes(nh) || nh.includes(ng)) return g;
  }
  // special synonyms
  const syn: Record<string, string> = {
    "finance cost interest": "finance cost", "finance cost": "finance cost",
    "rent expenses": "rent", "rent": "rent",
  };
  const sn = syn[nh] || nh;
  for (const g of groups) {
    const ng = normHead(g);
    if (ng.includes(sn) || sn.includes(ng)) return g;
  }
  return "";
}

app.get("/api/mis/budget-vs-actual", (req, res) => {
  const { fy = "ALL", entity = "ALL", upto = "" } = req.query as any;
  const mUpto = upto ? monthIdx(upto) : 11;
  let budget = store.budget || [];
  if (fy !== "ALL") budget = budget.filter((b: Row) => b.fy === fy);
  if (entity !== "ALL") budget = budget.filter((b: Row) => b.company === entity);
  budget = budget.filter((b: Row) => monthIdx(b.month) <= mUpto);

  // budget side: head + subUnit totals
  const heads = new Map<string, { head: string; match: string; budget: number; byUnit: Record<string, number>; byMonth: Record<string, number> }>();
  for (const b of budget) {
    const k = `${b.company}|${b.head}`;
    if (!heads.has(k)) heads.set(k, { head: b.head, match: matchPLGroup(b.head, b.company), budget: 0, byUnit: {}, byMonth: {} });
    const H = heads.get(k)!;
    H.budget += b.amount;
    H.byUnit[b.subUnit || "-"] = (H.byUnit[b.subUnit || "-"] || 0) + b.amount;
    H.byMonth[b.month] = (H.byMonth[b.month] || 0) + b.amount;
  }
  // actual side: TB rows jo matched group me aate hain
  let tb = store.tb as Row[];
  if (fy !== "ALL") tb = tb.filter((r) => r.fy === fy);
  if (entity !== "ALL") tb = tb.filter((r) => r.entity === entity);
  const result: any[] = [];
  for (const [k, H] of heads) {
    const [comp, head] = k.split("|");
    let actual = 0;
    const actualByMonth: Record<string, number> = {};
    if (H.match) {
      for (const r of tb) {
        if (r.entity !== comp) continue;
        if (normHead(r.groupPL) !== normHead(H.match)) continue;
        for (const mn of MONTH_NAMES) {
          if (monthIdx(mn) > mUpto) continue;
          const v = Math.abs(Number(r.monthly?.[mn]) || 0);
          actual += v;
          actualByMonth[mn] = (actualByMonth[mn] || 0) + v;
        }
      }
    }
    const variance = actual - H.budget; // expense: positive = over-budget
    result.push({
      company: comp, head, match: H.match, matched: !!H.match,
      budget: H.budget, actual, variance,
      variancePct: H.budget ? Number(((variance / H.budget) * 100).toFixed(1)) : null,
      byUnit: H.byUnit, byMonth: H.byMonth, actualByMonth,
    });
  }
  result.sort((a, b) => b.budget - a.budget);
  res.json({ rows: result, upto: upto || "Mar", fy, entity, budgetCount: budget.length });
});

app.get("/api/mis/customer360", (req, res) => {
  const { entity, fy = "ALL", code } = req.query as any;
  const payments = store.payments || [];
  const sales = store.sales.filter((r: Row) => r.customerCode === code && (!entity || entity === "ALL" || r.entity === entity) && (fy === "ALL" || fyOf(r.month) === fy));
  const rej = store.rejections.filter((r: Row) => r.partyCode === code && (!entity || entity === "ALL" || r.entity === entity) && (fy === "ALL" || fyOf(r.month) === fy));
  const pay = payments.filter((r: Row) => r.customerCode === code);
  const totalSales = sales.reduce((s: number, r: Row) => s + r.taxable, 0);
  const totalRej = rej.reduce((s: number, r: Row) => s + r.amount, 0);
  const totalPay = pay.reduce((s: number, r: Row) => s + (Number(r.amount) || 0), 0);
  res.json({
    code, name: sales[0]?.customerName || rej[0]?.partyName || code,
    totalSales, totalRejections: totalRej, netSales: totalSales - totalRej, totalPayments: totalPay,
    outstanding: totalSales - totalRej - totalPay,
    monthly: matrix(sales, () => "Sales").months.map((mo) => ({
      month: mo,
      sales: sales.filter((r: Row) => r.month === mo).reduce((s: number, r: Row) => s + r.taxable, 0),
      rej: rej.filter((r: Row) => r.month === mo).reduce((s: number, r: Row) => s + r.amount, 0),
      pay: pay.filter((r: Row) => r.month === mo).reduce((s: number, r: Row) => s + (Number(r.amount) || 0), 0),
    })),
    payments: pay,
  });
});

app.post("/api/mis/payments", (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: "rows[] required" });
  store.payments = rows;
  saveStore();
  res.json({ ok: true, count: rows.length });
});

// ---------- PAYMENTS: parse uploads/payments folder ----------
app.post("/api/mis/payments/load", (_req, res) => {
  try {
    const dir = path.join(DATA_DIR, "uploads", "payments");
    const rows: Row[] = [];
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir).filter((x) => /\.xlsx?$/i.test(x))) {
        try {
          const wb = xlsx.readFile(path.join(dir, f));
          for (const sn of wb.SheetNames) {
            const ws = wb.Sheets[sn];
            const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
            for (let r = 2; r <= last; r++) {
              // Row format: Company|FY|Month|CustomerCode|CustomerName|Amount|Date|Reference
              const code = (ws["D" + r]?.v ?? "").toString().trim();
              if (!code) continue;
              rows.push({
                srcFile: f,
                company: String(ws["A" + r]?.v ?? "").trim().toUpperCase(),
                fy: String(ws["B" + r]?.v ?? "").trim(),
                month: String(ws["C" + r]?.v ?? "").trim(),
                customerCode: code,
                customerName: String(ws["E" + r]?.v ?? ""),
                amount: Number(ws["F" + r]?.v) || 0,
                date: String(ws["G" + r]?.v ?? ""),
                reference: String(ws["H" + r]?.v ?? ""),
              });
            }
          }
        } catch (e: any) { console.warn(`[MIS] payments file skip ${f}: ${e.message}`); }
      }
    }
    store.payments = rows;
    saveStore();
    res.json({ ok: true, count: rows.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// customer list (sales se auto-pick) for dropdowns
app.get("/api/mis/customers", (req, res) => {
  const { entity = "ALL", search = "" } = req.query as any;
  let rows = store.sales as Row[];
  if (entity !== "ALL") rows = rows.filter((r: Row) => r.entity === entity);
  const m = new Map<string, string>();
  for (const r of rows) m.set(r.customerCode, r.customerName);
  let list = [...m.entries()].map(([code, name]) => ({ code, name }));
  if (search) {
    const s = search.toLowerCase();
    list = list.filter((c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
  }
  res.json({ customers: list.slice(0, 200), count: list.length });
});

// ---------- CUSTOMER MASTER + group-customer report ----------
const CM_PATH = path.join(DATA_DIR, "customer-master.json");

app.get("/api/mis/customer-master", (_req, res) => {
  res.json({ customers: store.customerMaster || [] });
});

app.post("/api/mis/customer-master", (req, res) => {
  const { customers } = req.body;
  if (!Array.isArray(customers)) return res.status(400).json({ error: "customers[] required" });
  store.customerMaster = customers;
  fs.writeFileSync(CM_PATH, JSON.stringify({ $comment: "CUSTOMER MASTER (group-level links). Ek party ke saare company-codes + vendor-codes ek block me.", customers }, null, 2));
  // re-enrich rows in-place
  const codeToParty = new Map<string, string>();
  for (const p of customers) {
    for (const l of p.links || []) {
      if (l.customerCode) codeToParty.set(`${l.entity}|${l.customerCode}`, p.name || p.group);
      if (l.vendorCode) codeToParty.set(`V|${l.vendorCode}`, p.name || p.group);
    }
  }
  for (const r of store.sales as Row[]) r.groupParty = codeToParty.get(`${r.entity}|${r.customerCode}`) || "";
  for (const r of store.rejections as Row[]) r.groupParty = codeToParty.get(`${r.entity}|${r.partyCode}`) || codeToParty.get(`V|${r.vendorCode}`) || "";
  saveStore();
  res.json({ ok: true, count: customers.length });
});

// group-level customer report: ek party ka SAKAR+SVN combined + company-split behaviour
app.get("/api/mis/customer-group", (req, res) => {
  const { search = "", fy = "ALL" } = req.query as any;
  const parties = new Map<string, any>();
  const ensure = (name: string) => {
    if (!parties.has(name)) parties.set(name, {
      party: name,
      byEntity: {} as Record<string, { sales: number; rej: number; pay: number; qty: number; months: Set<string> }>,
      total: { sales: 0, rej: 0, pay: 0, qty: 0 },
    });
    return parties.get(name);
  };
  for (const r of store.sales as Row[]) {
    if (fy !== "ALL" && fyOf(r.month) !== fy) continue;
    const gp = r.groupParty || `${r.customerName} [${r.entity}-only]`;
    const P = ensure(gp);
    const e = P.byEntity[r.entity] || (P.byEntity[r.entity] = { sales: 0, rej: 0, pay: 0, qty: 0, months: new Set() });
    e.sales += r.taxable; e.qty += r.qty || 0; e.months.add(r.month);
    P.total.sales += r.taxable; P.total.qty += r.qty || 0;
  }
  for (const r of store.rejections as Row[]) {
    if (fy !== "ALL" && fyOf(r.month) !== fy) continue;
    const gp = r.groupParty || `${r.partyName} [${r.entity}-only]`;
    const P = ensure(gp);
    const e = P.byEntity[r.entity] || (P.byEntity[r.entity] = { sales: 0, rej: 0, pay: 0, qty: 0, months: new Set() });
    e.rej += r.amount; P.total.rej += r.amount;
  }
  for (const r of (store.payments || []) as Row[]) {
    const gp = r.groupParty || `${r.customerName || r.customerCode} [${r.company}-only]`;
    const P = ensure(gp);
    const e = P.byEntity[r.company] || (P.byEntity[r.company] = { sales: 0, rej: 0, pay: 0, qty: 0, months: new Set() });
    e.pay += Number(r.amount) || 0; P.total.pay += Number(r.amount) || 0;
  }
  let list = [...parties.values()].map(P => ({
    ...P,
    entities: Object.keys(P.byEntity),
    isGroup: Object.keys(P.byEntity).length > 1,
  })).sort((a, b) => b.total.sales - a.total.sales);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(P => P.party.toLowerCase().includes(s));
  }
  const onlyGroup = list.filter(P => P.isGroup);
  res.json({ parties: list.slice(0, 300), groupCount: onlyGroup.length, totalParties: list.length });
});

// consolidated GROUP view: SAKAR+SVN combined TB rows (same ledger code merge)
app.get("/api/mis/group-tb", (req, res) => {
  const { fy = "ALL", statement = "PL" } = req.query as any;
  let rows = store.tb as Row[];
  if (fy !== "ALL") rows = rows.filter((r) => r.fy === fy);
  const m = new Map<string, any>();
  for (const r of rows) {
    const st = r.groupPL ? "PL" : (r.groupBS ? "BS" : "");
    if (st !== statement) continue;
    const g = r.groupPL || r.groupBS;
    const k = `${r.code}|${g}`;
    if (!m.has(k)) {
      const o: any = { code: r.code, name: r.name, group: g, ob: 0, total: 0, monthly: {}, entities: [] };
      for (const mn of MONTH_NAMES) o.monthly[mn] = 0;
      m.set(k, o);
    }
    const G = m.get(k);
    G.ob += Number(r.ob) || 0;
    G.total += Number(r.total) || 0;
    for (const mn of MONTH_NAMES) G.monthly[mn] += Number(r.monthly?.[mn]) || 0;
    if (!G.entities.includes(r.entity)) G.entities.push(r.entity);
  }
  const list = [...m.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const groups = new Map<string, any>();
  for (const r of list) {
    if (!groups.has(r.group)) {
      const o: any = { group: r.group, ob: 0, total: 0, count: 0 };
      for (const mn of MONTH_NAMES) o[mn] = 0;
      groups.set(r.group, o);
    }
    const G = groups.get(r.group);
    G.ob += r.ob; G.total += r.total; G.count++;
    for (const mn of MONTH_NAMES) G[mn] += r.monthly[mn];
  }
  res.json({ statement, ledgers: list, groups: [...groups.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total)) });
});

app.post("/api/mis/reload", async (_req, res) => {
  try {
    const { runLoader } = await import("./loader");
    runLoader();
    loadStore();
    res.json({ ok: true, counts: store.meta.counts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- Excel export ----------
function brandSheet(aoa: any[][], title: string, meta: Record<string, string>): xlsx.WorkSheet {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const metaLine = Object.entries(meta).filter(([, v]) => v && v !== "ALL").map(([k, v]) => `${k}: ${v}`).join("  |  ");
  const branded = [
    [title],
    ["⚡ Powered by: Vishnu Intelligence Services"],
    [`Generated: ${now}${metaLine ? "   |   " + metaLine : ""}`],
    [],
    ...aoa,
    [],
    ["⚡ Powered by: Vishnu Intelligence Services"],
  ];
  const ws = xlsx.utils.aoa_to_sheet(branded);
  const cols = Math.max(...aoa.map((r) => (r as any[]).length), 1);
  (ws as any)["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: cols - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: cols - 1 } },
  ];
  (ws as any)["!cols"] = Array.from({ length: cols }, (_, i) => ({ wch: i === 0 ? 42 : 16 }));
  return ws;
}

app.get("/api/mis/export", (req, res) => {
  const { report, entity = "ALL", fy = "ALL", statement = "PL", by = "item" } = req.query as any;
  const wb = xlsx.utils.book_new();

  if (report === "plbs") {
    const rows = tbRows(fy, entity).filter((r: Row) => statementOf(r) === statement);
    const groups = new Map<string, Row>();
    for (const r of rows) {
      const g = (statement === "PL" ? r.groupPL : r.groupBS) || "?";
      if (!groups.has(g)) {
        const o: any = { Ledger: g, OB: 0 };
        for (const mn of MONTH_NAMES) o[mn] = 0;
        o.Total = 0;
        groups.set(g, o);
      }
      const G = groups.get(g);
      G.OB += Number(r.ob) || 0;
      G.Total += Number(r.total) || 0;
      for (const mn of MONTH_NAMES) G[mn] += Number(r.monthly?.[mn]) || 0;
    }
    const head = ["Ledger", "OB", ...MONTH_NAMES, "Total"];
    const aoa = [head, ...[...groups.values()].map((G: any) => head.map((h) => G[h] ?? ""))];
    xlsx.utils.book_append_sheet(wb, brandSheet(aoa, `${statement} Statement — Group-wise`, { Entity: entity, FY: fy }), statement);
  } else if (report === "unmapped") {
    const rows = tbRows(fy, entity).filter((r: Row) => !statementOf(r));
    xlsx.utils.book_append_sheet(wb, brandSheet([
      ["Entity", "Code", "Name", "Total"],
      ...rows.map((r: Row) => [r.entity, r.code, r.name, r.total]),
    ], "Unmapped Ledgers — need PL/BS grouping", { Entity: entity, FY: fy }), "Unmapped");
  } else if (report === "rejections") {
    let rows = rejectionRows(fy, entity);
    let purch = store.purchases as Row[];
    if (fy !== "ALL") purch = purch.filter((p) => fyOf(p.month) === fy);
    if (entity !== "ALL") purch = purch.filter((p) => p.entity === entity);
    const merged = [...rows, ...purch.filter((p: Row) => p.docType !== "grpo")];
    const g = groupSum(merged, (r: Row) => `${r.partyCode || r.vendorCode || "?"} - ${r.partyName}`);
    const rejAoa = [["Party", "Qty", "Taxable", "GST", "Total"], ...g.map((r) => [r.name, r.qty, r.taxable, r.gst, r.total])];
    xlsx.utils.book_append_sheet(wb, brandSheet(rejAoa, "Rejections — both channels", { Entity: entity }), "Rejections");
  } else if (report === "cgroup") {
    // group-customer export (party + company split)
    const parties = new Map<string, any>();
    for (const r of store.sales as Row[]) {
      if (fy !== "ALL" && fyOf(r.month) !== fy) continue;
      const gp = r.groupParty || `${r.customerName} [${r.entity}-only]`;
      const P = parties.get(gp) || (parties.set(gp, { party: gp, byE: {} as Record<string, number>, rej: 0, pay: 0 }), parties.get(gp));
      P.byE[r.entity] = (P.byE[r.entity] || 0) + r.taxable;
    }
    for (const r of store.rejections as Row[]) {
      if (fy !== "ALL" && fyOf(r.month) !== fy) continue;
      const gp = r.groupParty || `${r.partyName} [${r.entity}-only]`;
      const P = parties.get(gp); if (P) P.rej += r.amount;
    }
    for (const r of (store.payments || []) as Row[]) {
      const gp = r.groupParty || `${r.customerName || r.customerCode} [${r.company}-only]`;
      const P = parties.get(gp); if (P) P.pay += Number(r.amount) || 0;
    }
    const list = [...parties.values()].sort((a, b) =>
      (b.byE["SAKAR"] || 0) + (b.byE["SVN"] || 0) - ((a.byE["SAKAR"] || 0) + (a.byE["SVN"] || 0)));
    const cgAoa = [
      ["Party", "SAKAR Sales", "SVN Sales", "Group Total", "Rejections", "Payments"],
      ...list.map((P) => [P.party, P.byE["SAKAR"] || 0, P.byE["SVN"] || 0, (P.byE["SAKAR"] || 0) + (P.byE["SVN"] || 0), P.rej, P.pay]),
    ];
    xlsx.utils.book_append_sheet(wb, brandSheet(cgAoa, "Group Customers — Company-wise Behaviour", { Entity: entity, FY: fy }), "Group Customers");
  } else if (report === "loans") {
    // ===== Loan Detail export: Master + Month-wise Detail + DSCR summary =====
    const month = String((req.query as any).month || "ALL"); // "ALL" = poora FY
    let loans = (store.loans || []) as Row[];
    if (fy !== "ALL") loans = loans.filter((l) => l.fy === fy || !l.fy);
    if (entity !== "ALL") loans = loans.filter((l) => l.company === entity);
    if (month !== "ALL") loans = loans.filter((l) => monthIdx(l.month) === monthIdx(month));

    // Sheet 1: per-loan FY master (sanction-period summary)
    const perLoan = new Map<string, any>();
    for (const l of loans) {
      const k = `${l.company}||${l.loanName}`;
      const o = perLoan.get(k) || (perLoan.set(k, { company: l.company, loan: l.loanName, lender: l.lender || "", principal: 0, interest: 0, closing: 0, opening: 0, src: l.srcFile || "" }), perLoan.get(k));
      o.principal += Number(l.principal) || 0;
      o.interest += Number(l.interest) || 0;
      if (Number(l.openingBalance) > 0) o.opening = Number(l.openingBalance);
      if (Number(l.closingBalance) > 0) o.closing = Number(l.closingBalance);
    }
    const master = [
      ["Company", "Loan Name", "Lender", "Opening Balance", "FY Principal Paid", "FY Interest Paid", "Closing Balance", "Source"],
      ...[...perLoan.values()].sort((a, b) => a.company.localeCompare(b.company) || a.loan.localeCompare(b.loan))
        .map((o) => [o.company, o.loan, o.lender, o.opening, o.principal, o.interest, o.closing, o.src]),
    ];
    xlsx.utils.book_append_sheet(wb, brandSheet(master, `Loan Master — ${month === "ALL" ? "FY-wise" : month + " month"}`, { Entity: entity, FY: fy, Month: month }), "Loan Master");

    // Sheet 2: row-level month detail (as-uploaded)
    const detail = [
      ["Company", "FY", "Month", "Loan Name", "Opening Bal", "Principal", "Interest", "Closing Bal", "Manual Edit"],
      ...loans.map((l) => [l.company, l.fy, l.month, l.loanName, Number(l.openingBalance) || 0, Number(l.principal) || 0, Number(l.interest) || 0, Number(l.closingBalance) || 0, l.manualEdit ? "YES" : ""]),
    ];
    xlsx.utils.book_append_sheet(wb, brandSheet(detail, `Loan Detail — ${month === "ALL" ? "Full Year (month-wise rows)" : month}`, { Entity: entity, FY: fy }), "Month Detail");

    // Sheet 3: DSCR month-matrix (same numbers as DSCR tab)
    const dscrResp = buildDSCR(fy);
    const dscrAoa: any[][] = [["Company", "Metric", ...dscrResp.months.map((mn: string) => mn.slice(0, 3)), "FY Total"]];
    for (const [comp, obj] of Object.entries(dscrResp.result as any)) {
      for (const [label, key] of [["EBITDA (Rev − Opex)", "ebitda"], ["Principal Paid", "principal"], ["Interest Paid", "interest"], ["Debt Service", "debtService"], ["DSCR (×)", "dscr"], ["Loan Balance (closing)", "closingBalance"]] as [string, string][]) {
        const r: any[] = [comp, label];
        let tot = 0, has = false;
        for (const mn of dscrResp.months) {
          const v = (obj as any).monthly[mn]?.[key];
          if (typeof v === "number") { tot += v; if (v !== 0) has = true; }
          r.push(v == null ? "" : v);
        }
        r.push(key === "dscr" ? (has ? Number((tot / dscrResp.months.filter((mn: string) => (obj as any).monthly[mn]?.dscr != null).length || 1)).toFixed(2) : "") : (has ? tot : ""));
        dscrAoa.push(r);
      }
    }
    xlsx.utils.book_append_sheet(wb, brandSheet(dscrAoa, "DSCR — Month-wise (loans vs EBITDA)", { FY: fy }), "DSCR Summary");
  } else {
    let rows = salesRows(fy, entity);
    const m = matrix(rows, by === "customer" ? (r: Row) => `${r.customerCode} - ${r.customerName}` : (r: Row) => `${r.itemNo} - ${r.itemDesc}`);
    const aoa = [["Party/Item", ...m.months, "Total"], ...m.rows.map((r: any) => [r.name, ...m.months.map((mo) => r[mo] || 0), r.total])];
    xlsx.utils.book_append_sheet(wb, brandSheet(aoa, "Sales Matrix — Month-wise", { Entity: entity, FY: fy, "Group by": by }), "Sales Matrix");
  }

  const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="MIS_${report}_${statement}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buf);
});

// ---------- static UI + templates (hidden corner downloads) ----------
app.use("/mis", express.static(path.join(ROOT, "public")));
app.get("/mis", (_req, res) => res.sendFile(path.join(ROOT, "public", "index.html")));

// ---------- Loan-detail print/PDF (browser print → Save as PDF) ----------
app.get("/mis/loan-print", (req, res) => {
  const { entity = "ALL", fy = "ALL", month = "ALL" } = req.query as any;
  let loans = (store.loans || []) as Row[];
  if (fy !== "ALL") loans = loans.filter((l) => l.fy === fy || !l.fy);
  if (entity !== "ALL") loans = loans.filter((l) => l.company === entity);
  if (month !== "ALL") loans = loans.filter((l) => monthIdx(l.month) === monthIdx(month));

  const period = month === "ALL" ? `Full Year` : `${month} month`;
  const companies = [...new Set(loans.map((l) => l.company))].sort();
  const money = (n: any) => Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  let body = "";
  for (const comp of companies) {
    const lc = loans.filter((l) => l.company === comp);
    const perLoan = new Map<string, { pri: number; int: number; open: number; close: number }>();
    for (const l of lc) {
      const o = perLoan.get(l.loanName) || (perLoan.set(l.loanName, { pri: 0, int: 0, open: 0, close: 0 }), perLoan.get(l.loanName)!);
      o.pri += Number(l.principal) || 0; o.int += Number(l.interest) || 0;
      if (Number(l.openingBalance) > 0) o.open = Number(l.openingBalance);
      if (Number(l.closingBalance) > 0) o.close = Number(l.closingBalance);
    }
    body += `<h2>${comp} — Loan Summary (${period})</h2><table><thead><tr><th>Loan</th><th class="r">Opening</th><th class="r">Principal Paid</th><th class="r">Interest Paid</th><th class="r">Closing</th></tr></thead><tbody>`;
    let tp = 0, ti = 0, to = 0, tc = 0;
    for (const [k, o] of [...perLoan.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      tp += o.pri; ti += o.int; to += o.open; tc += o.close;
      body += `<tr><td>${k}</td><td class="r">${o.open ? money(o.open) : "—"}</td><td class="r">${money(o.pri)}</td><td class="r">${money(o.int)}</td><td class="r">${o.close ? money(o.close) : "—"}</td></tr>`;
    }
    body += `<tr class="tot"><td>TOTAL</td><td class="r">${to ? money(to) : "—"}</td><td class="r">${money(tp)}</td><td class="r">${money(ti)}</td><td class="r">${tc ? money(tc) : "—"}</td></tr></tbody></table>`;
    body += `<h3>${comp} — Month-wise Detail (as-recorded rows)</h3><table><thead><tr><th>Month</th><th>Loan</th><th class="r">Opening</th><th class="r">Principal</th><th class="r">Interest</th><th class="r">Closing</th><th>Flag</th></tr></thead><tbody>`;
    const sorted = [...lc].sort((a, b) => monthIdx(a.month) - monthIdx(b.month) || a.loanName.localeCompare(b.loanName));
    for (const l of sorted) {
      body += `<tr><td>${l.month}</td><td>${l.loanName}</td><td class="r">${Number(l.openingBalance) ? money(l.openingBalance) : "—"}</td><td class="r">${money(l.principal)}</td><td class="r">${money(l.interest)}</td><td class="r">${Number(l.closingBalance) ? money(l.closingBalance) : "—"}</td><td>${l.manualEdit ? "✏️ manual" : (l.srcFile ? "sheet" : "")}</td></tr>`;
    }
    body += `</tbody></table>`;
  }
  if (!companies.length) body = '<p class="note">Is filter ke liye koi loan-row nahi mili (entity/FY/month badal kar dekho).</p>';

  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Loan Detail — ${entity} — ${period}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #111827; padding: 24px; }
  h1 { font-size: 18px; } h2 { font-size: 14px; margin: 18px 0 8px; } h3 { font-size: 12px; margin: 14px 0 6px; color: #374151; }
  .brand { color: #1e3a5f; font-weight: 700; }
  .sub { color: #6b7280; font-size: 11px; margin: 2px 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
  th, td { border: 1px solid #d1d5db; padding: 4px 7px; text-align: left; }
  th { background: #1e3a5f; color: #fff; }
  td.r { text-align: right; font-variant-numeric: tabular-nums; }
  tr.tot td { background: #e5e7eb; font-weight: 700; }
  tbody tr:nth-child(even) td { background: #f9fafb; }
  .note { color: #6b7280; padding: 20px 0; }
  footer { margin-top: 22px; font-size: 11px; color: #1e3a5f; font-weight: 600; border-top: 1px solid #d1d5db; padding-top: 6px; }
  @media print { body { padding: 0; } .noprint { display: none; } }
</style></head><body>
<div class="noprint" style="margin-bottom:14px"><button onclick="window.print()" style="padding:8px 16px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨 Print / Save as PDF</button></div>
<h1>Loan Detail — Month-wise <span class="brand">| Vishnu Intelligence Services</span></h1>
<div class="sub">Company: ${entity} &nbsp;|&nbsp; FY: ${fy} &nbsp;|&nbsp; Period: ${period} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString("en-IN")}</div>
${body}
<footer>⚡ Powered by: Vishnu Intelligence Services</footer>
<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 600); });</script>
</body></html>`);
});

const TPL_DIR = path.join(DATA_DIR, "templates");
app.get("/api/mis/templates", (_req, res) => {
  const files = fs.existsSync(TPL_DIR) ? fs.readdirSync(TPL_DIR).filter((f) => /\.(xlsx?|txt)$/i.test(f)) : [];
  res.json({ templates: files });
});
app.get("/api/mis/templates/:name", (req, res) => {
  const p = path.join(TPL_DIR, path.basename(req.params.name));
  if (!fs.existsSync(p)) return res.status(404).json({ error: "not found" });
  res.download(p);
});
// PAYMENT register template (agar abhi nahi bana to ab banao)
try {
  const payTpl = path.join(TPL_DIR, "PAYMENT-UPLOAD-TEMPLATE.xlsx");
  if (!fs.existsSync(payTpl)) {
    const wb3 = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb3, xlsx.utils.aoa_to_sheet([
      ["Company", "FY", "Month", "Customer Code", "Customer Name", "Amount Received", "Payment Date", "Bank Reference"],
      ["SAKAR", "FY-2026-27", "Aug", "C00021", "POLYCAB INDIA LTD.", 150000, "2026-08-25", "NEFT/HDFC/004512"],
    ]), "Payments");
    fs.writeFileSync(payTpl, xlsx.write(wb3, { type: "buffer", bookType: "xlsx" }));
  }
} catch (e) { console.warn("[MIS] payment template skip:", (e as any).message); }

app.listen(PORT, () => {
  console.log(`[MIS] Portal running: http://localhost:${PORT}/mis  (data: ${DATA_DIR})`);
});
