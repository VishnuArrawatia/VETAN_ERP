import { read, utils } from "xlsx";
import fs from "fs";

const P = "F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm";
const wb = read(P, { type: "file" });
const store = JSON.parse(fs.readFileSync("F:/Financial Report/mis-store.json", "utf-8"));
const stmt = (store.stmtPL || []) as any[];

const serToYm = (v: any): string => {
  if (typeof v !== "number") return "";
  const d = new Date(Date.UTC(1899, 11, 30)); d.setUTCDate(d.getUTCDate() + v);
  return d.getFullYear() === 1900 ? "" : d.toISOString().slice(0, 7);
};

for (const [sn, entity] of [["IWSR-SKR", "SAKAR"], ["IWSR-SVN", "SVN"]] as const) {
  const rows = utils.sheet_to_json(wb.Sheets[sn], { header: 1 }) as any[][];
  console.log(`\n===== ${sn} (${entity}) =====`);
  const byNat = new Map<string, Map<string, { n: number; tax: number }>>();
  const byMon = new Map<string, number>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || (r[26] == null && r[27] == null)) continue; // no qty/taxable => junk row
    const nat = String(r[0] ?? "—").trim();
    const ym = serToYm(r[1]);
    if (!ym) continue;
    const tax = Number(r[27]) || 0;
    byMon.set(ym, (byMon.get(ym) || 0) + tax);
    if (!byNat.has(nat)) byNat.set(nat, new Map());
    const m = byNat.get(nat)!;
    const o = m.get(ym) || { n: 0, tax: 0 };
    o.n++; o.tax += tax; m.set(ym, o);
  }
  console.log("months:", [...byMon.keys()].sort().join(", "));
  console.log("-- Nature-wise taxable (Cr) --");
  const nats = [...byNat.keys()].sort();
  for (const nat of nats) {
    const m = byNat.get(nat)!;
    const parts = [...m.entries()].sort().map(([ym, o]) => `${ym}:${(o.tax / 1e7).toFixed(2)}`).join("  ");
    const tot = [...m.values()].reduce((s, o) => s + o.tax, 0);
    console.log(`${nat} [${[...m.values()].reduce((s, o) => s + o.n, 0)} rows] = ${(tot / 1e7).toFixed(2)}Cr | ${parts}`);
  }
  // statement compare
  const st = stmt.filter((s) => s.entity === entity && s.fy === "FY-2026-27");
  console.log("-- Statement vs Register (Cr) --");
  for (const s of st) {
    const reg = byMon.get(s.month) || 0;
    const interC = [...byNat.entries()].filter(([nat]) => /inter/i.test(nat)).reduce((sum, [, m]) => sum + (m.get(s.month)?.tax || 0), 0);
    console.log(`${s.month}: stmt.sales=${(s.sales / 1e7).toFixed(2)} stmt.rev=${(s.revenue / 1e7).toFixed(2)} | register=${(reg / 1e7).toFixed(2)} (inter-co ${(interC / 1e7).toFixed(2)}) | reg-minus-inter=${((reg - interC) / 1e7).toFixed(2)}`);
  }
}
