/**
 * Customer Account Reconciliation — Excel Generator
 * 
 * Usage:
 *   tsx scripts/customer-reconciliation.ts
 * 
 * Output: Customer_Reconciliation.xlsx
 * 
 * Customize the sample data below with your actual ledger entries.
 * Columns: Date, Invoice/Ref No, Description, Our Ledger (Debit/Credit), Customer Ledger (Debit/Credit)
 */

import * as XLSX from "xlsx";

/* ──────────────────────────────────────────────
   1. SAMPLE DATA — Replace with your actual data
   ────────────────────────────────────────────── */

interface LedgerEntry {
  date: string;          // DD-MMM-YYYY
  refNo: string;         // Invoice / Voucher / Ref number
  description: string;
  debit: number;
  credit: number;
}

// YOUR LEDGER (Company Books)
const ourLedger: LedgerEntry[] = [
  { date: "01-Aug-2026", refNo: "INV-1001", description: "Sale of Goods",         debit: 50000, credit: 0 },
  { date: "05-Aug-2026", refNo: "INV-1002", description: "Sale of Goods",         debit: 35000, credit: 0 },
  { date: "10-Aug-2026", refNo: "REC-2001", description: "Payment Received",       debit: 0,     credit: 40000 },
  { date: "15-Aug-2026", refNo: "INV-1003", description: "Service Charges",        debit: 12000, credit: 0 },
  { date: "20-Aug-2026", refNo: "INV-1004", description: "Sale of Goods",         debit: 28000, credit: 0 },
  { date: "22-Aug-2026", refNo: "REC-2002", description: "Payment Received",       debit: 0,     credit: 30000 },
  { date: "25-Aug-2026", refNo: "INV-1005", description: "Installation Charges",   debit: 8000,  credit: 0 },
  { date: "28-Aug-2026", refNo: "CR-3001",  description: "Credit Note (Return)",   debit: 0,     credit: 5000 },
  { date: "30-Aug-2026", refNo: "REC-2003", description: "Payment Received",       debit: 0,     credit: 25000 },
];

// CUSTOMER'S LEDGER (as per their records)
const customerLedger: LedgerEntry[] = [
  { date: "01-Aug-2026", refNo: "INV-1001", description: "Sale of Goods",         debit: 50000, credit: 0 },
  { date: "05-Aug-2026", refNo: "INV-1002", description: "Sale of Goods",         debit: 35000, credit: 0 },
  { date: "10-Aug-2026", refNo: "REC-2001", description: "Payment Made",           debit: 0,     credit: 40000 },
  { date: "15-Aug-2026", refNo: "INV-1003", description: "Service Charges",        debit: 12000, credit: 0 },
  { date: "20-Aug-2026", refNo: "INV-1004", description: "Sale of Goods",         debit: 28000, credit: 0 },
  // Customer didn't record REC-2002 (30 Aug) — timing difference
  { date: "28-Aug-2026", refNo: "CR-3001",  description: "Credit Note (Return)",   debit: 0,     credit: 5000 },
  { date: "29-Aug-2026", refNo: "INV-1006", description: "Misc Charges (Customer Only)", debit: 3000, credit: 0 },
];

/* ──────────────────────────────────────────────
   2. RECONCILIATION ENGINE
   ────────────────────────────────────────────── */

interface ReconciledRow {
  date: string;
  refNo: string;
  description: string;
  ourDebit: number | "";
  ourCredit: number | "";
  custDebit: number | "";
  custCredit: number | "";
  matchStatus: "✅ Matched" | "❌ Our Only" | "⚠️ Customer Only" | "🔄 Amount Mismatch";
  diff: number;
  remarks: string;
}

