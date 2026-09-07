import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const bs = wb.Sheets["BS Summary"];

// 1. BS Summary rows 13-30: labels + D/E/F and K/L formulas+values
console.log("### BS Summary rows 14-30 (label | D | F | K | L):");
for (let r = 13; r < 30; r++) {
  const get = (c: number) => {
    const cell = (bs as any)[utils.encode_cell({ r, c })];
    if (!cell) return "";
    const f = cell.f ? `{${String(cell.f).replace(/\s+/g, " ").slice(0, 60)}}` : "";
    return `${cell.v}${f}`;
  };
  const label = get(2);
  if (!label && !get(3) && !get(5)) continue;
  console.log(`R${r + 1}: [${label}] D=${get(3)} | F=${get(5)} | K=${get(10)} | L=${get(11)}`);
}

// 2. Master-TB-SVN row 1-2 headers
const svn = wb.Sheets["Master-TB-SVN"];
console.log("\n### Master-TB-SVN rows 1-2:");
for (const r of [0, 1]) {
  const parts: string[] = [];
  for (let c = 0; c < 25; c++) {
    const cell = (svn as any)[utils.encode_cell({ r, c })];
    if (cell) parts.push(`${utils.encode_col(c)}=${String(cell.v).slice(0, 18)}`);
  }
  console.log(`Row ${r + 1}: ${parts.join(" | ")}`);
}

// 3. Compute expected BS values from TB: for each BS label row 3..26,
//    sum TB col where row-1 date matches, criteria = label in TB grouping col
const skr = wb.Sheets["Master-TB-Sakar"];
const serialToDate = (n: number) => {
  const d = new Date(Date.UTC(1899, 11, 30) as any);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const readCol = (ws: any, col: number, maxRow: number) => {
  const out: any[] = [];
  for (let r = 0; r < maxRow; r++) out.push((ws as any)[utils.encode_cell({ r, c: col })]?.v);
  return out;
};

// TB row1 dates (C..V = cols 2..21)
const skrDates: any[] = [];
for (let c = 2; c < 22; c++) skrDates.push((skr as any)[utils.encode_cell({ r: 0, c })]?.v);
console.log("\n### Master-TB-Sakar row1 dates (C..V):");
skrDates.forEach((d, i) => { if (d) console.log(`  col${utils.encode_col(i + 2)}: ${d} = ${serialToDate(d)}`); });

const skrGroups = readCol(skr, 6, 620);  // col G grouping
const skrLabels = new Map<string, { mar: number; aug: number }>();
const lookupOrInsert = (k: string) => {
  if (!skrLabels.has(k)) skrLabels.set(k, { mar: 0, aug: 0 });
  return skrLabels.get(k)!;
};
// BS D2 currently 46112; TB March col U (idx 20) date 46082; Aug col N (idx 12) 46235
for (let r = 2; r < 620; r++) {
  const g = skrGroups[r];
  if (g === undefined || g === "") continue;
  const key = String(g);
  const mar = (skr as any)[utils.encode_cell({ r, c: 20 })]?.v || 0; // col U
  const aug = (skr as any)[utils.encode_cell({ r, c: 12 })]?.v || 0; // col N
  const e = lookupOrInsert(key);
  e.mar += Number(mar); e.aug += Number(aug);
}

console.log("\n### Expected BS (SAKAR, lakhs) for each BS label:");
for (let r = 2; r < 26; r++) {
  const label = (bs as any)[utils.encode_cell({ r, c: 2 })]?.v;
  if (!label) continue;
  const e = skrLabels.get(String(label));
  if (!e) {
    console.log(`R${r + 1} [${label}] => !! LABEL NOT FOUND IN TB COL G`);
  } else {
    console.log(
      `R${r + 1} [${label}] Mar-26=${(e.mar / 100000).toFixed(2)} Aug-26=${(e.aug / 100000).toFixed(2)}`
    );
  }
}
