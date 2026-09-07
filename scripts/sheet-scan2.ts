import { read } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });
console.log("ALL SHEETS (" + wb.SheetNames.length + "):");
wb.SheetNames.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));
console.log("\nLoan-like:", wb.SheetNames.filter(n => /loan|cc|car|term/i.test(n)).join(", ") || "none besides scanned");
