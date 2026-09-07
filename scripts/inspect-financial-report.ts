import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";

const wb = read(filePath, { type: "file", cellFormula: true, cellStyles: false });
console.log("📄 Total sheets:", wb.SheetNames.length);
console.log("");

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const ref = ws["!ref"] || "(empty)";
  const range = utils.decode_range(ref);
  const rows = range.e.r - range.s.r + 1;
  const cols = range.e.c - range.s.c + 1;

  // Count formulas and data cells
  let formulaCount = 0;
  let cellCount = 0;
  const formulaSamples: string[] = [];
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith("!")) continue;
    const cell = (ws as any)[addr];
    cellCount++;
    if (cell.f) {
      formulaCount++;
      if (formulaSamples.length < 3) formulaSamples.push(`${addr}: ${cell.f}`);
    }
  }

  console.log(`=== "${name}" ===`);
  console.log(`   Range: ${ref}  (${rows} rows x ${cols} cols) | cells: ${cellCount} | formulas: ${formulaCount}`);
  if (formulaSamples.length) {
    console.log(`   Formula samples: ${formulaSamples.join(" | ")}`);
  }
  console.log("");
}

// Dump first 15 rows of the first 3 sheets to see layout
console.log("########## SAMPLE CONTENT ##########");
for (const name of wb.SheetNames.slice(0, 3)) {
  const ws = wb.Sheets[name];
  const json = utils.sheet_to_json(ws, { header: 1, defval: "" });
  console.log(`\n=== Sheet: "${name}" (first 15 rows) ===`);
  for (let i = 0; i < Math.min(15, json.length); i++) {
    const row = json[i].map((v: any) => (typeof v === "string" ? v.slice(0, 30) : v));
    console.log(`R${i + 1}:`, JSON.stringify(row.slice(0, 12)));
  }
}
