import fs from "fs";
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const rows = (store.loans || []).filter((l: any) => l.fy === "FY-2026-27");
console.log("FY-2026-27 rows:", rows.length);
const byMonth: Record<string, number> = {};
for (const l of rows) byMonth[l.month] = (byMonth[l.month] || 0) + 1;
console.log("by month:", byMonth);
console.log("Jun rows:", rows.filter((l: any) => /jun/i.test(l.month)).slice(0, 3));
console.log("Aug rows:", rows.filter((l: any) => /aug/i.test(l.month)).slice(0, 3));
