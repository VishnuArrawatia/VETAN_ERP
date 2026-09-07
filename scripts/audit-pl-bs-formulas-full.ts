import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];
const bs = wb.Sheets["BS Summary"];

const cell = (ws: any, ref: string) => (ws as any)[ref];
const full = (ws: any, ref: string) => {
  const v = cell(ws, ref);
  if (!v) return "(empty)";
  if (v.f) return `= ${String(v.f)}`;
  if (typeof v.v === "number") return `val: ${v.v}`;
  return `txt: "${String(v.v).slice(0, 60)}"`;
};

console.log("=== NEW PL — full formulas (suspicious cells) ===");
const plCells = [
  "B17", "B40", "B48", "C17", "O17",
  "C33", "O33", "P33",
  "O34", "P34",
  "C41", "O41", "P41", "AE41", "O48",
  "C49", "C51", "O51", "AD51", "V51",
  "C63", "D63", "N63", "O63", "P63", "R63", "V63", "AD63", "AE63",
  "C64", "O64", "R64", "V64", "AD64", "AE64",
  "C15", "O15",
  "C69", "P69", "AD69",
  "B71", "C71", "R71", "V71", "AD72", "R72", "V72",
  "AD74", "AD77", "AD80", "AD83", "AD85",
  "C82", "V82",
  "O1", "S1", "P1", "AE1",
];
for (const ref of plCells) console.log(`PL!${ref}: ${full(pl, ref)}`);

console.log("\n=== BS SUMMARY — full formulas (networth chain, patches, DSCR block) ===");
const bsCells = [
  "D2", "E2", "F2", "K2", "L2",
  "D3", "D4", "E4", "F4", "K4", "L4",
  "D5", "E5", "F5", "K5", "L5",
  "F7", "L7",
  "D15", "E15", "F15", "D16", "F16", "K16", "L16",
  "D23", "E23", "F23", "E40",
  "D28", "E28", "F28", "K28", "L28",
  "E29", "E30", "E31", "E32",
  "D31", "F31", "K31", "L31",
  "D44", "F44", "K44", "L44",
  "D52", "F52", "D53", "F53",
  "F55", "L55", "F56", "L56", "F57", "L57", "F58", "L58",
  "F60", "L60",
  "B44", "B55", "B56", "B57", "B60",
  "I2", "O2", "H2",
];
for (const ref of bsCells) console.log(`BS!${ref}: ${full(bs, ref)}`);

// TB label groups used by the BS names — check what groups exist for R&S / Current Year Profit
console.log("\n=== Master-TB-Sakar: group labels in F col matching R&S / Profit ===");
const tb = wb.Sheets["Master-TB-Sakar"];
const seen = new Set<string>();
for (let r = 2; r < 700; r++) {
  const f = cell(tb, r, 5); // col F group label
  const t = f ? String(f.v).trim() : "";
  if (!t || seen.has(t)) continue;
  if (/reserv|surplus|profit|p&l|pnl|current year/i.test(t)) {
    seen.add(t);
    // sum of the Mar-26 (col J?) and Aug-26 (col N?) balances for this group
    let mar = 0, aug = 0;
    for (let r2 = 2; r2 < 700; r2++) {
      const g = cell(tb, r2, 5);
      if (g && String(g.v).trim() === t) {
        const mj = cell(tb, r2, 9), mn = cell(tb, r2, 13);
        if (mj && typeof mj.v === "number") mar += mj.v;
        if (mn && typeof mn.v === "number") aug += mn.v;
      }
    }
    console.log(`  "${t}"  Mar-26 sum=${mar.toFixed(0)}  Aug-26 sum=${aug.toFixed(0)}`);
  }
}
