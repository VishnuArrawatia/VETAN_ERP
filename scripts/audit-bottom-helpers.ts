import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];

// Full dump of bottom helper region — ALL columns
console.log("=== New PL bottom region rows 1048576..1048700 (any column with content) ===");
let found = 0;
for (let r = 1048575; r < 1048700; r++) {
  const parts: string[] = [`Row${r + 1}`];
  for (let c = 0; c < 40; c++) {
    const v = (pl as any)[utils.encode_cell({ r, c })];
    if (v) {
      found++;
      const txt = v.f ? `F:${String(v.f).slice(0, 60)}` : String(v.v).slice(0, 40);
      parts.push(`${utils.encode_col(c)}=${txt}`);
    }
  }
  if (parts.length > 1) console.log(parts.join(" | "));
}
if (!found) console.log("(completely empty — helper blocks are GONE)");

// Also check rows 1048584..1048660 explicitly for the other helper blocks
console.log("\n=== Ranges referenced by formulas ===");
console.log("C8  sums C1048579:C1048583 (Operational Revenue helper)");
console.log("P8  sums P1048579:P1048583");
console.log("AD69 sums AD1048642:AD1048644 (Total Rejections helper)");
console.log("AD80 sums AD1048653:AD1048655 (Labour paydays helper)");
