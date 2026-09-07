import fs from "fs";
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const counts = new Map<string, number>();
for (const r of store.sales) counts.set(r.month, (counts.get(r.month) || 0) + 1);
console.log("SALES months:", [...counts.entries()].sort().map(([m, c]) => `${m}(${c})`).join(", "));
const rc = new Map<string, number>();
for (const r of store.rejections) rc.set(r.month, (rc.get(r.month) || 0) + 1);
console.log("REJ months:", [...rc.entries()].sort().map(([m, c]) => `${m}(${c})`).join(", "));
// sales vs TB cross-check: total taxable per month
for (const m of [...counts.keys()].sort()) {
  const tot = store.sales.filter((r: any) => r.month === m).reduce((s: number, r: any) => s + r.taxable, 0);
  console.log(`${m}: ₹${(tot / 1e7).toFixed(2)}Cr`);
}