function reconcile(our: LedgerEntry[], cust: LedgerEntry[]): ReconciledRow[] {
  const results: ReconciledRow[] = [];
  const custUsed = new Set<number>();
  const ourUsed = new Set<number>();

  // Pass 1: Match by Ref No
  for (let i = 0; i < our.length; i++) {
    const o = our[i];
    let matched = false;
    for (let j = 0; j < cust.length; j++) {
      if (custUsed.has(j)) continue;
      if (o.refNo === cust[j].refNo) {
        custUsed.add(j);
        ourUsed.add(i);
        const c = cust[j];
        const ourAmt = o.debit - o.credit;
        const custAmt = c.debit - c.credit;
        const diff = ourAmt - custAmt;
        let status: ReconciledRow["matchStatus"] = "✅ Matched";
        let remarks = "Both books agree";
        if (Math.abs(diff) > 0.01) {
          status = "🔄 Amount Mismatch";
          remarks = `Amount difference: ${diff.toFixed(2)}`;
        }
        results.push({
          date: o.date,
          refNo: o.refNo,
          description: o.description,
          ourDebit: o.debit || "",
          ourCredit: o.credit || "",
          custDebit: c.debit || "",
          custCredit: c.credit || "",
          matchStatus: status,
          diff,
          remarks,
        });
        matched = true;
        break;
      }
    }
    if (!matched) {
      ourUsed.add(i);
      results.push({
        date: o.date,
        refNo: o.refNo,
        description: o.description,
        ourDebit: o.debit || "",
        ourCredit: o.credit || "",
        custDebit: "",
        custCredit: "",
        matchStatus: "❌ Our Only",
        diff: o.debit - o.credit,
        remarks: "Entry in our books only — check with customer",
      });
    }
  }

  // Pass 2: Unmatched customer entries
  for (let j = 0; j < cust.length; j++) {
    if (!custUsed.has(j)) {
      const c = cust[j];
      results.push({
        date: c.date,
        refNo: c.refNo,
        description: c.description,
        ourDebit: "",
        ourCredit: "",
        custDebit: c.debit || "",
        custCredit: c.credit || "",
        matchStatus: "⚠️ Customer Only",
        diff: -(c.debit - c.credit),
        remarks: "Entry in customer books only — verify with our team",
      });
    }
  }

  // Sort by date
  results.sort((a, b) => {
    const da = new Date(a.date.split("-").reverse().join("-"));
    const db = new Date(b.date.split("-").reverse().join("-"));
    return da.getTime() - db.getTime();
  });

  return results;
}

/* ──────────────────────────────────────────────
   3. BUILD EXCEL WORKBOOK
   ────────────────────────────────────────────── */

const reconciled = reconcile(ourLedger, customerLedger);

// Summary calculations
const ourTotalDebit = ourLedger.reduce((s, e) => s + e.debit, 0);
const ourTotalCredit = ourLedger.reduce((s, e) => s + e.credit, 0);
const custTotalDebit = customerLedger.reduce((s, e) => s + e.debit, 0);
const custTotalCredit = customerLedger.reduce((s, e) => s + e.credit, 0);
const matched = reconciled.filter((r) => r.matchStatus === "✅ Matched");
const ourOnly = reconciled.filter((r) => r.matchStatus === "❌ Our Only");
const custOnly = reconciled.filter((r) => r.matchStatus === "⚠️ Customer Only");
const mismatched = reconciled.filter((r) => r.matchStatus === "🔄 Amount Mismatch");

const wb = XLSX.utils.book_new();

// ── Sheet 1: Our Ledger ──
const ourSheet = XLSX.utils.json_to_sheet(
  ourLedger.map((e) => ({
    Date: e.date,
    "Ref No": e.refNo,
    Description: e.description,
    Debit: e.debit || "",
    Credit: e.credit || "",
  })),
  { header: ["Date", "Ref No", "Description", "Debit", "Credit"] }
);
XLSX.utils.book_append_sheet(wb, ourSheet, "Our Ledger");

// ── Sheet 2: Customer Ledger ──
const custSheet = XLSX.utils.json_to_sheet(
  customerLedger.map((e) => ({
    Date: e.date,
    "Ref No": e.refNo,
    Description: e.description,
    Debit: e.debit || "",
    Credit: e.credit || "",
  })),
  { header: ["Date", "Ref No", "Description", "Debit", "Credit"] }
);
XLSX.utils.book_append_sheet(wb, custSheet, "Customer Ledger");

// ── Sheet 3: Reconciliation ──
const reconData = reconciled.map((r) => ({
  Date: r.date,
  "Ref No": r.refNo,
  Description: r.description,
  "Our Debit": r.ourDebit,
  "Our Credit": r.ourCredit,
  "Customer Debit": r.custDebit,
  "Customer Credit": r.custCredit,
  "Status": r.matchStatus,
  "Difference": r.diff ? r.diff.toFixed(2) : "0.00",
  "Remarks": r.remarks,
}));
const reconSheet = XLSX.utils.json_to_sheet(reconData, {
  header: [
    "Date", "Ref No", "Description",
    "Our Debit", "Our Credit",
    "Customer Debit", "Customer Credit",
    "Status", "Difference", "Remarks",
  ],
});
XLSX.utils.book_append_sheet(wb, reconSheet, "Reconciliation");

