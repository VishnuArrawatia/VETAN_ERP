import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const bs = wb.Sheets["BS Summary"];
const skr = wb.Sheets["Master-TB-Sakar"];
const svn = wb.Sheets["Master-TB-SVN"];

const readCol = (ws: any, col: number, maxRow: number) => {
  const out: any[] = [];
  for (let r = 0; r < maxRow; r++) out.push((ws as any)[utils.encode_cell({ r, c: col })]?.v);
  return out;
};

// SAKAR: G=grouping(col6), U=Mar-26(col20), N=Aug-26(col12)
const skrGroups = readCol(skr, 6, 620);
const sums: Map<string, { mar: number; aug: number }> = new Map();
for (let r = 2; r < 620; r++) {
  const g = skrGroups[r];
  if (g === undefined || g === "") continue;
  const k = String(g);
  if (!sums.has(k)) sums.set(k, { mar: 0, aug: 0 });
  sums.get(k)!.mar += Number((skr as any)[utils.encode_cell({ r, c: 20 })]?.v || 0);
  sums.get(k)!.aug += Number((skr as any)[utils.encode_cell({ r, c: 12 })]?.v || 0);
}

// SVN: B=grouping(col1), G=Mar-26(col6), L=Aug-26(col11)
const svnGroups = readCol(svn, 1, 620);
const ssums: Map<string, { mar: number; aug: number }> = new Map();
for (let r = 2; r < 620; r++) {
  const g = svnGroups[r];
  if (g === undefined || g === "") continue;
  const k = String(g);
  if (!ssums.has(k)) ssums.set(k, { mar: 0, aug: 0 });
  ssums.get(k)!.mar += Number((svn as any)[utils.encode_cell({ r, c: 6 })]?.v || 0);
  ssums.get(k)!.aug += Number((svn as any)[utils.encode_cell({ r, c: 11 })]?.v || 0);
}

console.log("### Expected BS values (lakhs) — label: SAKAR Mar | SAKAR Aug || SVN Mar | SVN Aug");
for (let r = 2; r < 40; r++) {
  const label = (bs as any)[utils.encode_cell({ r, c: 2 })]?.v;
  if (!label) continue;
  const s = sums.get(String(label));
  const v = ssums.get(String(label));
  const fmt = (x?: number) => (x === undefined ? "  (label nahi mila) " : (x / 100000).toFixed(2).padStart(10));
  console.log(
    `R${r + 1} [${String(label).slice(0, 36)}] S:${fmt(s?.mar)}/${fmt(s?.aug)} || V:${fmt(v?.mar)}/${fmt(v?.aug)}`
  );
}
