import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];
const bs = wb.Sheets["BS Summary"];
const cell = (ws: any, ref: string) => (ws as any)[ref];

// 1. Cached values of key computed cells
console.log("=== PL cached values (what the file currently shows) ===");
for (const ref of ["C3", "N3", "C4", "C5", "C6", "C7", "C8", "N8", "C9", "C10", "N10", "C12", "C14", "N14", "C15",
  "R3", "V3", "R8", "V8", "R10", "V10", "R14", "V14", "P8", "O8", "P10", "AE8",
  "C49", "N49", "C51", "N51", "O51", "V51", "O62", "P62", "AD62"]) {
  const v = cell(pl, ref);
  console.log(`PL!${ref} = ${v ? (typeof v.v === "number" ? v.v.toLocaleString("en-IN") : String(v.v).slice(0, 30)) : "(empty)"}`);
}

// 2. What's actually at the bottom rows that C8 references?
console.log("\n=== PL bottom rows 1048579-1048583 (C,D,N,O,P,R,V) ===");
for (let r = 1048578; r <= 1048582; r++) {
  const parts = [`Row${r + 1}`];
  for (const c of [2, 3, 13, 14, 15, 17, 21]) {
    const v = (pl as any)[utils.encode_cell({ r, c })];
    if (v) parts.push(`${utils.encode_col(c)}=${v.f ? "F:" + String(v.f).slice(0, 30) : String(v.v).slice(0, 24)}`);
  }
  console.log(parts.join(" | ") || "(empty row)");
}

// 3. Sales name definitions (full)
const names: any[] = ((wb as any).Workbook || {}).Names || [];
console.log("\n=== Sales-related name definitions ===");
for (const n of names) {
  const nm = String(n.Name || "");
  if (/^(Sales_|OtherSales|Sales_Return|Salesreturn|Sales_return|Monthlydata_SKR)/i.test(nm)) {
    console.log(`\n${nm}:\n  ${String(n.Ref).replace(/\s+/g, " ").slice(0, 500)}`);
  }
}

// 4. BS bottom / patch cells cached values
console.log("\n=== BS cached values ===");
for (const ref of ["D2", "E2", "F2", "D4", "F4", "D5", "F5", "D15", "F15", "D25", "F25", "D42", "F42", "D44", "F44",
  "D52", "F52", "D53", "F53", "F58", "L58", "F60", "L60", "I2", "O2", "B55", "B56", "B57", "B58", "B60"]) {
  const v = cell(bs, ref);
  console.log(`BS!${ref} = ${v ? (typeof v.v === "number" ? v.v.toLocaleString("en-IN") : String(v.v).slice(0, 40)) : "(empty)"}`);
}