// ── Sheet 4: Summary ──
const summaryRows = [
  ["CUSTOMER ACCOUNT RECONCILIATION SUMMARY"],
  [""],
  ["Customer Name:", "________________________"],
  ["Period:", "01-Aug-2026 to 31-Aug-2026"],
  ["Prepared By:", "________________________"],
  ["Date:", new Date().toISOString().split("T")[0]],
  [""],
  ["── OUR BOOKS ──"],
  ["Total Debits:", ourTotalDebit],
  ["Total Credits:", ourTotalCredit],
  ["Net Balance (Dr):", ourTotalDebit - ourTotalCredit],
  [""],
  ["── CUSTOMER BOOKS ──"],
  ["Total Debits:", custTotalDebit],
  ["Total Credits:", custTotalCredit],
  ["Net Balance (Dr):", custTotalDebit - custTotalCredit],
  [""],
  ["── RECONCILIATION RESULT ──"],
  ["Total Entries (Our):", ourLedger.length],
  ["Total Entries (Customer):", customerLedger.length],
  ["Matched Entries:", matched.length],
  ["Our Only (Unmatched):", ourOnly.length],
  ["Customer Only (Unmatched):", custOnly.length],
  ["Amount Mismatches:", mismatched.length],
  [""],
  ["Overall Difference:", (ourTotalDebit - ourTotalCredit) - (custTotalDebit - custTotalCredit)],
  [""],
  ["── SIGN-OFF ──"],
  ["Prepared by:", "_______________", "Date:", "___________"],
  ["Reviewed by:", "_______________", "Date:", "___________"],
  ["Approved by:", "_______________", "Date:", "___________"],
];

const sumSheet = XLSX.utils.aoa_to_sheet(summaryRows);
// Widen column A for labels
sumSheet["!cols"] = [{ wch: 28 }, { wch: 20 }, { wch: 10 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, sumSheet, "Summary");

// ── Sheet 5: Unmatched Details ──
const unmatchedRows = [
  ["UNMATCHED / DISCREPANCY DETAILS"],
  [""],
];

ourOnly.forEach((r) => {
  unmatchedRows.push([
    r.date, r.refNo, r.description,
    `Our: ${r.diff > 0 ? "Dr" : "Cr"} ${Math.abs(r.diff).toFixed(2)}`,
    "Customer: —",
    "Entry exists in our books only. Verify if customer received/recorded this.",
  ]);
});
custOnly.forEach((r) => {
  unmatchedRows.push([
    r.date, r.refNo, r.description,
    "Our: —",
    `Customer: ${r.diff < 0 ? "Dr" : "Cr"} ${Math.abs(r.diff).toFixed(2)}`,
    "Entry exists in customer books only. Verify if we missed recording this.",
  ]);
});
mismatched.forEach((r) => {
  unmatchedRows.push([
    r.date, r.refNo, r.description,
    `Our: ${r.ourDebit ? `Dr ${r.ourDebit}` : `Cr ${r.ourCredit}`}`,
    `Customer: ${r.custDebit ? `Dr ${r.custDebit}` : `Cr ${r.custCredit}`}`,
    `Amount mismatch. Difference: ${r.diff.toFixed(2)}`,
  ]);
});

if (ourOnly.length === 0 && custOnly.length === 0 && mismatched.length === 0) {
  unmatchedRows.push(["🎉 All entries matched! No discrepancies found."]);
}

const unmatchedSheet = XLSX.utils.aoa_to_sheet(unmatchedRows);
unmatchedSheet["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb, unmatchedSheet, "Unmatched Details");

/* ──────────────────────────────────────────────
   4. WRITE FILE
   ────────────────────────────────────────────── */

const outFile = "Customer_Reconciliation.xlsx";
XLSX.writeFile(wb, outFile);

console.log(`\n✅ Reconciliation Excel generated: ${outFile}`);
console.log(`\n📊 Summary:`);
console.log(`   Our Ledger Entries:     ${ourLedger.length}`);
console.log(`   Customer Ledger Entries: ${customerLedger.length}`);
console.log(`   ✅ Matched:              ${matched.length}`);
console.log(`   ❌ Our Only:             ${ourOnly.length}`);
console.log(`   ⚠️  Customer Only:        ${custOnly.length}`);
console.log(`   🔄 Amount Mismatch:      ${mismatched.length}`);
console.log(`\n   Our Net Balance:    ${ourTotalDebit - ourTotalCredit}`);
console.log(`   Customer Net Bal:   ${custTotalDebit - custTotalCredit}`);
console.log(`   Overall Diff:       ${(ourTotalDebit - ourTotalCredit) - (custTotalDebit - custTotalCredit)}`);
console.log(`\n📝 To use with your data: Edit the ourLedger & customerLedger arrays at the top of the script.`);
