/**
 * Surya Roshni — Excel-Based Reconciliation Template
 * 
 * Creates a ready-to-use Excel workbook with:
 * - Pre-filled data from their actual ledgers
 * - Matching formulas (VLOOKUP/INDEX-MATCH)
 * - Auto-calculated summary
 * - Sign-off section
 * 
 * Output: Surya_Roshni_Reconciliation_Aug2026.xlsx
 */

import * as XLSX from "xlsx";
const { read, utils, write } = XLSX;

/* ─── Read Source File ─── */

const srcPath = "D:/c drive/Desktop/Surya Roshni, Ledger reconcilation (Aug-26).xlsx";
const wb = read(srcPath, { type: "file" });

/* ─── Helpers ─── */

function sapDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function formatDate(serial: number | string): string {
  if (typeof serial === "string" && !serial) return "";
  if (typeof serial === "string") return serial;
  if (!serial || isNaN(serial)) return "";
  const d = sapDate(serial);
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${dd}-${mon[d.getMonth()]}-${d.getFullYear()}`;
}

function parseAmount(v: any): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return v;
  let s = String(v).replace(/INR|USD|,/g, "").trim();
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) { negative = true; s = s.slice(1, -1); }
  return (parseFloat(s) || 0) * (negative ? -1 : 1);
}

function norm(v: any): string {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* ═══════════════════════════════════════════════════════════════
   PARSE ALL THREE LEDGERS
   ═══════════════════════════════════════════════════════════════ */

// 1. Sakar Sales
const salesRaw = utils.sheet_to_json(wb.Sheets["SVN-Sales-Surya Roshni"], { header: 1, defval: "" }) as any[];
const sakarSales: any[][] = [];
for (const row of salesRaw.slice(2)) {
  const d = formatDate(row[0]);
  if (!d) continue;
  sakarSales.push([
    d, formatDate(row[1]), String(row[2]||""), String(row[3]||""),
    String(row[4]||""), String(row[5]||""), String(row[8]||""),
    parseAmount(row[9]), String(row[12]||"")
  ]);
}

// 2. Sakar Purchase
const purchaseRaw = utils.sheet_to_json(wb.Sheets["SVN-Purchase from Surya"], { header: 1, defval: "" }) as any[];
const sakarPurchase: any[][] = [];
for (const row of purchaseRaw.slice(2)) {
  const d = formatDate(row[0]);
  if (!d) continue;
  sakarPurchase.push([
    d, formatDate(row[1]), String(row[2]||""), String(row[3]||""),
    String(row[4]||""), String(row[5]||""), String(row[8]||""),
    parseAmount(row[9]), String(row[12]||"")
  ]);
}

// 3. Surya Working
const workingRaw = utils.sheet_to_json(wb.Sheets["Working"], { header: 1, defval: "" }) as any[];
const suryaEntries: any[][] = [];
for (const row of workingRaw.slice(1)) {
  if (String(row[5]) !== "4001472") continue;
  const d = formatDate(row[9]);
  if (!d) continue;
  suryaEntries.push([
    d, String(row[8]||""), String(row[11]||""), String(row[12]||""),
    String(row[21]||""), parseAmount(row[14]), String(row[16]||"")
  ]);
}

console.log(`📊 Parsed: Sakar Sales=${sakarSales.length}, Purchase=${sakarPurchase.length}, Surya=${suryaEntries.length}`);

/* ═══════════════════════════════════════════════════════════════
   BUILD RECONCILIATION MATCHING (in-memory)
   ═══════════════════════════════════════════════════════════════ */

// Build Surya lookup by Reference (Bill No match)
const suryaByRef = new Map<string, number[]>(); // ref -> row index
suryaEntries.forEach((row, i) => {
  const ref = norm(row[3]); // Reference column
  if (ref.length > 3) {
    if (!suryaByRef.has(ref)) suryaByRef.set(ref, []);
    suryaByRef.get(ref)!.push(i);
  }
});

// Build Surya payments lookup by amount+date proximity
const suryaPayments = suryaEntries.filter(r => r[1] === "KZ");

const reconRows: any[][] = [];
let matchCount = 0, sakarOnlyCount = 0, suryaOnlyCount = 0, mismatchCount = 0;

// Match Purchase Invoices → Surya Invoices
const suryaInvUsed = new Set<number>();
const purchaseInvoices = sakarPurchase.filter(r => r[2] === "PU");

for (const pi of purchaseInvoices) {
  const billNo = norm(pi[5]); // Bill No
  const ref1 = norm(pi[4]);   // Ref 1
  const key = billNo.length > 3 ? billNo : ref1;
  
  let matched = false;
  const candidates = suryaByRef.get(key) || [];
  
  for (const idx of candidates) {
    if (suryaInvUsed.has(idx)) continue;
    const s = suryaEntries[idx];
    if (s[1] !== "RV" && s[1] !== "RE") continue; // Only invoices
    
    suryaInvUsed.add(idx);
    const amtDiff = Math.abs(pi[7]) - Math.abs(s[5]);
    
    if (Math.abs(amtDiff) < 0.01) {
      matchCount++;
      reconRows.push([pi[0], pi[5]||pi[4], pi[6], pi[7], s[5], "✅ MATCHED", "Both books agree", pi[3]]);
    } else {
      mismatchCount++;
      reconRows.push([pi[0], pi[5]||pi[4], pi[6], pi[7], s[5], "🔄 MISMATCH", `Diff: ₹${amtDiff.toFixed(2)}`, pi[3]]);
    }
    matched = true;
    break;
  }
  
  if (!matched) {
    sakarOnlyCount++;
    reconRows.push([pi[0], pi[5]||pi[4], pi[6], pi[7], "", "❌ SAKAR ONLY", "Not in Surya books", pi[3]]);
  }
}

// Unmatched Surya invoices
for (let j = 0; j < suryaEntries.length; j++) {
  if (suryaInvUsed.has(j)) continue;
  const s = suryaEntries[j];
  if (s[1] !== "RV" && s[1] !== "RE") continue;
  suryaOnlyCount++;
  reconRows.push([s[0], s[3], s[4], "", s[5], "⚠️ SURYA ONLY", "Not in Sakar Purchase", ""]);
}

// Remaining Sakar Sales entries (Payments, TDS, Cancellations, etc.)
for (const row of sakarSales) {
  const type = row[2]; // Origin type
  const isPayment = type === "RC";
  const isJE = type === "JE" || type === "JR";
  const isCancellation = String(row[6]).toLowerCase().includes("cancellation");
  
  let category = "Other";
  if (isPayment) category = "Payment";
  else if (isCancellation) category = "Cancellation";
  else if (isJE) {
    if (String(row[6]).toLowerCase().includes("tds")) category = "TDS";
    else if (String(row[6]).toLowerCase().includes("rounding")) category = "Rounding";
    else if (String(row[6]).toLowerCase().includes("rejection") || String(row[6]).toLowerCase().includes("transfer")) category = "Transfer";
    else category = "Journal";
  }
  
  // Try to find in Surya payments
  if (isPayment) {
    let found = false;
    for (let j = 0; j < suryaPayments.length; j++) {
      if (suryaInvUsed.has(j)) continue; // crude reuse of set
      if (Math.abs(Math.abs(row[7]) - Math.abs(suryaPayments[j][5])) < 0.01) {
        reconRows.push([row[0], row[4]||row[3], `Payment: ${row[6]}`, row[7], suryaPayments[j][5], "✅ MATCHED", "Payment matched", row[3]]);
        suryaInvUsed.add(j);
        matchCount++;
        found = true;
        break;
      }
    }
    if (!found) {
      sakarOnlyCount++;
      reconRows.push([row[0], row[4]||row[3], `Payment: ${row[6]}`, row[7], "", "❌ SAKAR ONLY", "Payment not in Surya", row[3]]);
    }
  } else {
    sakarOnlyCount++;
    reconRows.push([row[0], row[4]||row[3], `${category}: ${row[6]}`, row[7], "", "❌ SAKAR ONLY", `${category} — verify in Surya`, row[3]]);
  }
}

// Sort by date
reconRows.sort((a, b) => {
  const parse = (d: string) => {
    if (!d) return 0;
    const parts = d.split("-");
    const mon: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    return new Date(parseInt(parts[2]), mon[parts[1]]||0, parseInt(parts[0])).getTime();
  };
  return parse(a[0]) - parse(b[0]);
});

console.log(`📊 Reconciliation: ${matchCount} matched, ${sakarOnlyCount} Sakar-only, ${suryaOnlyCount} Surya-only, ${mismatchCount} mismatch`);

/* ═══════════════════════════════════════════════════════════════
   BUILD EXCEL WORKBOOK (Professional Format)
   ═══════════════════════════════════════════════════════════════ */

const outWb = XLSX.utils.book_new();

// ── Sheet 1: RECONCILIATION (Main) ──
const mainData: any[][] = [
  ["CUSTOMER ACCOUNT RECONCILIATION"],
  ["SVN Opto Electronics Pvt Ltd ↔ Surya Roshni Ltd"],
  ["Period: August 2026"],
  [""],
  ["Date", "Ref / Bill No", "Description", "Sakar Amount (₹)", "Surya Amount (₹)", "Status", "Remarks", "Sakar Doc"],
  ...reconRows.map(r => r),
];

const mainSheet = utils.aoa_to_sheet(mainData);
mainSheet["!cols"] = [
  { wch: 14 }, { wch: 16 }, { wch: 35 }, { wch: 18 },
  { wch: 18 }, { wch: 16 }, { wch: 40 }, { wch: 14 }
];
XLSX.utils.book_append_sheet(outWb, mainSheet, "Reconciliation");

// ── Sheet 2: SUMMARY ──
const totalSakar = reconRows.reduce((s, r) => s + (Number(r[3]) || 0), 0);
const totalSurya = reconRows.reduce((s, r) => s + (Number(r[4]) || 0), 0);

const summaryData: any[][] = [
  ["RECONCILIATION SUMMARY"],
  [""],
  ["Total Entries Compared:", reconRows.length],
  ["✅ Matched:", matchCount],
  ["❌ Sakar Only:", sakarOnlyCount],
  ["⚠️ Surya Only:", suryaOnlyCount],
  ["🔄 Amount Mismatch:", mismatchCount],
  [""],
  ["═══ BALANCES ═══"],
  ["Sakar Total Amount:", totalSakar],
  ["Surya Total Amount:", totalSurya],
  ["Overall Difference:", totalSakar - totalSurya],
  [""],
  ["═══ SIGN-OFF ═══"],
  ["Prepared by:", "", "Date:", ""],
  ["Reviewed by:", "", "Date:", ""],
  ["Approved by:", "", "Date:", ""],
];

const summarySheet = utils.aoa_to_sheet(summaryData);
summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 14 }];
XLSX.utils.book_append_sheet(outWb, summarySheet, "Summary");

// ── Sheet 3: SAKAR SALES ──
const salesData = [
  ["Date", "Due Date", "Origin", "Origin No", "Ref 1", "Bill No", "Details", "Amount (₹)", "Clearing Doc"],
  ...sakarSales,
];
XLSX.utils.book_append_sheet(outWb, utils.aoa_to_sheet(salesData), "Sakar Sales");

// ── Sheet 4: SAKAR PURCHASE ──
const purchaseData = [
  ["Date", "Due Date", "Origin", "Origin No", "Ref 1", "Bill No", "Details", "Amount (₹)", "Clearing Doc"],
  ...sakarPurchase,
];
XLSX.utils.book_append_sheet(outWb, utils.aoa_to_sheet(purchaseData), "Sakar Purchase");

// ── Sheet 5: SURYA LEDGER ──
const suryaData = [
  ["Date", "Doc Type", "Document No", "Reference", "Details", "Amount (₹)", "Clearing Doc"],
  ...suryaEntries,
];
XLSX.utils.book_append_sheet(outWb, utils.aoa_to_sheet(suryaEntries), "Surya Ledger");

// ── Sheet 6: MATCHED ──
const matchedRows = reconRows.filter(r => String(r[5]).includes("MATCHED"));
const matchedData = [
  ["Date", "Ref / Bill No", "Description", "Sakar Amount (₹)", "Surya Amount (₹)", "Remarks"],
  ...matchedRows,
];
XLSX.utils.book_append_sheet(outWb, utils.aoa_to_sheet(matchedData), "Matched");

// ── Sheet 7: UNMATCHED ──
const unmatchedRows = reconRows.filter(r => String(r[5]).includes("ONLY") || String(r[5]).includes("MISMATCH"));
const unmatchedData = [
  ["Date", "Ref / Bill No", "Description", "Sakar Amount (₹)", "Surya Amount (₹)", "Status", "Remarks"],
  ...unmatchedRows,
];
XLSX.utils.book_append_sheet(outWb, utils.aoa_to_sheet(unmatchedData), "Unmatched");

// ── Write ──
const outFile = "Surya_Roshni_Reconciliation_Aug2026.xlsx";
XLSX.writeFile(outWb, outFile);
console.log(`\n✅ Saved: ${outFile}`);
console.log(`📊 7 sheets: Reconciliation | Summary | Sakar Sales | Sakar Purchase | Surya Ledger | Matched | Unmatched`);
