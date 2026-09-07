import { read, utils } from "xlsx";
import fs from "fs";

const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const money = (n: number) => "₹" + (n / 1e7).toFixed(2) + " Cr";

function fyOf(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return mo >= 4 ? `FY-${y}-${String((y + 1) % 100).padStart(2, "0")}` : `FY-${y - 1}-${String(y % 100).padStart(2, "0")}`;
}

// ---- Register (item-wise, app me loaded) ----
const regByFY: Record<string, { SAKAR: number; SVN: number }> = {};
for (const s of store.sales) {
  const f = fyOf(s.month || "");
  regByFY[f] = regByFY[f] || { SAKAR: 0, SVN: 0 };
  if (s.entity === "SAKAR") regByFY[f].SAKAR += s.taxable || 0;
  else regByFY[f].SVN += s.taxable || 0;
}

// ---- Statement (New PL monthly from workbook) ----
const stmtFiles: Record<string, [string, string]> = {
  "FY-2026-27": ["E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb", "SAKAR"],
  "FY-2025-26": ["E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2025-26/Revised Group-Summary as on 31.3.26.xlsb", "SAKAR"],
  "FY-2024-25": ["E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2024-25/New Group-Summary as on 31.03.25.xlsb", "SAKAR"],
};
console.log("FY        | Source            | SAKAR         | SVN          | Total");
for (const fy of ["FY-2024-25", "FY-2025-26", "FY-2026-27"]) {
  const r = regByFY[fy] || { SAKAR: 0, SVN: 0 };
  console.log(`${fy} | Register(IWSR)   | ${money(r.SAKAR).padEnd(13)} | ${money(r.SVN).padEnd(12)} | ${money(r.SAKAR + r.SVN)}`);
  const [pf, comp] = stmtFiles[fy];
  try {
    const wb = read(pf, { type: "file" });
    const rows = utils.sheet_to_json(wb.Sheets["New PL"], { header: 1 }) as any[][];
    // row 8 = Total of Sales; columns 3..N
    const r8 = rows[7] || [];
    const total = r8.slice(2).reduce((s: number, c: any) => s + (typeof c === "number" ? c : 0), 0);
    console.log(`${fy} | Statement(NewPL) | ${money(total).padEnd(13)} | ${comp === "SAKAR" ? "(SAKAR only)" : ""}`);
  } catch (e) { console.log(`${fy} | Statement err: ${String(e).slice(0, 40)}`); }
  // TB Domestic Sale group total
  const tbs = store.tb.filter((t: any) => t.fy === fy && t.entity === "SAKAR" && /sale/i.test(t.name || "") && !/return|scrap|job/i.test(t.name || ""));
  const tbTot = tbs.reduce((s: number, t: any) => s + (t.total || 0), 0);
  console.log(`${fy} | TB Sales-ledgers | ${money(-tbTot).padEnd(13)} | (movement sum)`);
}