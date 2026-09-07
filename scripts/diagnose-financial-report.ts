import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";

const wb = read(filePath, { type: "file", cellFormula: true });

// 1. Named ranges
const wbk: any = (wb as any).Workbook || {};
const names: any[] = wbk.Names || [];
console.log("### NAMED RANGES:", names.length);
for (const n of names.slice(0, 60)) {
  console.log(`  - ${n.Name} => ${String(n.Ref || "").slice(0, 90)}`);
}
console.log("");

// 2. Error cells across all sheets
console.log("### ERROR CELLS SCAN:");
const ERRORS = ["#REF!", "#N/A", "#VALUE!", "#DIV/0!", "#NAME?", "#NULL!", "#NUM!"];
let totalErrors = 0;
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const found: string[] = [];
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith("!")) continue;
    const cell = (ws as any)[addr];
    if (cell && typeof cell.v === "string" && ERRORS.includes(cell.v)) {
      found.push(`${addr}=${cell.v}${cell.f ? " (f: " + cell.f.slice(0, 60) + ")" : ""}`);
    }
  }
  if (found.length) {
    totalErrors += found.length;
    console.log(`  [${name}] ${found.length} errors:`);
    for (const f of found.slice(0, 15)) console.log(`     ${f}`);
    if (found.length > 15) console.log(`     ...and ${found.length - 15} more`);
  }
}
console.log(`  TOTAL error cells: ${totalErrors}`);
console.log("");

// 3. "New PL" sheet layout — first 8 columns, all rows
console.log('### "New PL" LAYOUT (cols A-H):');
const pl = wb.Sheets["New PL"];
const plJson = utils.sheet_to_json(pl, { header: 1, defval: "" });
for (let i = 0; i < plJson.length; i++) {
  const row = plJson[i];
  const cells = row.slice(0, 8).map((v: any) =>
    typeof v === "string" ? v.slice(0, 38) : v
  );
  const nonEmpty = cells.some((v: any) => v !== "");
  if (nonEmpty) console.log(`R${i + 1}:`, JSON.stringify(cells));
}
