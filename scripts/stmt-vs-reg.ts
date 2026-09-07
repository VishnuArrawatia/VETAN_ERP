import fs from "fs";
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const stmt = (store.stmtPL || []) as any[];
const sales = (store.sales || []) as any[];
const MON = ["04", "05", "06", "07", "08", "09", "10", "11", "12", "01", "02", "03"];

const fyOf = (m: string) => {
  const y = m.slice(0, 4), mm = m.slice(5);
  return +mm >= 4 ? `FY-${y}-${(+y + 1).toString().slice(2)}` : `FY-${(+y - 1)}-${y.slice(2)}`;
};

console.log("=== STATEMENT (New PL) per FY/entity/month (Cr) ===");
const byK: Record<string, number> = {};
for (const s of stmt) byK[`${s.fy}|${s.entity}|${s.month}`] = (s.revenue || 0);
for (const s of stmt) {
  if (s.month.endsWith("-03") || s.fy === "FY-2026-27") {
    console.log(`${s.fy} ${s.entity} ${s.month} rev=${(s.revenue / 1e7).toFixed(2)}Cr sales=${(s.sales / 1e7).toFixed(2)}Cr`);
  }
}

console.log("\n=== SUMMARY per FY/entity ===");
const sm: Record<string, { rev: number; sales: number }> = {};
for (const s of stmt) { const k = `${s.fy}|${s.entity}`; sm[k] ??= { rev: 0, sales: 0 }; sm[k].rev += s.revenue; sm[k].sales += s.sales; }
for (const k of Object.keys(sm).sort()) console.log(`${k}: revenue=${(sm[k].rev / 1e7).toFixed(2)}Cr, pureSales=${(sm[k].sales / 1e7).toFixed(2)}Cr`);

console.log("\n=== REGISTER monthly (Cr) per FY/entity ===");
const rg: Record<string, number> = {};
for (const s of sales) {
  const fy = fyOf(s.month);
  if (fy !== "FY-2026-27") continue;
  const k = `${fy}|${s.entity}|${s.month}`;
  rg[k] = (rg[k] || 0) + (s.taxable || 0);
}
for (const k of Object.keys(rg).sort()) console.log(`${k}: ${(rg[k] / 1e7).toFixed(2)}Cr`);
