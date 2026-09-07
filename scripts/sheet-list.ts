import { read } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });
const names = wb.SheetNames;
console.log("ALL SHEETS (" + names.length + "):");
for (const n of names) console.log("  " + n);
console.log("\nSTOCK-RELATED:", names.filter(n => /stock|inventory|fg|production/i.test(n)).join(", ") || "NONE");
