import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const tb = wb.Sheets["Master-TB-Sakar"];
const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];

// header rows 1-3 all columns A..X
for (let r = 0; r < 3; r++) {
  const parts: string[] = [`Row${r + 1}`];
  for (let c = 0; c < 24; c++) {
    const v = cell(tb, r, c);
    if (v) parts.push(`${utils.encode_col(c)}=${String(v.v).slice(0, 22)}`);
  }
  console.log(parts.join(" | "));
}

// distinct group labels in likely group columns (E,F,G) rows 3..650
for (const gc of [4, 5, 6]) {
  const set = new Set<string>();
  for (let r = 2; r < 650; r++) {
    const v = cell(tb, r, gc);
    if (v && String(v.v).trim()) set.add(String(v.v).trim().slice(0, 40));
  }
  console.log(`\nCol ${utils.encode_col(gc)} distinct labels (${set.size}):`);
  console.log([...set].slice(0, 60).join(" || "));
}

// BS_ name definitions
const names: any[] = ((wb as any).Workbook || {}).Names || [];
console.log("\n=== BS_/PL_/TB_ names ===");
for (const n of names) {
  const nm = String(n.Name || n.name || "");
  if (/^(BS_|Sales_|OtherSales|Monthlydata|TB_|Sales_Return|Salesreturn|Sales_return)/i.test(nm)) {
    console.log(`${nm} = ${String(n.RefersTo || n.refersTo || "").slice(0, 240)}`);
  }
}
