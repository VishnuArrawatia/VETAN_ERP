import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const svn = wb.Sheets["Master-TB-SVN"];
const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];

console.log("SVN TB !ref:", svn["!ref"]);

// All 47 SVN groupings in col B
const set = new Map<string, number>();
for (let r = 2; r < 700; r++) {
  const g = cell(svn, r, 1); // col B grouping
  if (g && String(g.v).trim()) {
    const k = String(g.v).trim();
    set.set(k, (set.get(k) || 0) + 1);
  }
}
console.log(`\nSVN col-B groupings (${set.size}):`);
console.log([...set.entries()].map(([g, n]) => `${g}(${n})`).join(" | "));

// TB_SVN definition
const names: any[] = ((wb as any).Workbook || {}).Names || [];
for (const n of names) {
  if (/^TB_(SKR|SVN)$/i.test(String(n.Name))) {
    console.log(`\n${n.Name} = ${String(n.Ref).replace(/\s+/g, " ").slice(0, 400)}`);
  }
}

// SVN PL labels vs SVN TB groupings: which PL expense rows would find no match?
const pl = wb.Sheets["New PL"];
const plLabels: string[] = [];
for (let r = 2; r < 70; r++) {
  const b = cell(pl, r, 1);
  if (b && String(b.v).trim()) plLabels.push(String(b.v).trim());
}
console.log("\nPL labels NOT found in SVN TB groupings:");
for (const l of plLabels) {
  if (!set.has(l)) console.log(`  ✗ "${l}"`);
}
console.log("\nSVN TB groupings NOT used by any PL label (would never show in PL):");
for (const g of set.keys()) {
  if (!plLabels.includes(g)) console.log(`  • "${g}" (${set.get(g)} accts)`);
}
