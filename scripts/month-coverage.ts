import { read, utils } from "xlsx";
const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });

function serialToYm(v: any): string {
  if (typeof v !== "number") return String(v ?? "").slice(0, 10);
  const d = new Date(Date.UTC(1899, 11, 30) as any);
  d.setUTCDate(d.getUTCDate() + v);
  return d.toISOString().slice(0, 7);
}

for (const [nm, colL] of [["IWSR-SKR", "B"], ["IWSR-SVN", "B"], ["CN-SKR", "A"], ["CN-SVN", "A"]] as const) {
  const ws = wb.Sheets[nm];
  if (!ws) { console.log(`${nm}: MISSING`); continue; }
  const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
  const counts = new Map<string, number>();
  for (let r = 2; r <= last; r++) {
    const v = ws[colL + r]?.v;
    if (v == null) continue;
    const ym = serialToYm(v);
    counts.set(ym, (counts.get(ym) || 0) + 1);
  }
  console.log(`${nm}: ${[...counts.entries()].sort().map(([m, c]) => `${m}(${c})`).join(", ")}`);
}

// TB month columns with data (SAKAR: J..U)
const tb = wb.Sheets["Master-TB-Sakar"];
const tbLast = Number((tb["!ref"] as string).split(":")[1].replace(/\D/g, ""));
const monthNames = ["April","May","June","July","August","September","October","November","December","January","February","March"];
const cols = ["J","K","L","M","N","O","P","Q","R","S","T","U"];
cols.forEach((c, i) => {
  let nonZero = 0;
  for (let r = 3; r <= tbLast; r++) {
    const v = tb[c + r]?.v;
    if (typeof v === "number" && v !== 0) nonZero++;
  }
  if (nonZero > 0) console.log(`TB-SAKAR ${monthNames[i]}: ${nonZero} ledgers with data`);
});
