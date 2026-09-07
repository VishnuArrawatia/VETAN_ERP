import fs from "fs";
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const loans = store.loans || [];
console.log("total loans:", loans.length);
const byComp: Record<string, number> = {};
const byFY: Record<string, number> = {};
for (const l of loans) {
  byComp[l.company] = (byComp[l.company] || 0) + 1;
  byFY[l.fy] = (byFY[l.fy] || 0) + 1;
}
console.log("by company:", byComp);
console.log("by fy:", byFY);
console.log("sample 26-27 rows:", loans.filter((l: any) => l.fy.includes("2026")).slice(0, 5));
