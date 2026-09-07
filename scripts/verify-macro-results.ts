import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(filePath, { type: "file", cellFormula: true });
const sh = (n: string) => wb.Sheets[n];
const c = (ws: any, ref: string) => (ws as any)[ref];
const show = (ws: any, ref: string) => {
  const v = c(ws, ref);
  if (!v) return "(empty)";
  if (v.f) return `F{${String(v.f).slice(0, 60)}}`;
  return typeof v.v === "number" ? String(Math.round(v.v * 100) / 100) : String(v.v).slice(0, 50);
};

console.log("=== 1. Sheets ===");
console.log("Drill-Down:", sh("Drill-Down") ? "✅" : "❌ MISSING");
console.log("Auto-Check:", sh("Auto-Check") ? "✅" : "❌ MISSING");

const dd = sh("Drill-Down");
if (dd) {
  console.log("\n=== 2. Drill-Down ===");
  console.log("B2 (entity):", show(dd, "B2"));
  console.log("B3 (group):", show(dd, "B3"));
  console.log("B4 (date):", show(dd, "B4"));
  console.log("B8 formula:", show(dd, "B8").slice(0, 90));
  console.log("D8 formula:", show(dd, "D8").slice(0, 90));
  console.log("D6 total:", show(dd, "D6"));
  console.log("Z2:Z4 (dropdown list):", show(dd, "Z2"), "|", show(dd, "Z3"), "|", show(dd, "Z4"));
}

const ac = sh("Auto-Check");
if (ac) {
  console.log("\n=== 3. Auto-Check results ===");
  for (let r = 5; r <= 11; r++) {
    const a = show(ac, `A${r}`), cc = show(ac, `C${r}`), d = show(ac, `D${r}`);
    if (a !== "(empty)") console.log(`${a} => ${cc} [${d}]`);
  }
}

const dscr = sh("DSCR");
console.log("\n=== 4. DSCR ===");
console.log("I8:", show(dscr, "I8").slice(0, 60));
console.log("I9:", show(dscr, "I9").slice(0, 60));
console.log("G15 (SAKAR DSCR):", show(dscr, "G15"));
console.log("J15 (SVN DSCR):", show(dscr, "J15"));
console.log("F11 (SAKAR principal):", show(dscr, "F11").slice(0, 80));

const pl = sh("New PL");
console.log("\n=== 5. New PL ===");
console.log("B65 (tax rate):", show(pl, "B65"));
console.log("C63 (SAKAR monthly tax):", show(pl, "C63"));
console.log("R63 (SVN monthly tax):", show(pl, "R63"));
console.log("O63 (YTD tax):", show(pl, "O63"));
console.log("AC51 (was #REF!):", show(pl, "AC51"));
console.log("C8 (Operational Revenue - dead helper?):", show(pl, "C8").slice(0, 70));

const tbs = sh("Master-TB-Sakar"), tbv = sh("Master-TB-SVN");
console.log("\n=== 6. TB date formulas ===");
console.log("SAKAR K1:", show(tbs, "K1"), "| L1:", show(tbs, "L1"), "| U1:", show(tbs, "U1"));
console.log("SVN H1:", show(tbv, "H1"), "| L1:", show(tbv, "L1"), "| S1:", show(tbv, "S1"));

const bs = sh("BS Summary");
console.log("\n=== 7. BS Summary ===");
console.log("F2 (current month date):", show(bs, "F2").slice(0, 100));
console.log("L2:", show(bs, "L2").slice(0, 100));

const names: any[] = ((wb as any).Workbook || {}).Names || [];
const dead = names.filter((n) => String(n.Ref || "").includes("#REF!"));
console.log("\n=== 8. Named ranges ===");
console.log(`Total: ${names.length}, #REF! dead: ${dead.length} ${dead.length === 0 ? "✅" : "❌ " + dead.slice(0, 5).map((n) => n.Name).join(", ")}`);
