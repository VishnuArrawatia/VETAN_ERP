import { read, utils } from "xlsx";

const filePath =
  "E:/Account Master/A-Sakar/7. Management MIS/Monthly MIS/Financial Report/FY-2026-27/Revised Group-Summary as on 31.08.26.xlsb";
const wb = read(filePath, { type: "file", cellFormula: true });
const pl = wb.Sheets["New PL"];
const bs = wb.Sheets["BS Summary"];

const cell = (ws: any, r: number, c: number) => (ws as any)[utils.encode_cell({ r, c })];
const fmt = (v: any, maxF = 55) => {
  if (!v) return "";
  if (v.f) return `F{${String(v.f).replace(/\s+/g, " ").slice(0, maxF)}}`;
  if (typeof v.v === "number") return v.v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return String(v.v).slice(0, 40);
};

// ============ NEW PL: rows 1-90 ============
// SAKAR: C=Apr monthly, N=Aug monthly, O=YTD, P=Lakhs | SVN: R=Apr, V=Aug, AD=YTD, AE=Lakhs
console.log("### NEW PL — row | label(B) | C(Apr-SKR) | N(Aug-SKR) | O(YTD-SKR) | P(L-SKR) || R(Apr-SVN) | V(Aug-SVN) | AD(YTD-SVN) | AE(L-SVN)");
for (let r = 0; r < 90; r++) {
  const label = cell(pl, r, 1);
  const c = cell(pl, r, 2), n = cell(pl, r, 13), o = cell(pl, r, 14), p = cell(pl, r, 15);
  const rr = cell(pl, r, 17), v = cell(pl, r, 21), ad = cell(pl, r, 29), ae = cell(pl, r, 30);
  const hasAny = c || n || o || p || rr || v || ad || ae;
  if (!label && !hasAny) continue;
  const parts = [
    `R${r + 1}`,
    label ? String(label.v).slice(0, 34) : "",
    fmt(c, 40), fmt(n), fmt(o, 40), fmt(p),
    fmt(rr, 40), fmt(v), fmt(ad, 40), fmt(ae),
  ];
  // print only rows with label or any content
  console.log(parts.join(" | "));
}

// ============ BS SUMMARY: rows 1-60 ============
// SAKAR: D=Mar-26, E=manual col, F=Aug-26 | SVN: K=Mar-26, L=Aug-26
console.log("\n\n### BS SUMMARY — row | label(C) | D(Mar26-SKR) | E(manual) | F(Aug26-SKR) || K(Mar26-SVN) | L(Aug26-SVN)");
for (let r = 0; r < 60; r++) {
  const label = cell(bs, r, 2);
  const d = cell(bs, r, 3), e = cell(bs, r, 4), f = cell(bs, r, 5);
  const k = cell(bs, r, 10), l = cell(bs, r, 11);
  const hasAny = d || e || f || k || l;
  if (!label && !hasAny) continue;
  const parts = [
    `R${r + 1}`,
    label ? String(label.v).slice(0, 36) : "",
    fmt(d, 45), fmt(e), fmt(f, 45),
    fmt(k, 45), fmt(l, 45),
  ];
  console.log(parts.join(" | "));
}

// ============ BS GST detail block (H/I cols) ============
console.log("\n\n### BS GST DETAIL (H=GL name, I=amount raw):");
for (let r = 2; r < 28; r++) {
  const h = cell(bs, r, 7), i = cell(bs, r, 8);
  if (!h && !i) continue;
  console.log(`R${r + 1} | ${h ? String(h.v).slice(0, 36) : ""} | ${fmt(i)}`);
}

// ============ PL row 1-2 headers full (C..AE) to check mislabels ============
console.log("\n\n### NEW PL headers row 1-2 (C..AE):");
for (let c = 2; c <= 30; c++) {
  const a = cell(pl, 0, c), b = cell(pl, 1, c);
  if (!a && !b) continue;
  console.log(`${utils.encode_col(c)}: R1=${a ? String(a.v).slice(0, 24) : "-"} R2=${b ? String(b.v).slice(0, 20) : "-"}`);
}
