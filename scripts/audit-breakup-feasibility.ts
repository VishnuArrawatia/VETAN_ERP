import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];

// 1. SVN TB headers rows 1-3, cols A..X
const svn = wb.Sheets["Master-TB-SVN"];
console.log("=== Master-TB-SVN headers ===");
for (let r = 0; r < 3; r++) {
  const parts: string[] = [`Row${r + 1}`];
  for (let c = 0; c < 26; c++) {
    const v = cell(svn, r, c);
    if (v) parts.push(`${utils.encode_col(c)}=${v.f ? "F:" + String(v.f).slice(0, 30) : String(v.v).slice(0, 24)}`);
  }
  console.log(parts.join(" | "));
}

// 2. Group sizes in both TBs (col G for SAKAR, col F for SVN)
console.log("\n=== Group account counts ===");
for (const [nm, gc] of [["Master-TB-Sakar", 6], ["Master-TB-SVN", 5]] as [string, number][]) {
  const ws = wb.Sheets[nm];
  const counts = new Map<string, number>();
  let maxRow = 0;
  for (let r = 2; r < 700; r++) {
    const g = cell(ws, r, gc);
    if (g && String(g.v).trim()) {
      const k = String(g.v).trim();
      counts.set(k, (counts.get(k) || 0) + 1);
      maxRow = r + 1;
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${nm} (data till row ${maxRow}): ${counts.size} groups, top 12 sizes:`);
  for (const [g, n] of sorted.slice(0, 12)) console.log(`  ${g}: ${n}`);
}

// 3. Does SVN TB have W/X (Landed Group / Category) columns populated?
console.log("\n=== SVN TB col W/X sample rows ===");
for (let r = 2; r < 10; r++) {
  const w = cell(svn, r, 22), x = cell(svn, r, 23);
  const e = cell(svn, r, 4);
  console.log(`R${r + 1} ${e ? String(e.v).slice(0, 28) : ""} | W=${w ? String(w.v).slice(0, 20) : "-"} | X=${x ? String(x.v).slice(0, 20) : "-"}`);
}

// 4. SAKAR TB col B (Cost Sheet) and C (Type) sample
const skr = wb.Sheets["Master-TB-Sakar"];
console.log("\n=== SAKAR TB col B/C sample ===");
for (let r = 2; r < 6; r++) {
  const b = cell(skr, r, 1), c = cell(skr, r, 2), e = cell(skr, r, 4);
  console.log(`R${r + 1} B=${b ? String(b.v).slice(0, 16) : "-"} C=${c ? String(c.v).slice(0, 12) : "-"} E=${e ? String(e.v).slice(0, 28) : "-"}`);
}
