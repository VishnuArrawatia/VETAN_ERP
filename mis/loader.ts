import { read, utils } from "xlsx";
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "mis");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "mis-config.json"), "utf-8"));
const DATA_DIR = CFG.dataDir || path.join(ROOT, "data");
const MAP_PATH = path.join(DATA_DIR, "ledger-map.json");

type Row = Record<string, any>;

// Robust CSV parse for SAP exports: quotes are only treated as delimiters at field-START.
// SAP descriptions contain stray quotes ("5Mil"", "2"") — those are literal chars, NOT field delimiters.
// Also handles CRLF + trailing fragment rows. Returns rows of string fields.
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else if (ch === '"') {
      // quote only opens a field when it is the FIRST char of the field
      if (field === "") inQ = true; else field += ch;
    } else if (ch === ",") { cur.push(field); field = ""; }
    else if (ch === "\n") { cur.push(field.replace(/\r$/, "")); rows.push(cur); cur = []; field = ""; }
    else field += ch;
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

function col(ws: any, letter: string, r: number): any {
  const v = (ws as any)[`${letter}${r}`];
  return v ? v.v : undefined;
}
function excelDate(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) as any);
    d.setUTCDate(d.getUTCDate() + v);
    return d.toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}
function toNum(v: any): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
  return isFinite(n) ? n : 0;
}
function monthLabel(v: any): string {
  const d = typeof v === "number"
    ? new Date(Date.UTC(1899, 11, 30) as any).getTime() + v * 86400000
    : new Date(v).getTime();
  return isFinite(d) ? new Date(d).toISOString().slice(0, 7) : String(v ?? "");
}
function saneMonth(m: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && m >= "2000-01";
}
function fyOf(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const startYear = m >= (CFG.fiscalYearStartMonth || 4) ? y : y - 1;
  return `FY-${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function runLoader(): any {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`[MIS-loader] dataDir: ${DATA_DIR}`);
  const links = CFG.customerVendorLinks || [];
  let mapData: any = { mappings: [] };
  try { mapData = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8")); } catch {}
  const mappings: any[] = mapData.mappings || [];

  const sales: Row[] = [];
  const rejections: Row[] = [];
  const purchases: Row[] = [];
  const tb: Row[] = [];

  // ---------- SALES / CN / PURCHASE (current-month workbook) ----------
  // Sales/CN/Purchase workbook parse (main file + purane-saal files dono)
  function parseSalesWorkbook(wbPath: string, sheets: any, srcTag: string): void {
    if (!fs.existsSync(wbPath)) { console.warn(`[MIS-loader] sales workbook not found: ${wbPath}`); return; }
    const wb = read(wbPath, { type: "file" });
    const c = CFG.salesWorkbook.columns.iwsr;
    for (const [entity, sheetName] of Object.entries(sheets.iwsr || {})) {
      const ws = wb.Sheets[sheetName as string];
      if (!ws) { console.warn(`[MIS-loader] IWSR sheet missing: ${srcTag}/${sheetName}`); continue; }
      const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
      // SAP-dump continuation rows: month/date sirf pehli line par hote hain - carry-forward
      let cfMonth: any = null, cfDate: any = null, cfInv: any = null;
      for (let r = 2; r <= last; r++) {
        const cust = col(ws, c.customerCode, r);
        const amount = toNum(col(ws, c.taxableAmount, r));
        if (!cust && !amount) continue;
        const rawMonth = col(ws, c.month, r);
        const rawDate = col(ws, c.invoiceDate, r);
        const rawInv = col(ws, c.invoiceNo, r);
        if (rawMonth != null && String(rawMonth).trim() !== "") cfMonth = rawMonth;
        if (rawDate != null) cfDate = rawDate;
        if (rawInv != null && String(rawInv).trim() !== "") cfInv = rawInv;
        sales.push({
          entity, month: saneMonth(monthLabel(cfMonth)) ? monthLabel(cfMonth) : "", date: excelDate(cfDate),
          invoice: String(cfInv ?? ""),
          customerCode: String(cust ?? ""), customerName: String(col(ws, c.customerName, r) ?? ""),
          itemNo: String(col(ws, c.itemNo, r) ?? ""), itemDesc: String(col(ws, c.itemDesc, r) ?? ""),
          itemCategory: String(col(ws, c.itemCategory, r) ?? ""), itemGroup: String(col(ws, c.itemGroup, r) ?? ""),
          itemSubgroup: String(col(ws, c.itemSubgroup, r) ?? ""), customerGroup: String(col(ws, c.customerGroup, r) ?? ""),
          qty: toNum(col(ws, c.quantity, r)), rate: toNum(col(ws, c.unitPrice, r)),
          taxable: amount, gst: toNum(col(ws, c.gstAmount, r)), total: toNum(col(ws, c.totalAmount, r)),
        });
      }
    }
    for (const [entity, sheetName] of Object.entries(sheets.creditNote || {})) {
      const ws = wb.Sheets[sheetName as string];
      if (!ws) { console.warn(`[MIS-loader] CN sheet missing: ${srcTag}/${sheetName}`); continue; }
      const c = CFG.salesWorkbook.columns.cn;
      const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
      let cfMonth: any = null, cfDate: any = null, cfNo: any = null;
      for (let r = 2; r <= last; r++) {
        const cust = col(ws, c.customerCode, r);
        const amt = toNum(col(ws, c.taxableAmount, r));
        if (!cust && !amt) continue;
        const rawMonth = col(ws, c.month, r);
        const rawDate = col(ws, c.cnDate, r);
        const rawNo = col(ws, c.cnNo, r);
        if (rawMonth != null && String(rawMonth).trim() !== "") cfMonth = rawMonth;
        if (rawDate != null) cfDate = rawDate;
        if (rawNo != null && String(rawNo).trim() !== "") cfNo = rawNo;
        const code = String(cust ?? "");
        const linked = links.find((l: any) => l.entity === entity && l.customerCode === code);
        rejections.push({
          entity, channel: "credit-note", month: saneMonth(monthLabel(cfMonth)) ? monthLabel(cfMonth) : "", date: excelDate(cfDate),
          docNo: String(cfNo ?? ""), reason: String(col(ws, c.reason, r) ?? ""),
          partyCode: code, partyName: String(col(ws, c.customerName, r) ?? ""),
          vendorCode: linked ? linked.vendorCode : "",
          itemNo: String(col(ws, c.itemNo, r) ?? ""), itemDesc: String(col(ws, c.itemDesc, r) ?? ""),
          qty: toNum(col(ws, c.quantity, r)), amount: amt,
        });
      }
    }
    if (sheets.purchase) {
      const pw = wb.Sheets[sheets.purchase];
      if (!pw) { console.warn(`[MIS-loader] Purchase sheet missing: ${srcTag}/${sheets.purchase}`); return; }
      const c = CFG.salesWorkbook.columns.purchase;
      const last = Number((pw["!ref"] as string).split(":")[1].replace(/\D/g, ""));
      for (let r = 3; r <= last; r++) {
        const vcode = col(pw, c.vendorCode, r);
        const amt = toNum(col(pw, c.amount, r));
        if (!vcode && !amt) continue;
        const code = String(vcode ?? "");
        const linked = links.find((l: any) => l.vendorCode === code);
        const details = String(col(pw, c.details, r) ?? "");
        // docType: credit-memo = rejection, grpo = normal inward (rejection-calc me exclude hota hai)
        const docType = /credit memo/i.test(details) ? "credit-memo" : /goods receipt/i.test(details) ? "grpo" : "purchase";
        purchases.push({
          entity: linked ? linked.entity : "", channel: "purchase-invoice",
          month: monthLabel(col(pw, c.month, r)), date: excelDate(col(pw, c.postingDate, r)),
          docNo: String(col(pw, c.transNo, r) ?? ""), reason: details,
          partyCode: linked ? linked.customerCode : "", partyName: String(col(pw, c.vendorName, r) ?? ""),
          vendorCode: code, amount: Math.abs(amt), docType,
        });
      }
    }
  }

  // Main sales workbook + extra (purane-saal) workbooks — sab parse hote hain
  const wbJobs: any[] = [];
  if (CFG.salesWorkbook?.path) wbJobs.push({ path: CFG.salesWorkbook.path, sheets: CFG.salesWorkbook.sheets });
  for (const x of CFG.salesWorkbooks?.list || []) {
    const base = CFG.salesWorkbook.sheets;
    wbJobs.push({
      path: x.file,
      sheets: { iwsr: x.iwsr ?? base.iwsr, creditNote: x.creditNote ?? base.creditNote, purchase: x.purchase ?? base.purchase },
    });
  }
  for (const j of wbJobs) parseSalesWorkbook(j.path, j.sheets, j.path.split(/[\\/]/).pop() || "");

  // ---------- SALES CSVs (SAP B1 query-export, UTF-16) - purane saal + current ----------
  // NOTE: numbers fix karna REQUIRED hai - SAP big values ko UNQUOTED comma se likhta hai
  // ("12,450.00" -> "12" + "450.00" fragments). Repair: fragment-merge karo, phir
  // validate karo qty*rate == taxable (loose, tax-exclusive). Match na ho to 3-tuple shift.
  function parseSalesCsv(p: string, entity: string, srcTag: string): void {
    if (!fs.existsSync(p)) { console.warn(`[MIS-loader] sales CSV not found: ${p}`); return; }
    const buf = fs.readFileSync(p);
    const text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.slice(2).toString("utf16le") : buf.toString("utf16le");
    const rows = parseCsvText(text);
    const data = rows.filter(r => r.some(c => c.trim() !== ""));
    if (data.length < 2) { console.warn(`[MIS-loader] sales CSV empty: ${srcTag}`); return; }
    const H = data[0].map(h => h.trim().toLowerCase());
    const idx = (names: string[]) => H.findIndex(h => names.includes(h));
    const I = {
      docType: idx(["type"]), inv: idx(["invoice no"]), date: idx(["invoice date"]),
      custCode: idx(["customer code"]), custName: idx(["customer name"]),
      itemNo: idx(["item no.", "item no"]), itemDesc: idx(["item/service description"]),
      itemCategory: idx(["item category"]), itemGroup: idx(["item group"]), itemSubgroup: idx(["item subgroup"]),
      customerGroup: idx(["customer group"]), qty: idx(["quantity"]), rate: idx(["unit price"]),
      taxable: idx(["taxable amount"]), gst: idx(["gst amount"]), total: idx(["total amount"]),
    };
    const n2 = (s: string) => parseFloat(String(s ?? "").replace(/,/g, "")) || 0;
    const ddmmyyyy = (s: string): string | null => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s ?? "").trim());
      if (!m) return null;
      return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    };
    // ---- fragment-repair + validation over a single raw row ----
    // return { q, r, t } repaired, ya null agar invalid
    function repair(raw: string[]): { q: number; r: number; t: number; note: string } | null {
      if (I.qty < 0 || I.rate < 0 || I.taxable < 0) return null;
      const endIdx = I.total >= 0 ? I.total : I.taxable;
      // numbers that appear AFTER the last known numeric col belong to later cols; the SAP
      // fragment bug pushes extra fragments INTO later numeric columns, so merge-run logic:
      const seg = raw.slice(I.qty, endIdx + 1); // fragments+cols from qty .. total
      const isNum = (s: string) => /^[\d,]+\.\d+$/.test(s.trim()) || /^[\d,]+$/.test(s.trim());
      // greedy merge: walk from left, join next fragment while current is an integer-only fragment
      // that a numeric continuation follows (i.e. current matches /^\d+$/ and next matches /^[\d,]+\.\d+$/ or /^\d+$/)
      const merged: string[] = [];
      let acc = "";
      for (const s of seg) {
        const v = s.trim();
        if (acc === "") acc = v;
        else if (/^\d+$/.test(acc) && isNum(v)) acc = acc + "," + v;
        else { merged.push(acc); acc = v; }
      }
      if (acc !== "") merged.push(acc);
      // now interpret: expected [qty, rate, taxable, (gst, igst?, cgst?, sgst?), total]
      // BUT gst columns may be collapsed to fewer. Use: q=merged[0], r=merged[1]; then find
      // taxable among merged[2..], total = last merged.
      const nums = merged.map(n2);
      if (nums.length < 3) return null;
      const total = nums[nums.length - 1];
      const q = nums[0], r = nums[1];
      // taxable = the value v in merged[2..-2] closest to q*r (tax-exclusive)
      let best = NaN, bestDiff = Infinity;
      for (let k = 2; k < nums.length - 1; k++) {
        const d = Math.abs(nums[k] - q * r);
        if (d < bestDiff) { bestDiff = d; best = nums[k]; }
      }
      const exp = q * r;
      if (isFinite(best) && bestDiff <= Math.max(1, exp * 0.005)) return { q, r, t: best, note: "" };
      // shift attempt: rate might have absorbed qty's comma (q already merged) - try q'=q, r'=nums[1]... already done.
      // fallback: keep total (sales totals me sum me farak) but flag
      return { q, r, t: best || 0, note: "unvalidated" };
    }
    let okCount = 0, flagCount = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = I.itemNo >= 0 ? String(row[I.itemNo] ?? "").trim() : "";
      const custCode = I.custCode >= 0 ? String(row[I.custCode] ?? "").trim() : "";
      const taxableRaw = I.taxable >= 0 ? row[I.taxable] : "";
      if (!item && !custCode && !n2(taxableRaw)) continue;
      const rep = repair(row);
      if (rep) { if (rep.note) flagCount++; else okCount++; }
      const dateS = I.date >= 0 ? ddmmyyyy(row[I.date]) : null;
      const m = dateS ? dateS.slice(0, 7) : "";
      sales.push({
        entity, month: saneMonth(m) ? m : "", date: dateS,
        invoice: I.inv >= 0 ? String(row[I.inv] ?? "") : "",
        customerCode: custCode, customerName: I.custName >= 0 ? String(row[I.custName] ?? "") : "",
        itemNo: item, itemDesc: I.itemDesc >= 0 ? String(row[I.itemDesc] ?? "") : "",
        itemCategory: I.itemCategory >= 0 ? String(row[I.itemCategory] ?? "") : "",
        itemGroup: I.itemGroup >= 0 ? String(row[I.itemGroup] ?? "") : "",
        itemSubgroup: I.itemSubgroup >= 0 ? String(row[I.itemSubgroup] ?? "") : "",
        customerGroup: I.customerGroup >= 0 ? String(row[I.customerGroup] ?? "") : "",
        qty: rep?.q ?? 0, rate: rep?.r ?? 0,
        taxable: rep?.t ?? n2(taxableRaw), gst: I.gst >= 0 ? n2(row[I.gst]) : 0,
        total: I.total >= 0 ? n2(row[I.total]) : 0,
        src: srcTag,
      });
    }
    console.log(`[MIS-loader] ${srcTag}: ${okCount + flagCount} sales rows (validated ${okCount}, flag ${flagCount})`);
  }
  for (const sc of CFG.salesCsvFiles?.files || []) {
    parseSalesCsv(sc.file, sc.entity || "SAKAR", sc.file.split(/[\\/]/).pop() || "");
  }

  // ---------- CREDIT-NOTE CSVs (SAP B1 UTF-16) - purane saal ka rejection history ----------
  // Workbook CN-SKR/SVN sheets current-FY dete hain; CSV se HISTORY (uptoMonth tak) aati hai.
  // uptoMonth se >= wali CSV rows SKIP hoti hain -> double-count guard (workbook se overlap).
  function parseCreditNoteCsv(p: string, entity: string, uptoMonth: string, srcTag: string): void {
    if (!fs.existsSync(p)) { console.warn(`[MIS-loader] CN CSV not found: ${p}`); return; }
    const buf = fs.readFileSync(p);
    const text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.slice(2).toString("utf16le") : buf.toString("utf16le");
    const rows = parseCsvText(text);
    const data = rows.filter(r => r.some(c => c.trim() !== ""));
    if (data.length < 2) { console.warn(`[MIS-loader] CN CSV empty: ${srcTag}`); return; }
    const H = data[0].map(h => h.trim().toLowerCase());
    const idx = (names: string[]) => H.findIndex(h => names.includes(h));
    const I = {
      cn: idx(["credit note no"]), date: idx(["credit note date"]),
      custCode: idx(["customer code"]), custName: idx(["customer name"]),
      itemNo: idx(["item no.", "item no"]), itemDesc: idx(["item/service description"]),
      qty: idx(["quantity"]), rate: idx(["unit price"]), taxable: idx(["taxable amount"]),
    };
    const n2 = (s: string) => parseFloat(String(s ?? "").replace(/,/g, "")) || 0;
    const ddmmyyyy = (s: string): string | null => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s ?? "").trim());
      return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
    };
    // fragment-repair: qty se aage ~7 cols ka segment lo (taxable ka fragment tax-code col
    // me bhi leak karta hai), integer+decimal pairs merge karo, phir POSITIONAL mapping:
    // merged[0]=qty, merged[1]=rate, merged[2]=taxable (text cells merge chain todte hain)
    function repair(raw: string[]): { q: number; r: number; t: number; ok: boolean } | null {
      if (I.qty < 0 || I.rate < 0 || I.taxable < 0) return null;
      const seg = raw.slice(I.qty, Math.min(I.taxable + 7, raw.length));
      const isNum = (s: string) => /^[\d,]+\.\d+$/.test(s.trim()) || /^[\d,]+$/.test(s.trim());
      const merged: string[] = [];
      let acc = "";
      for (const s of seg) {
        const v = s.trim();
        if (acc === "") acc = v;
        else if (/^\d+$/.test(acc) && isNum(v)) acc = acc + "," + v;
        else { merged.push(acc); acc = v; }
      }
      if (acc !== "") merged.push(acc);
      const nums = merged.map(n2);
      if (nums.length < 3) return null;
      const q = nums[0], r = nums[1], t = nums[2];
      // qty=0 rows (service/discount CN) bhi valid
      if (q === 0) return { q, r, t, ok: true };
      const exp = q * r;
      const ok = Math.abs(t - exp) <= Math.max(1, exp * 0.005);
      return { q, r, t, ok };
    }
    let okCount = 0, flagCount = 0, skipCount = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const item = I.itemNo >= 0 ? String(row[I.itemNo] ?? "").trim() : "";
      const custCode = I.custCode >= 0 ? String(row[I.custCode] ?? "").trim() : "";
      const taxableRaw = I.taxable >= 0 ? row[I.taxable] : "";
      if (!item && !custCode && !n2(taxableRaw)) continue;
      const dateS = I.date >= 0 ? ddmmyyyy(row[I.date]) : null;
      const m = dateS ? dateS.slice(0, 7) : "";
      if (uptoMonth && m >= uptoMonth) { skipCount++; continue; } // double-count guard
      const rep = repair(row);
      if (rep) { if (rep.ok) okCount++; else flagCount++; }
      const code = custCode;
      const linked = links.find((l: any) => l.entity === entity && l.customerCode === code);
      rejections.push({
        entity, channel: "credit-note", month: saneMonth(m) ? m : "", date: dateS,
        docNo: I.cn >= 0 ? String(row[I.cn] ?? "") : "", reason: "",
        partyCode: code, partyName: I.custName >= 0 ? String(row[I.custName] ?? "") : "",
        vendorCode: linked ? linked.vendorCode : "",
        itemNo: item, itemDesc: I.itemDesc >= 0 ? String(row[I.itemDesc] ?? "") : "",
        qty: rep?.q ?? 0, amount: rep?.t ?? n2(taxableRaw),
        src: srcTag,
      });
    }
    console.log(`[MIS-loader] ${srcTag}: ${okCount + flagCount} CN rows (validated ${okCount}, flag ${flagCount}, skipped-from-${uptoMonth}: ${skipCount})`);
  }
  for (const cc of CFG.creditNoteCsv?.files || []) {
    parseCreditNoteCsv(cc.file, cc.entity || "SAKAR", cc.uptoMonth || "", cc.file.split(/[\\/]/).pop() || "");
  }

  // ---------- FG-PURCHASE CSV (SAP B1 ledger, UTF-16) - channel-2 rejection history ----------
  // 17-col ledger: Posting Date | Trans.No | Origin(PD=GRPO/PC=A.P Credit Memo) | Details |
  // C/D | Cumulative | Debit | Credit... Vendor-code = Offset Account (V####) ya Details text me.
  // PC rows = CUSTOMER REJECTIONS (return credit-memos), PD = normal FG purchase.
  function parseFgPurchaseCsv(p: string, entity: string, uptoMonth: string, srcTag: string): void {
    if (!fs.existsSync(p)) { console.warn(`[MIS-loader] FG-Purchase CSV not found: ${p}`); return; }
    const buf = fs.readFileSync(p);
    const text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.slice(2).toString("utf16le") : buf.toString("utf16le");
    const rows = parseCsvText(text);
    const data = rows.filter(r => r.some(c => c.trim() !== ""));
    if (data.length < 2) { console.warn(`[MIS-loader] FG-Purchase CSV empty: ${srcTag}`); return; }
    const H = data[0].map(h => h.trim().toLowerCase());
    const idx = (names: string[]) => H.findIndex(h => names.includes(h));
    const I = {
      date: idx(["posting date"]), trans: idx(["trans. no.", "trans no"]), origin: idx(["origin"]),
      offset: idx(["offset account"]), details: idx(["details"]), debit: idx(["debit (lc)"]), credit: idx(["credit (lc)"]),
    };
    const n2 = (s: string) => parseFloat(String(s ?? "").replace(/,/g, "")) || 0;
    const ddmmyyyy = (s: string): string | null => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s ?? "").trim());
      return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
    };
    const vendorOf = (row: string[]): string => {
      const off = I.offset >= 0 ? String(row[I.offset] ?? "").trim() : "";
      if (/^V\d+$/i.test(off)) return off.toUpperCase();
      const det = I.details >= 0 ? String(row[I.details] ?? "") : "";
      const m = /V\d{4,}/i.exec(det);
      return m ? m[0].toUpperCase() : "";
    };
    let pcCount = 0, pdCount = 0, skipCount = 0, fragFlag = 0;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const origin = I.origin >= 0 ? String(row[I.origin] ?? "").trim().toUpperCase() : "";
      const trans = I.trans >= 0 ? String(row[I.trans] ?? "").trim() : "";
      const dateS = I.date >= 0 ? ddmmyyyy(row[I.date]) : null;
      const m = dateS ? dateS.slice(0, 7) : "";
      if (origin === "OB" || (!trans && !origin)) continue; // opening-balance row
      if (uptoMonth && m >= uptoMonth) { skipCount++; continue; } // workbook overlap-guard
      const debit = I.debit >= 0 ? n2(row[I.debit]) : 0;
      const credit = I.credit >= 0 ? n2(row[I.credit]) : 0;
      // fragment corruption check: raw debit/credit strings me split-number pattern
      const rawD = I.debit >= 0 ? String(row[I.debit] ?? "").trim() : "";
      const rawC = I.credit >= 0 ? String(row[I.credit] ?? "").trim() : "";
      if (/^\d+$/.test(rawD) || /^\d+$/.test(rawC)) fragFlag++;
      const vendor = vendorOf(row);
      const linked = links.find((l: any) => l.vendorCode === vendor);
      if (origin === "PC") {
        // A/P Credit Memo = customer-rejection return (amount positive store karo)
        const amt = Math.abs(credit || debit) || Math.abs(debit - credit);
        if (!amt) continue;
        pcCount++;
        purchases.push({
          entity: linked ? linked.entity : entity, channel: "purchase-invoice",
          month: saneMonth(m) ? m : "", date: dateS,
          docNo: trans, reason: I.details >= 0 ? String(row[I.details] ?? "") : "",
          partyCode: linked ? linked.customerCode : "", partyName: linked ? linked.customerName || linked.customerCode : "",
          vendorCode: vendor, amount: amt, docType: "credit-memo",
          src: srcTag,
        });
      } else if (origin === "PD") {
        const amt = Math.abs(debit || credit);
        if (!amt) continue;
        pdCount++;
        purchases.push({
          entity: linked ? linked.entity : entity, channel: "purchase-invoice",
          month: saneMonth(m) ? m : "", date: dateS,
          docNo: trans, reason: I.details >= 0 ? String(row[I.details] ?? "") : "",
          partyCode: linked ? linked.customerCode : "", partyName: "",
          vendorCode: vendor, amount: amt, docType: "grpo",
          src: srcTag,
        });
      }
    }
    console.log(`[MIS-loader] ${srcTag}: PC(credit-memo)=${pcCount}, PD(GRPO)=${pdCount}, skipped-from-${uptoMonth}: ${skipCount}, frag-flags: ${fragFlag}`);
  }
  for (const fc of CFG.fgPurchaseCsv?.files || []) {
    parseFgPurchaseCsv(fc.file, fc.entity || "SAKAR", fc.uptoMonth || "", fc.file.split(/[\\/]/).pop() || "");
  }

  // ---------- TB (year-wise workbooks) ----------
  const monthNames = ["April","May","June","July","August","September","October","November","December","January","February","March"];
  for (const yw of CFG.tbWorkbooks.years) {
    for (const entity of ["SAKAR", "SVN"]) {
      const filePath = yw[entity.toLowerCase()];
      const sheetName = yw[entity.toLowerCase() + "TbSheet"];
      if (!filePath || !fs.existsSync(filePath)) { console.warn(`[MIS-loader] TB missing for ${entity} ${yw.year}: ${filePath}`); continue; }
      const wb = read(filePath, { type: "file", cellFormula: false });
      const ws = wb.Sheets[sheetName];
      if (!ws) { console.warn(`[MIS-loader] TB sheet missing: ${sheetName}`); continue; }
      const L = CFG.tbLayout[entity];
      const fy = yw.year;
      const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
      for (let r = L.dataStartRow; r <= last; r++) {
        const code = col(ws, L.code, r);
        const name = col(ws, L.name, r);
        if (code == null && name == null) continue;
        const codeS = String(code ?? ""), nameS = String(name ?? "");
        if (!codeS && !nameS) continue;

        // PL/BS group: user mapping first, then TB's own grouping columns
        const m = mappings.find((x: any) => x.ledger === codeS || x.ledger === nameS);
        const tbGroupPL = String(col(ws, L.groupPL, r) ?? "");
        let tbGroupBS = "";
        if (L.groupBS) tbGroupBS = String(col(ws, L.groupBS, r) ?? "");
        if (!tbGroupBS && L.groupType) tbGroupBS = String(col(ws, L.groupType, r) ?? "");
        let groupPL = "", groupBS = "";
        if (m) {
          if (m.statement === "PL") groupPL = m.group; else groupBS = m.group;
        } else {
          groupPL = tbGroupPL;
          groupBS = tbGroupBS;
        }
        const monthly: Record<string, number> = {};
        for (let mi = 0; mi < L.monthsCount; mi++) {
          monthly[monthNames[mi]] = toNum(col(ws, nextCol(L.monthsStart, mi), r));
        }
        tb.push({
          fy, entity, code: codeS, name: nameS,
          groupPL, groupBS,
          tbGroupPL, tbGroupBS,
          mapped: !!m, mappingSource: m ? "user" : "tb-column",
          ob: toNum(col(ws, L.ob, r)),
          monthly,
          total: toNum(col(ws, L.total, r)),
        });
      }
    }
  }

  // ---------- TB REVIEW GATE (upload -> validate -> user OK -> accept) ----------
  // Har TB-load par validation chalti hai: tb-review.json me issues likhe jaate hain.
  // User UI me issues dekhkar OK karta hai (AI explanation bhi mang sakta hai),
  // Accept ke baad hi reports "current" maani jaati hain.
  let prevStore: any = null;
  try { prevStore = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "mis-store.json"), "utf-8")); } catch {}
  function validateTB(tbRows: Row[], prev: any): any[] {
    const issues: any[] = [];
    const add = (severity: string, entity: string, code: string, ledger: string, check: string, detail: string, current: any, previous: any) =>
      issues.push({ id: issues.length + 1, severity, entity, code, ledger, check, detail, current, previous, status: "open" });
    const prevKey = new Map<string, Row>();
    for (const p of (prev?.tb || []) as Row[]) prevKey.set(`${p.fy}|${p.entity}|${p.code}`, p);
    const calMonths = ["April","May","June","July","August","September","October","November","December","January","February","March"];
    const entities = [...new Set(tbRows.map((r: Row) => r.entity))];
    const inr = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
    for (const ent of entities) {
      // CURRENT FY ki rows par hi review chalta hai — history (purane FY) final ho chuki hai,
      // unme actionable error/suggestion nahi dikhate (user: previous FY me kuch nahi kar sakte).
      const rows = tbRows.filter((r: Row) => r.entity === ent && !r.history);
      if (!rows.length) continue;
      const fy = rows[0]?.fy || "";
      const months = Object.keys(rows[0]?.monthly || {});

      // CHECK 1: Trial-balance — har month me debit-credit net ≈ 0 hona chahiye
      for (const mn of ["OB", ...months]) {
        let net = 0, cnt = 0;
        for (const r of rows) { const v = mn === "OB" ? r.ob : r.monthly[mn] || 0; if (v) cnt++; net += v; }
        if (Math.abs(net) > 1000)
          add("error", ent, "", "ALL LEDGERS", "Trial-Balance",
            `${mn === "OB" ? "Opening" : mn} me debit-credit ka farak ${inr(net)} hai (${cnt} ledgers) — TB balanced nahi hai. SAP dump ya sheet-total check karo.`, net, null);
      }

      // CHECK 2: Continuity — pichli load se OB / FY-total badla?
      for (const r of rows) {
        const p = prevKey.get(`${fy}|${ent}|${r.code}`);
        if (!p) {
          if (r.total !== 0 || r.ob !== 0)
            add("info", ent, r.code, r.name, "New-Ledger", `TB me naya ledger aaya hai (total ${inr(r.total)}) — group-mapping confirm karo (PL/BS).`, r.total, null);
          continue;
        }
        const obDiff = r.ob - (p.ob || 0);
        if (Math.abs(obDiff) > 1)
          add("warning", ent, r.code, r.name, "Opening-Change", `Opening balance pichhli load se ${inr(obDiff)} badla hai — prior-period adjustment ya galti?`, r.ob, p.ob);
        const totDiff = r.total - (p.total || 0);
        if (Math.abs(totDiff) > Math.max(1000, Math.abs(p.total || 0) * 0.0001))
          add("warning", ent, r.code, r.name, "Total-Change", `FY-total pichhli load se ${inr(totDiff)} badla hai.`, r.total, p.total);
      }

      // CHECK 3: Spike — latest month ka amount pichle 3 months ke average se 3x+ bada?
      const latest = [...months].reverse().find((mn) => rows.some((r: Row) => Math.abs(r.monthly[mn] || 0) > 1));
      if (latest) {
        const li = months.indexOf(latest);
        const prior = months.slice(Math.max(0, li - 3), li);
        for (const r of rows) {
          const cur = Math.abs(r.monthly[latest] || 0);
          if (!cur) continue;
          const avg = prior.length ? prior.reduce((s, mn) => s + Math.abs(r.monthly[mn] || 0), 0) / prior.length : 0;
          if (avg > 0 && cur > avg * 3 && cur > 50000)
            add("warning", ent, r.code, r.name, "Spike", `${latest} me ${inr(cur)} — pichle ${prior.length} months ke average ${inr(avg)} se ${Math.round(cur / avg)}x zyada. One-time item ya wrong posting?`, cur, avg);
        }
      }

      // CHECK 4: Unmapped ledgers with movement — PL/BS me nahi aayenge
      for (const r of rows) {
        if (!r.mapped && !r.groupPL && !r.groupBS && r.total)
          add("warning", ent, r.code, r.name, "Unmapped", `Kisi PL/BS group me map nahi hai (total ${inr(r.total)}) — reports me nahi dikhega. Ledger Mapping me add karo.`, r.total, null);
      }

      // CHECK 5: Future months me data (posting-date galti)
      const fyStartYear = Number(fy.slice(3, 7));
      const now = new Date();
      const curMonthIdx = (now.getUTCFullYear() - fyStartYear) * 12 + (now.getUTCMonth() + 1 - 4);
      for (let mi = 0; mi < 12; mi++) {
        if (mi <= curMonthIdx) continue;
        const mn = calMonths[mi];
        for (const r of rows) {
          const v = r.monthly[mn] || 0;
          if (Math.abs(v) > 1)
            add("error", ent, r.code, r.name, "Future-Month", `${mn} (FY-26-27 ka future month) me ${inr(v)} ka data hai — posting-date galti lagti hai.`, v, null);
        }
      }

      // CHECK 6: OB-monthly-total mismatch (sheet ke Total column ka cross-check)
      for (const r of rows) {
        const calc = r.ob + months.reduce((s, mn) => s + (r.monthly[mn] || 0), 0);
        if (Math.abs(calc - (r.total || 0)) > Math.max(10, Math.abs(r.total || 0) * 0.001))
          add("warning", ent, r.code, r.name, "Sum-Mismatch", `OB + months = ${inr(calc)} par sheet-Total ${inr(r.total)} — column misalignment ya update miss.`, r.total, calc);
      }
    }
    return issues;
  }
  const tbReview = validateTB(tb, prevStore);
  const rvE = tbReview.filter((i) => i.severity === "error").length;
  const rvW = tbReview.filter((i) => i.severity === "warning").length;
  const rvI = tbReview.filter((i) => i.severity === "info").length;
  console.log(`[MIS-loader] TB-review: ${rvE} errors, ${rvW} warnings, ${rvI} infos`);

  // ---------- TB HISTORY CSVs (SAP B1 42-col export, UTF-16) - purane FY ka TB ----------
  // Columns: Code|Name|Total-OB|Total-Dr|Total-Cr|Total-Bal + 12x{Month-Dr|Month-Cr|Month-Bal}
  // Numbers CROSS-CELL toote hote hain ("21"+"948"+"010.76" = 21,948,010.76) - row-wide merge
  // 42-column schema ke against karte hain. Hierarchical dump: group-rows (non-numeric code)
  // sirf hierarchy ke liye, LEDGER rows (9-digit code) hi store hote hain. Month-Bal = monthly
  // movement (OB + Sigma-movements = Total-Bal se verified).
  function parseTbCsv(p: string, entity: string, fy: string, srcTag: string): void {
    if (!fs.existsSync(p)) { console.warn(`[MIS-loader] TB CSV not found: ${p}`); return; }
    const buf = fs.readFileSync(p);
    const text = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.slice(2).toString("utf16le") : buf.toString("utf16le");
    const rows = parseCsvText(text);
    const data = rows.filter(r => r.some(c => c.trim() !== ""));
    if (data.length < 2) { console.warn(`[MIS-loader] TB CSV empty: ${srcTag}`); return; }
    const H = data[0].map(h => h.trim().toLowerCase());
    const codeI = 0, nameI = 1;
    const isNum = (s: string) => /^-?[\d,]+(\.\d+)?$/.test(s.trim());
    // SAP negative-prefix: "'-111" = -111 (sign PRESERVE hota hai, strip nahi)
    const clean = (s: string) => s.trim().replace(/^'-/, "-");
    // numeric-value reconstruction: walk cells, merge integer+decimal continuation pairs
    function rebuild(row: string[], startCol: number): number[] {
      const cells = row.slice(startCol).map(clean);
      const out: number[] = [];
      let acc = "";
      for (const c of cells) {
        const v = c.trim();
        if (v === "") continue; // empty cell = value ho chuka / zero
        if (acc === "") acc = v;
        else if (isNum(acc) && /^\d+$/.test(acc) && isNum(v)) acc = acc + v; // fragment continue
        else { out.push(parseFloat(acc.replace(/,/g, "")) || 0); acc = v; }
      }
      if (acc !== "") out.push(parseFloat(acc.replace(/,/g, "")) || 0);
      return out;
    }
    const calMonths = ["April","May","June","July","August","September","October","November","December","January","February","March"];
    let parseWarn = 0;
    const TOP_LEVELS: Record<string, "PL" | "BS"> = { "asset": "BS", "liability": "BS", "equity": "BS", "revenue": "PL", "expenditure": "PL" };
    let ledgerCount = 0, groupCount = 0;
    // SAP hierarchy: top-level section (Asset/Liability/Equity/Revenue/Expenditure) track karo
    // + immediate group-name. PL/BS classification isi se auto hoti hai.
    const groups: string[] = [];
    let section: "PL" | "BS" = "BS";
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const code = String(row[codeI] ?? "").trim();
      const name = String(row[nameI] ?? "").trim();
      if (/^total$/i.test(code)) break;
      if (!code) continue;
      if (/^\d{6,}$/.test(code)) {
        // LEDGER row - ORDER-BASED value parse: merge integer-fragments jab tak decimal-wala
        // fragment na mile (SAP har value ke end me .xx deta hai). Empty cell = zero-slot.
        // 40 slots: OB|Dr|Cr|Bal + 12x[Dr|Cr|Bal]
        const cells = row.slice(2).map(clean); // FULL row - fragments se rows 42-col se lambi hoti hain
        const vals: number[] = [];
        let acc = "";
        for (let ci = 0; ci < cells.length; ci++) {
          const v = cells[ci].trim();
          if (v === "") { if (acc) { vals.push(parseFloat(acc.replace(/,/g, "")) || 0); acc = ""; } vals.push(0); continue; }
          if (acc === "") acc = v;
          else if (!acc.includes(".") && isNum(v)) acc = acc + v; // fragment continue
          else { vals.push(parseFloat(acc.replace(/,/g, "")) || 0); acc = v; }
          if (acc.includes(".")) { vals.push(parseFloat(acc.replace(/,/g, "")) || 0); acc = ""; }
        }
        if (acc) vals.push(parseFloat(acc.replace(/,/g, "")) || 0);
        const slot = (i: number) => vals[i] || 0;
        const ob = slot(0);
        const total = slot(3);
        const monthly: Record<string, number> = {};
        for (let mIdx = 0; mIdx < 12; mIdx++) monthly[calMonths[mIdx]] = slot(4 + 3 * mIdx + 2); // month-BAL = movement
        // sanity: OB + Σmovements ≈ Total (fragment-parse drift check)
        const calc = ob + calMonths.reduce((s, mn) => s + (monthly[mn] || 0), 0);
        if (Math.abs(calc - total) > Math.max(10, Math.abs(total) * 0.001)) parseWarn++;
        const grp = groups[groups.length - 1] || "";
        // PL accounts: revenue/expense ka OB = PURANE SAALON ka cumulative (SAP ledger balance).
        // History-PL me FY-figures sirf movements se: ob=0, total=Σmonthly (BS me OB genuine FY-opening hai).
        let obOut = ob, totalOut = total;
        if (section === "PL") { obOut = 0; totalOut = calMonths.reduce((s, mn) => s + (monthly[mn] || 0), 0); }
        tb.push({
          fy, entity, code, name,
          groupPL: section === "PL" ? grp : "", groupBS: section === "PL" ? "" : grp,
          tbGroupPL: "", tbGroupBS: grp,
          mapped: false, mappingSource: "tb-column",
          ob: obOut, monthly, total: totalOut, src: srcTag, history: true,
        });
        ledgerCount++;
      } else {
        // GROUP row (Asset, Fixed Assets, ...) - hierarchy context + count
        const tl = TOP_LEVELS[code.toLowerCase()];
        if (tl) section = tl;
        groups.push(code);
        groupCount++;
      }
    }
    console.log(`[MIS-loader] ${srcTag}: ${ledgerCount} ledgers, ${groupCount} group-rows (history TB), parse-drift: ${parseWarn}`);
  }
  for (const hc of CFG.tbHistoryCsv?.files || []) {
    parseTbCsv(hc.file, hc.entity || "SAKAR", hc.fy, hc.file.split(/[\\/]/).pop() || "");
  }

  // ---------- STOCK (monthly uploads from uploads/stock) ----------
  // Do format support: (1) app-template, (2) SAP B1 query-report export (header me "Item No." + "Warehouse Code")
  // SAP file ka naam me month hona chahiye (jaise STOCK-Apr-2026.xlsx) - warna skip + warning
  const MONTH_CAL = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fileMonthYm(name: string): string | null {
    const m = name.toLowerCase();
    const names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let mi = -1;
    for (let i = 0; i < 12; i++) if (m.includes(names[i])) { mi = i; break; }
    if (mi === -1) return null;
    let year: number | null = null;
    const y4 = m.match(/(20\d\d)/); if (y4) year = Number(y4[1]);
    if (year == null) { const fy = m.match(/fy[-_\s]?(\d\d)/); if (fy) year = 2000 + Number(fy[1]); }
    if (year == null) { const d = new Date(); year = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1; if (mi + 1 < 4) year += 1; }
    return `${year}-${String(mi + 1).padStart(2, "0")}`;
  }
  const stock: Row[] = [];
  const sCfg = CFG.stockUploads;
  if (fs.existsSync(sCfg.dir)) {
    for (const f of fs.readdirSync(sCfg.dir).filter((x) => /\.xlsx?$/i.test(x))) {
      try {
        const wb = read(path.join(sCfg.dir, f), { type: "file" });
        for (const sn of wb.SheetNames) {
          const ws = wb.Sheets[sn];
          // --- SAP B1 format sniff (header row) ---
          const hdr: string[] = [];
          for (let c = 0; c < 26; c++) hdr.push(String(col(ws, String.fromCharCode(65 + c), 1) ?? "").toLowerCase().trim());
          const findHdr = (kw: string[]) => hdr.findIndex((h) => kw.some((k) => h.includes(k)));
          const hItem = findHdr(["item no"]), hWh = findHdr(["warehouse code", "warehouse"]);
          const isSap = hItem >= 0 && hWh >= 0;
          if (isSap) {
            const ym = fileMonthYm(f) || fileMonthYm(sn);
            if (!ym) { console.warn(`[MIS-loader] SAP stock file "${f}" skip: filename me month nahi (STOCK-Apr-2026.xlsx jaisa naam rakho)`); continue; }
            const fy = fyOf(ym);
            const mnShort = MONTH_CAL[Number(ym.slice(5, 7))];
            const comp = /svn/i.test(f + sn) ? "SVN" : String(sCfg.sapDefaultCompany || "SAKAR").toUpperCase();
            const hDesc = findHdr(["item description"]), hCat = findHdr(["item category"]), hGrp = findHdr(["group name"]);
            const hStore = findHdr(["store name"]);
            const hOpQ = findHdr(["opening qty"]), hInQ = findHdr(["inward qty"]), hOutQ = findHdr(["outward qty"]);
            const hClQ = findHdr(["closing qty"]), hClV = findHdr(["closing value"]);
            const L = (i: number) => String.fromCharCode(65 + i);
            const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
            for (let r = 2; r <= last; r++) {
              const item = col(ws, L(hItem), r);
              if (item == null || String(item).trim() === "") continue;
              const storeName = String(hStore >= 0 ? (col(ws, L(hStore), r) ?? "") : "");
              const outQ = toNum(hOutQ >= 0 ? col(ws, L(hOutQ), r) : 0);
              const deadWh = /dead/i.test(storeName);
              const nmWh = /non.?moving|slow/i.test(storeName) && !deadWh;
              stock.push({
                srcFile: f, company: comp, fy, month: mnShort,
                itemNo: String(item).trim(),
                itemDesc: String(hDesc >= 0 ? (col(ws, L(hDesc), r) ?? "") : ""),
                itemCategory: String(hCat >= 0 ? (col(ws, L(hCat), r) ?? "") : ""),
                itemGroup: String(hGrp >= 0 ? (col(ws, L(hGrp), r) ?? "") : ""),
                warehouseCode: String(col(ws, L(hWh), r) ?? ""), storeName,
                openingQty: toNum(hOpQ >= 0 ? col(ws, L(hOpQ), r) : 0),
                producedQty: toNum(hInQ >= 0 ? col(ws, L(hInQ), r) : 0),
                soldQty: outQ,
                closingQty: toNum(hClQ >= 0 ? col(ws, L(hClQ), r) : 0),
                closingValue: toNum(hClV >= 0 ? col(ws, L(hClV), r) : 0),
                lastSaleMonth: outQ > 0 ? mnShort : "",
                deadWhQty: deadWh ? toNum(hClQ >= 0 ? col(ws, L(hClQ), r) : 0) : 0,
                nonMovingWhQty: nmWh ? toNum(hClQ >= 0 ? col(ws, L(hClQ), r) : 0) : 0,
              });
            }
            continue;
          }
          // --- app-template format (original) ---
          const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
          for (let r = 2; r <= last; r++) {
            const item = col(ws, "D", r);
            if (item == null || String(item).trim() === "") continue;
            // Row format: Company|FY|Month|ItemNo|ItemDesc|ItemGroup|OpeningQty|ProducedQty|SoldQty|ClosingQty|ClosingValue|LastSaleMonth|LastSaleDate
            stock.push({
              srcFile: f,
              company: String(col(ws, "A", r) ?? sn).trim().toUpperCase(),
              fy: String(col(ws, "B", r) ?? "").trim(),
              month: String(col(ws, "C", r) ?? "").trim(),
              itemNo: String(item).trim(),
              itemDesc: String(col(ws, "E", r) ?? ""),
              itemGroup: String(col(ws, "F", r) ?? ""),
              openingQty: toNum(col(ws, "G", r)),
              producedQty: toNum(col(ws, "H", r)),
              soldQty: toNum(col(ws, "I", r)),
              closingQty: toNum(col(ws, "J", r)),
              closingValue: toNum(col(ws, "K", r)),
              lastSaleMonth: String(col(ws, "L", r) ?? ""),
              lastSaleDate: excelDate(col(ws, "M", r)),
            });
          }
        }
      } catch (e: any) { console.warn(`[MIS-loader] stock file skip ${f}: ${e.message}`); }
    }
  }

  // ---------- LOANS (uploads/loans) ----------
  const loans: Row[] = [];
  const lCfg = CFG.loanUploads;
  if (fs.existsSync(lCfg.dir)) {
    for (const f of fs.readdirSync(lCfg.dir).filter((x) => /\.xlsx?$/i.test(x))) {
      try {
        const wb = read(path.join(lCfg.dir, f), { type: "file" });
        for (const sn of wb.SheetNames) {
          const ws = wb.Sheets[sn];
          const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
          for (let r = 2; r <= last; r++) {
            const loan = col(ws, "D", r);
            if (loan == null || String(loan).trim() === "") continue;
            // Schedule format: Company|FY|Month|LoanName|Lender|OpeningBal|PrincipalPaid|InterestPaid|ClosingBal
            loans.push({
              srcFile: f,
              company: String(col(ws, "A", r) ?? "").trim().toUpperCase(),
              fy: String(col(ws, "B", r) ?? "").trim(),
              month: String(col(ws, "C", r) ?? "").trim(),
              loanName: String(loan).trim(),
              lender: String(col(ws, "E", r) ?? ""),
              openingBalance: toNum(col(ws, "F", r)),
              principal: toNum(col(ws, "G", r)),
              interest: toNum(col(ws, "H", r)),
              closingBalance: toNum(col(ws, "I", r)),
            });
          }
        }
      } catch (e: any) { console.warn(`[MIS-loader] loan file skip ${f}: ${e.message}`); }
    }
  }

  // ---------- LOANS from workbook sheets (Loan-SVN style: D/H/L/P/T triplets) ----------
  for (const [entity, sheetName] of Object.entries(CFG.loanSheets || {})) {
    if (entity.startsWith("$")) continue; // $comment skip
    const loanWb = read(CFG.salesWorkbook.path, { type: "file" });
    const ws = loanWb.Sheets[sheetName as string];
    if (!ws) { console.warn(`[MIS-loader] loan sheet missing: ${sheetName}`); continue; }
    const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
    // loan-names row 2 se: har block start-col par
    const startCols = ["D", "H", "L", "P", "T", "X", "AB", "AF", "AJ", "AN"];
    const loanBlocks: { name: string; tot: string; pri: string; int: string }[] = [];
    for (const sc of startCols) {
      const nm = col(ws, sc, 2);
      if (nm == null || String(nm).trim() === "") continue;
      // us block me Principle/Interest cols confirm karo (row 3)
      const tCol = sc, pCol = nextCol(sc, 1), iCol = nextCol(sc, 2);
      const pl = String(col(ws, pCol, 3) ?? "").toLowerCase();
      const il = String(col(ws, iCol, 3) ?? "").toLowerCase();
      if (pl.includes("princ") && il.includes("int")) {
        loanBlocks.push({ name: String(nm).trim(), tot: tCol, pri: pCol, int: iCol });
      }
    }
    console.log(`[MIS-loader] ${sheetName}: ${loanBlocks.length} loan blocks: ${loanBlocks.map(b => b.name).join("; ")}`);
    for (let r = 4; r <= last; r++) {
      const fy = col(ws, "A", r);
      const mon = col(ws, "B", r);
      if (fy == null || mon == null) continue;
      const fyS = String(fy).trim();
      const moS = String(mon).trim();
      const fyFull = fyS.match(/^(\d{2})-(\d{2})$/)
        ? `FY-20${fyS.slice(0, 2)}-${fyS.slice(3, 5)}`
        : fyS;
      for (const lb of loanBlocks) {
        const tot = toNum(col(ws, lb.tot, r));
        const pri = toNum(col(ws, lb.pri, r));
        const int = toNum(col(ws, lb.int, r));
        if (tot === 0 && pri === 0 && int === 0) continue;
        loans.push({
          srcFile: sheetName, company: entity, fy: fyFull, month: moS,
          loanName: lb.name, lender: lb.name.split(/\s+/)[0],
          principal: pri, interest: int,
          openingBalance: 0, closingBalance: 0, // schedule-sheet me balance nahi hota - repayment se aayega
        });
      }
    }
  }

  // ---------- SVN Loan RPS file (Term Loan + Car Loan + Summary-only loans) ----------
  const RPS = CFG.svnLoanRps;
  if (RPS && fs.existsSync(RPS.file)) {
    try {
      const rw = read(RPS.file, { type: "file" });
      const monthFromDate = (v: any): string => {
        const d = typeof v === "number"
          ? new Date(Date.UTC(1899, 11, 30) as any).getTime() + v * 86400000
          : new Date(v).getTime();
        if (!isFinite(d)) return String(v ?? "");
        const dt = new Date(d);
        return ["January","February","March","April","May","June","July","August","September","October","November","December"][dt.getUTCMonth()];
      };
      const fyFromDate = (v: any): string => {
        const d = typeof v === "number"
          ? new Date(Date.UTC(1899, 11, 30) as any).getTime() + v * 86400000
          : new Date(v).getTime();
        if (!isFinite(d)) return "";
        const dt = new Date(d);
        const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1;
        const sy = m >= 4 ? y : y - 1;
        return `FY-${sy}-${String((sy + 1) % 100).padStart(2, "0")}`;
      };
      const parseTripletSheet = (sn: string, defCompany: string) => {
        const w = rw.Sheets[sn];
        if (!w) { console.warn(`[MIS-loader] RPS sheet missing: ${sn}`); return; }
        const lastR = Number((w["!ref"] as string).split(":")[1].replace(/\D/g, ""));
        const blocks: { name: string; tot: string; pri: string; int: string }[] = [];
        for (let c = 0; c < 30; c++) {
          const L = utils.encode_col(c);
          const nm = w[L + "2"]?.v;
          if (nm == null || String(nm).trim() === "") continue;
          const pL = utils.encode_col(c + 1), iL = utils.encode_col(c + 2);
          const p3 = String(w[pL + "3"]?.v ?? "").toLowerCase();
          const i3 = String(w[iL + "3"]?.v ?? "").toLowerCase();
          if (p3.includes("princ") && i3.includes("int")) blocks.push({ name: String(nm).trim(), tot: L, pri: pL, int: iL });
        }
        console.log(`[MIS-loader] RPS ${sn}: ${blocks.length} blocks`);
        for (let r = 4; r <= lastR; r++) {
          const b = w["B" + r]?.v;
          if (b == null) continue;
          const mo = monthFromDate(b);
          const fy = fyFromDate(b);
          for (const lb of blocks) {
            const tot = toNum(w[lb.tot + r]?.v);
            const pri = toNum(w[lb.pri + r]?.v);
            const int = toNum(w[lb.int + r]?.v);
            if (tot === 0 && pri === 0 && int === 0) continue;
            loans.push({
              srcFile: `RPS:${sn}`, company: defCompany, fy, month: mo,
              loanName: lb.name, lender: lb.name.split(/\s+/)[0],
              principal: pri, interest: int, openingBalance: 0, closingBalance: 0,
            });
          }
        }
      };
      parseTripletSheet(RPS.sheets.termLoan, "SVN");
      parseTripletSheet(RPS.sheets.carLoan, "SVN");
      // Summary-only loans (no P/I split sheet yet): EMI as monthly debt-service placeholder, split 60/40 P/I est.
      for (const sl of RPS.summaryLoans || []) {
        if (!sl.emiAmount) continue;
        loans.push({
          srcFile: "RPS:LoanSummery", company: "SVN", fy: "FY-2026-27", month: "August",
          loanName: sl.loanName, lender: sl.loanName.split(/\s+/)[0],
          principal: Math.round(sl.emiAmount * 0.6), interest: Math.round(sl.emiAmount * 0.4),
          openingBalance: 0, closingBalance: sl.balance || 0,
          summaryOnly: true, sanctionAmount: sl.sanctionAmount,
        });
      }
      console.log(`[MIS-loader] SVN RPS done. loans total so far: ${loans.length}`);
    } catch (e: any) { console.warn(`[MIS-loader] SVN RPS skip: ${e.message}`); }
  }

  // ---------- PAYMENTS (uploads/payments) ----------
  const payments: Row[] = [];
  const payDir = path.join(DATA_DIR, "uploads", "payments");
  if (fs.existsSync(payDir)) {
    for (const f of fs.readdirSync(payDir).filter((x) => /\.xlsx?$/i.test(x))) {
      try {
        const wb = read(path.join(payDir, f), { type: "file" });
        for (const sn of wb.SheetNames) {
          const ws = wb.Sheets[sn];
          const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
          for (let r = 2; r <= last; r++) {
            const code = col(ws, "D", r);
            if (code == null || String(code).trim() === "") continue;
            // Row format: Company|FY|Month|CustomerCode|CustomerName|Amount|Date|Reference
            payments.push({
              srcFile: f,
              company: String(col(ws, "A", r) ?? "").trim().toUpperCase(),
              fy: String(col(ws, "B", r) ?? "").trim(),
              month: String(col(ws, "C", r) ?? "").trim(),
              customerCode: String(code).trim(),
              customerName: String(col(ws, "E", r) ?? ""),
              amount: toNum(col(ws, "F", r)),
              date: excelDate(col(ws, "G", r)) || String(col(ws, "G", r) ?? ""),
              reference: String(col(ws, "H", r) ?? ""),
            });
          }
        }
      } catch (e: any) { console.warn(`[MIS-loader] payments file skip ${f}: ${e.message}`); }
    }
  }

  // ---------- CUSTOMER MASTER (group-level party links) ----------
  // JSON master + uploads me daali gayi Excel (CUSTOMER-MASTER.xlsx) dono merge hote hain
  let custMaster: any = { customers: [] };
  const cmPath = path.join(DATA_DIR, "customer-master.json");
  if (fs.existsSync(cmPath)) {
    try { custMaster = JSON.parse(fs.readFileSync(cmPath, "utf-8")); } catch {}
  }
  const cmUpDir = path.join(DATA_DIR, "uploads");
  if (fs.existsSync(cmUpDir)) {
    for (const f of fs.readdirSync(cmUpDir).filter((x) => /^customer[-_ ]?master.*\.xlsx?$/i.test(x))) {
      try {
        const wb = read(path.join(cmUpDir, f), { type: "file" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rowsA = utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let merged = 0;
        for (const r of rowsA.slice(1)) {
          const grp = String(r[0] ?? "").trim(), name = String(r[1] ?? "").trim();
          const entity = String(r[2] ?? "").trim().toUpperCase();
          const custCode = String(r[3] ?? "").trim();
          const vendCode = String(r[4] ?? "").trim();
          if (!grp || !entity || (!custCode && !vendCode)) continue;
          let p = custMaster.customers.find((x: any) => String(x.group || x.name).toLowerCase() === grp.toLowerCase());
          if (!p) { p = { group: grp, name: name || grp, autoDetected: false, links: [] }; custMaster.customers.push(p); merged++; }
          const dup = (p.links || []).some((l: any) => l.entity === entity && l.customerCode === custCode && l.vendorCode === vendCode);
          if (!dup) { (p.links = p.links || []).push({ entity, customerCode: custCode, vendorCode: vendCode || undefined }); merged++; }
        }
        if (merged) console.log(`[MIS-loader] customer-master Excel merge: ${f} (+${merged} links)`);
      } catch (e: any) { console.warn(`[MIS-loader] customer-master Excel skip ${f}: ${e.message}`); }
    }
  }
  // code -> groupPartyName lookup (dono entity ke codes ek hi party se jude)
  const codeToParty = new Map<string, string>();
  for (const p of custMaster.customers || []) {
    for (const l of p.links || []) {
      if (l.customerCode) codeToParty.set(`${l.entity}|${l.customerCode}`, p.name || p.group);
      if (l.vendorCode) codeToParty.set(`V|${l.vendorCode}`, p.name || p.group);
    }
  }
  // enrich sales + rejections with groupParty
  for (const r of sales) r.groupParty = codeToParty.get(`${r.entity}|${r.customerCode}`) || "";
  for (const r of rejections) r.groupParty = codeToParty.get(`${r.entity}|${r.partyCode}`) || codeToParty.get(`V|${r.vendorCode}`) || "";

  // ---------- BUDGET (uploads/budget) ----------
  const budget: Row[] = [];
  const budDir = path.join(DATA_DIR, "uploads", "budget");
  if (fs.existsSync(budDir)) {
    for (const f of fs.readdirSync(budDir).filter((x) => /\.xlsx?$/i.test(x))) {
      try {
        const wb = read(path.join(budDir, f), { type: "file" });
        for (const sn of wb.SheetNames) {
          if (/rule/i.test(sn)) continue; // Rules sheet skip
          const ws = wb.Sheets[sn];
          const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
          for (let r = 2; r <= last; r++) {
            const head = col(ws, "D", r);
            const amt = toNum(col(ws, "F", r));
            if (head == null || String(head).trim() === "" || amt === 0) continue;
            // Row format: Company|FY|Month|Head|SubUnit|Amount|Remarks
            budget.push({
              srcFile: f,
              company: String(col(ws, "A", r) ?? "").trim().toUpperCase(),
              fy: String(col(ws, "B", r) ?? "").trim(),
              month: String(col(ws, "C", r) ?? "").trim(),
              head: String(head).trim(),
              subUnit: String(col(ws, "E", r) ?? "").trim(),
              amount: amt,
              remarks: String(col(ws, "G", r) ?? ""),
            });
          }
        }
      } catch (e: any) { console.warn(`[MIS-loader] budget file skip ${f}: ${e.message}`); }
    }
  }

  // ---------- NEW PL STATEMENT (user ki official monthly PL — New PL sheet) ----------
  // Structure (FY summary workbook, sheet "New PL"):
  //   R1: labels — col1="P & L Statement", col2="SAKAR", col17="SVN" (two side-by-side blocks)
  //   R2: month serials (col2-13 = SAKAR Apr..Mar, col17-28 = SVN Apr..Mar)
  //   rows by label in col1 ("Sales", "Total of Sales | Operational Revenue", ...)
  // Parse monthly Operational Revenue per company per FY = app ke Sales/Revenue figures ka source.
  const stmtPL: Row[] = [];
  const MON = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
  for (const sf of (CFG.stmtPLFiles?.files as any[]) || []) {
    try {
      if (!fs.existsSync(sf.file)) { console.warn(`[MIS-loader] stmtPL file not found: ${sf.file}`); continue; }
      const wb = read(sf.file, { type: "file" });
      const ws = wb.Sheets[sf.sheet || "New PL"];
      if (!ws) { console.warn(`[MIS-loader] stmtPL sheet missing in ${sf.file}`); continue; }
      const rows = utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (!rows.length) continue;
      // company block start-col: SAKAR at the col where header cell ~ "SAKAR", SVN ~ "SVN"
      const hdr = rows[0] || [];
      const colOf = (label: string) => hdr.findIndex((h: any) => /sakar|svn/i.test(String(h ?? "")) && new RegExp(label, "i").test(String(h)));
      const sakarCol = colOf("sakar");
      const svnCol = colOf("svn");
      const monthRow = rows[1] || [];
      const serToYm = (v: any): string | null => {
        const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
        if (!isFinite(n) || n < 40000 || n > 70000) return null;
        const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 7);
      };
      const blockMonths = (start: number): string[] => {
        const out: string[] = [];
        for (let c = start; c < start + 12; c++) {
          const ym = serToYm(monthRow[c]);
          out.push(ym || "");
        }
        return out;
      };
      // find rows: label in col1 (or col0); "Sales"=pure item sales, "Total of Sales|Operational Revenue"=op revenue
      const labelOf = (r: any[]) => String(r?.[1] ?? r?.[0] ?? "").trim();
      const opRevRow = rows.find((r) => /operational revenue|total of sales/i.test(labelOf(r)) && r.length > 3);
      const salesRow = rows.find((r) => /^sales$/i.test(labelOf(r).replace(/[^a-z ]/gi, "").trim()) && !/job|scrap|inter|return|as such/i.test(labelOf(r)) && r.length > 3);
      if (!opRevRow) { console.warn(`[MIS-loader] stmtPL opRev row nahi mili (${sf.fy}): ${sf.file}`); continue; }
      const readBlock = (start: number, entity: string) => {
        if (start < 0) return;
        const yms = blockMonths(start);
        for (let c = start; c < start + 12; c++) {
          const ym = yms[c - start];
          if (!ym) continue;
          const rev = toNum(opRevRow[c]);
          const pureSales = salesRow ? toNum(salesRow[c]) : 0;
          if (!rev && !pureSales) continue;
          stmtPL.push({ fy: sf.fy, entity, month: ym, revenue: rev, sales: pureSales, src: sf.file.split(/[\\/]/).pop() || "" });
        }
      };
      readBlock(sakarCol, "SAKAR");
      readBlock(svnCol, "SVN");
    } catch (e: any) { console.warn(`[MIS-loader] stmtPL parse err ${sf.file}: ${e.message}`); }
  }
  console.log(`[MIS-loader] stmtPL (New PL): ${stmtPL.length} month-rows`);

  const store = {
    meta: {
      generatedAt: new Date().toISOString(),
      dataDir: DATA_DIR,
      salesWorkbook: CFG.salesWorkbook.path,
      tbYears: [...new Set([
        ...(CFG.tbHistoryCsv?.files || []).map((f: any) => f.fy),
        ...CFG.tbWorkbooks.years.map((y: any) => y.year),
      ])].sort(),
      fiscalYearStartMonth: CFG.fiscalYearStartMonth,
      counts: { sales: sales.length, rejections: rejections.length, purchases: purchases.length, tb: tb.length, stock: stock.length, loans: loans.length, payments: payments.length, budget: budget.length, stmtPL: stmtPL.length },
    },
    sales, rejections, purchases, tb, stock, loans, payments, budget, stmtPL,
    ledgerMap: mappings,
    customerMaster: custMaster.customers || [],
    tbReview,
  };

  fs.writeFileSync(path.join(DATA_DIR, "mis-store.json"), JSON.stringify(store));
  fs.writeFileSync(path.join(DATA_DIR, "tb-review.json"), JSON.stringify({ generatedAt: store.meta.generatedAt, issues: tbReview }, null, 2));
  const unmapped = tb.filter((t) => !t.groupPL && !t.groupBS).length;
  console.log(`[MIS-loader] DONE. sales=${sales.length}, rejections=${rejections.length}, purchases=${purchases.length}, TB-ledgers=${tb.length} (unmapped=${unmapped}), stock=${stock.length}, loans=${loans.length}`);
  return store;
}

// column letter increment helper: "J" + 1 -> "K", "AA" + 1 -> "AB"
function nextCol(letter: string, inc: number): string {
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  n += inc;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(import.meta.url.replace(/^file:\//, "")).toLowerCase()) {
  runLoader();
}
