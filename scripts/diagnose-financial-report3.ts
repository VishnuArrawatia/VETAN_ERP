import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];

// PBT / Tax / PAT rows (62-64) formulas, SAKAR side C..O and SVN side R..AE
console.log('### "New PL" rows 62-64 formulas:');
for (const r of [61, 62, 63]) {
  for (const c of [2, 3, 4, 5, 6, 17, 21, 29, 30]) {
    const addr = utils.encode_cell({ r, c });
    const cell = (pl as any)[addr];
    if (cell) console.log(`  ${addr}: f="${cell.f || "-"}" v=${cell.v}`);
  }
  console.log("  ---");
}

// Master-TB-Sakar header rows
console.log('### "Master-TB-Sakar" rows 1-3 (all 26 cols):');
const mt = wb.Sheets["Master-TB-Sakar"];
for (const r of [0, 1, 2]) {
  const vals: string[] = [];
  for (let c = 0; c < 26; c++) {
    const cell = mt[utils.encode_cell({ r, c })] as any;
    if (!cell) continue;
    let v = cell.v;
    if (typeof v === "number" && v > 40000 && v < 50000) v = `${v}`;
    vals.push(`${utils.encode_col(c)}:${String(v).slice(0, 22)}`);
  }
  console.log(`Row ${r + 1}: ${vals.join(" | ")}`);
}
