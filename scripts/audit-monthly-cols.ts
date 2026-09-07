import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];
const cell = (ws: any, ref: string) => (ws as any)[ref];
const val = (ws: any, ref: string) => {
  const v = cell(ws, ref);
  if (!v) return "";
  if (typeof v.v === "number") return v.v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return String(v.v).slice(0, 20);
};

// SAKAR monthly C..N (Apr..Mar-27) key rows: 3 sales, 8 op rev, 10 total income, 12 COGS, 14 GP, 49 exp, 51 EBITDA, 62 PBT
console.log("Row | " + ["C(Apr)","D(May)","E(Jun)","F(Jul)","G(Aug)","H(Sep)","N(Mar27)","O(YTD)","P(L)"].join(" | "));
for (const r of [3, 8, 10, 12, 14, 49, 51, 62]) {
  const cols = ["C", "D", "E", "F", "G", "H", "N", "O", "P"].map((c) => val(pl, `${c}${r}`));
  console.log(`R${r} | ${cols.join(" | ")}`);
}
console.log("\nSVN monthly R..V (Apr..Aug) + AD/AE:");
for (const r of [3, 8, 10, 12, 14, 49, 51, 62]) {
  const cols = ["R", "S", "T", "U", "V", "AD", "AE"].map((c) => val(pl, `${c}${r}`));
  console.log(`R${r} | ${cols.join(" | ")}`);
}
// P34 / P41 / AE41 / P42 / P63 / C63 cached
console.log("\nP34:", val(pl, "P34"), "| P42:", val(pl, "P42"), "| P41:", val(pl, "P41"), "| C41:", val(pl, "C41"), "| V41:", val(pl, "V41"), "| AE41:", val(pl, "AE41"));
console.log("P63:", val(pl, "P63"), "| C63:", val(pl, "C63"), "| R63:", val(pl, "R63"), "| AD63:", val(pl, "AD63"));
// BS: networth cached + DSCR block
const bs = wb.Sheets["BS Summary"];
console.log("\nBS D4:", val(bs, "D4"), "| D5:", val(bs, "D5"), "| F4:", val(bs, "F4"), "| F5:", val(bs, "F5"), "| K4:", val(bs, "K4"), "| L4:", val(bs, "L4"), "| L5:", val(bs, "L5"));
console.log("BS D7:", val(bs, "D7"), "| D15:", val(bs, "D15"), "| D16:", val(bs, "D16"), "| F15:", val(bs, "F15"), "| F16:", val(bs, "F16"));
console.log("BS D44:", val(bs, "D44"), "| F44:", val(bs, "F44"), "| K44:", val(bs, "K44"), "| L44:", val(bs, "L44"));
console.log("BS F58(DSCR):", val(bs, "F58"), "| L58:", val(bs, "L58"));
// TB: H column helper sanity — what is H for a sales row?
const tb = wb.Sheets["Master-TB-Sakar"];
for (let r = 2; r < 624; r++) {
  const g = cell(tb, r, 6);
  if (g && String(g.v).trim() === "Sales") {
    const e = cell(tb, r, 4), h = cell(tb, r, 7), j = cell(tb, r, 9), n = cell(tb, r, 13);
    console.log(`TB R${r + 1} "${e ? String(e.v).slice(0, 30) : ""}" H=${h ? (h.f ? "F:" + String(h.f).slice(0, 60) : h.v) : "-"} J=${j ? j.v : "-"} N=${n ? n.v : "-"}`);
  }
}
