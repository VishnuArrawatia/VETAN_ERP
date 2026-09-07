import { read, utils } from "xlsx";
const wb = read("E:/Account Master/A-Sakar/11. Data/Loans/SVN Term Loan RPS Working till closure - Revised.xlsx", { type: "file" });

// --- Term Loan sheet: blocks at D,H,L,P,T,X (and maybe more) ---
const ws = wb.Sheets["Term Loan"];
const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));

// find all block starts: scan R2 for names, then verify R3 triplets
const blocks: { name: string; tot: string; pri: string; int: string }[] = [];
for (let c = 0; c < 40; c++) {
  const L = utils.encode_col(c);
  const nm = ws[L + "2"]?.v;
  if (nm == null || String(nm).trim() === "") continue;
  const pL = utils.encode_col(c + 1), iL = utils.encode_col(c + 2);
  const p3 = String(ws[pL + "3"]?.v ?? "").toLowerCase();
  const i3 = String(ws[iL + "3"]?.v ?? "").toLowerCase();
  if (p3.includes("princ") && i3.includes("int")) {
    blocks.push({ name: String(nm).trim(), tot: L, pri: pL, int: iL });
  }
}
console.log("TERM LOAN blocks:", blocks.map(b => `${b.name} (${b.tot}/${b.pri}/${b.int})`).join("\n  "));

// FY list + months format
const fys = new Set<string>();
let monthSamples: any[] = [];
for (let r = 4; r <= last; r++) {
  const a = ws["A" + r]?.v;
  if (a != null) fys.add(String(a).trim());
  if (monthSamples.length < 5) monthSamples.push(ws["B" + r]?.v);
}
console.log("FYs:", [...fys].join(", "));
console.log("Month samples (col B):", monthSamples);

// --- Car Loan sheet ---
const cw = wb.Sheets["Car Loan"];
console.log("\nCAR LOAN R1-R3:");
for (let r = 1; r <= 3; r++) {
  const parts: string[] = [`R${r}`];
  for (let c = 0; c < 10; c++) {
    const L = utils.encode_col(c);
    const v = cw[L + r]?.v;
    if (v !== undefined && v !== "") parts.push(`${L}=${String(v).slice(0, 28)}`);
  }
  console.log(parts.join(" | "));
}
// car loan month format
console.log("Car month samples:", [4, 5, 6].map(r => cw["B" + r]?.v));

// --- Other blocks in Term Loan beyond X? (AB..) ---
const extraBlocks: string[] = [];
for (let c = 26; c < 40; c++) {
  const L = utils.encode_col(c);
  const nm = ws[L + "2"]?.v;
  if (nm != null && String(nm).trim() !== "") extraBlocks.push(`${L}=${nm}`);
}
console.log("\nExtra blocks beyond Z:", extraBlocks.join(", ") || "none");

// --- 800123962 block (X/Y/Z) sample ---
console.log("\n800123962 sample 26-27 rows:");
let shown = 0; let cur = "";
for (let r = 4; r <= last && shown < 3; r++) {
  const a = ws["A" + r]?.v;
  if (a != null) cur = String(a).trim();
  if (cur === "26-27") {
    const x = ws["X" + r]?.v, y = ws["Y" + r]?.v, z = ws["Z" + r]?.v;
    console.log(`R${r}: X=${x} Y=${y} Z=${z}`);
    shown++;
  }
}
