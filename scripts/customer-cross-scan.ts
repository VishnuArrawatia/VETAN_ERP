import { read, utils } from "xlsx";
import fs from "fs";

const wb = read("F:/Financial Report/workbooks/Revised Group-Summary as on 31.08.26.xlsm", { type: "file" });

function norm(s: string): string {
  return String(s).toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+(PVT|PRIVATE)?\.?\s*(LTD|LIMITED|LLP|CO|COMPANY)\.?/g, "").replace(/\s+/g, " ").trim();
}

// entity -> code -> {name, sales}
const map: Record<string, Map<string, { name: string; sales: number }>> = { SAKAR: new Map(), SVN: new Map() };
const c = { code: "P", name: "Q", amt: "AB" };

for (const [entity, sheet] of [["SAKAR", "IWSR-SKR"], ["SVN", "IWSR-SVN"]] as const) {
  const ws = wb.Sheets[sheet];
  const last = Number((ws["!ref"] as string).split(":")[1].replace(/\D/g, ""));
  for (let r = 2; r <= last; r++) {
    const code = ws[c.code + r]?.v;
    if (code == null) continue;
    const key = String(code);
    const nm = String(ws[c.name + r]?.v ?? "");
    const amt = Number(ws[c.amt + r]?.v) || 0;
    const cur = map[entity].get(key) || { name: nm, sales: 0 };
    cur.sales += amt;
    if (nm) cur.name = nm;
    map[entity].set(key, cur);
  }
}

// normalize name -> entries across entities
const byName = new Map<string, { entity: string; code: string; name: string; sales: number }[]>();
for (const entity of ["SAKAR", "SVN"]) {
  for (const [code, v] of map[entity]) {
    const k = norm(v.name);
    if (!k) continue;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k)!.push({ entity, code, name: v.name, sales: v.sales });
  }
}

// cross-entity matches
const cross = [...byName.entries()].filter(([k, v]) => new Set(v.map(x => x.entity)).size >= 2)
  .sort((a, b) => b[1].reduce((s, x) => s + x.sales, 0) - a[1].reduce((s, x) => s + x.sales, 0));

console.log(`Total unique customers: SAKAR=${[...map.SAKAR.keys()].length}, SVN=${[...map.SVN.keys()].length}`);
console.log(`\nCROSS-ENTITY MATCHES (same normalized name in both companies): ${cross.length}`);
for (const [k, v] of cross.slice(0, 30)) {
  const tot = v.reduce((s, x) => s + x.sales, 0);
  console.log(`  ${k.slice(0, 40).padEnd(42)} | ${v.map(x => `${x.entity}:${x.code}(₹${(x.sales / 1e7).toFixed(1)}Cr)`).join(" , ")} | tot ₹${(tot / 1e7).toFixed(1)}Cr`);
}

// vendor-name vs customer-name matches (for vendor link candidates)
const pw = wb.Sheets["FG Purchase"];
const vendorNames = new Set<string>();
const vLast = Number((pw["!ref"] as string).split(":")[1].replace(/\D/g, ""));
for (let r = 3; r <= vLast; r++) {
  const v = pw["E" + r]?.v;
  if (v) vendorNames.add(norm(String(v)));
}
const vendMatch = cross.filter(([k]) => vendorNames.has(k));
console.log(`\nOf these, ALSO matching a FG-Purchase vendor name: ${vendMatch.length}`);
for (const [k] of vendMatch.slice(0, 15)) console.log("  " + k);

// save seed
const seed = cross.map(([k, v]) => ({
  group: k.slice(0, 60),
  name: v[0].name,
  autoDetected: true,
  links: v.map(x => ({ entity: x.entity, customerCode: x.code })),
}));
fs.writeFileSync("F:/Financial Report/customer-master.json", JSON.stringify({
  $comment: "CUSTOMER MASTER (group-level links). Ek hi party jo dono company me customer hai - uske saare codes yahan ek block me. Vendor code bhi jod sakte ho: {\"entity\":\"SAKAR\",\"vendorCode\":\"V00123\"}. App isi se Group-customer report banati hai.",
  customers: seed,
}, null, 2));
console.log(`\nSeed written: F:/Financial Report/customer-master.json (${seed.length} group customers)`);
